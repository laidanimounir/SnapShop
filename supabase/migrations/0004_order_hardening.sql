-- ============================================================
-- SnapShop - Migration 4: order hardening
-- ============================================================
-- What this migration fixes (vs 0001-0003):
--   1. place_guest_order accepted variants of INACTIVE products
--      -> now rejects them (p.is_active = true required).
--   2. No caps on items/quantities (oversized payloads, stock drain)
--      -> max 50 distinct items, max 10 units per variant,
--         max 100 total units per order.
--   3. No server-side phone/email/payment validation
--      -> phone is normalized server-side (digits + optional leading +,
--         6-15 digits) and rejected otherwise; email format-checked
--         when provided; payment_method restricted to 'cod'
--         (also enforced by a table CHECK).
--   4. Retried checkouts created duplicate orders
--      -> optional p_idempotency_key (text): an existing order with
--         the same key is returned (same shape, incl. confirmation
--         token) instead of inserting a duplicate. Backed by
--         orders.idempotency_key + a unique partial index.
--   5. Cancelling an order never restored stock
--      -> restore_stock_on_cancel() trigger adds quantities back
--         exactly once per order (OLD.status guard).
--   6. submit_review accepted ratings/products blindly
--      -> validates rating 1-5, product existence + is_active,
--         reviewer_name length, comment length (<= 2000, also a
--         table CHECK).
--
-- Backward compatibility:
--   - place_guest_order keeps all existing params in order and only
--     APPENDS p_idempotency_key with a DEFAULT, so old 6-arg calls
--     still work. (The old 6-arg overload is dropped first so it
--     cannot shadow the hardened version.)
--   - submit_review signature is unchanged (CREATE OR REPLACE).
--   - Return shapes are unchanged; replays return the same keys.
--
-- Idempotency of this file:
--   - ADD COLUMN IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS /
--     DROP TRIGGER IF EXISTS / constraint guards via pg_constraint /
--     DROP FUNCTION IF EXISTS for the replaced overload.
--
-- Manual test plan (run in SQL editor after applying, then delete
-- the rows you create):
--   -- 1) inactive product rejected:
--   -- update public.products set is_active = false where id = '<id>';
--   -- select public.place_guest_order('T','+1000000000','Addr',
--   --   '[{"variant_id":"<variant-of-inactive>","quantity":1}]'::jsonb);
--   -- expect: 'Product ... is not available'
--   -- 2) caps: quantity 11 -> 'Invalid quantity'; 51 items ->
--   -- 'Too many distinct items'; total units > 100 -> 'Too many units'
--   -- 3) bad phone 'abc' -> 'Invalid phone number'; bad email
--   -- 'not-an-email' -> 'Invalid email address'; payment 'card' ->
--   -- 'Unsupported payment method'
--   -- 4) idempotency: call twice with p_idempotency_key => 'k1';
--   -- expect same order_id + confirmation_token, one orders row
--   -- 5) cancel: update public.orders set status = 'cancelled'
--   -- where id = '<id>'; expect product_variants.stock_quantity
--   -- restored; repeat the update -> stock unchanged (no double)
--   -- 6) review: rating 6 -> error; comment of 2001 chars -> error
-- ============================================================

-- ------------------------------------------------------------
-- 1) orders.idempotency_key + payment_method CHECK
-- ------------------------------------------------------------
alter table public.orders
  add column if not exists idempotency_key text;

create unique index if not exists uq_orders_idempotency_key
  on public.orders (idempotency_key)
  where idempotency_key is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_cod'
  ) then
    alter table public.orders
      add constraint orders_payment_method_cod
      check (payment_method in ('cod'));
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2) reviews length CHECKs
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reviews_comment_max_length'
  ) then
    alter table public.reviews
      add constraint reviews_comment_max_length
      check (comment is null or char_length(comment) <= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'reviews_reviewer_name_length'
  ) then
    alter table public.reviews
      add constraint reviews_reviewer_name_length
      check (char_length(reviewer_name) >= 1 and char_length(reviewer_name) <= 120);
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 3) Hardened place_guest_order (drops the old 6-arg overload
--    first so old calls resolve to this version via the default)
-- ------------------------------------------------------------
drop function if exists
  public.place_guest_order(text, text, text, jsonb, text, text);

create or replace function public.place_guest_order(
  p_guest_name text,
  p_guest_phone text,
  p_guest_address text,
  p_items jsonb,
  p_guest_email text default null,
  p_payment_method text default 'cod',
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_confirmation_token uuid;
  v_subtotal numeric(10,2) := 0;
  v_discount_total numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
  v_total_units integer := 0;
  v_effective_price numeric(10,2);
  v_unit_discount numeric(10,2);
  v_unit_price numeric(10,2);
  v_variant record;
  v_phone text;
  v_email text;
  v_payment_method text;
  v_key text;
  v_existing jsonb;
begin
  -- ---- idempotency key: replay returns the existing order ----
  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');

  if v_key is not null then
    select jsonb_build_object(
      'order_id', o.id,
      'confirmation_token', o.confirmation_token,
      'subtotal', o.subtotal,
      'discount_total', o.discount_total,
      'total', o.total
    )
    into v_existing
    from public.orders o
    where o.idempotency_key = v_key;

    if found then
      return v_existing;
    end if;
  end if;

  -- ---- basic input validation ----
  if p_guest_name is null or length(trim(p_guest_name)) = 0 then
    raise exception 'Guest name is required';
  end if;
  if p_guest_phone is null or length(trim(p_guest_phone)) = 0 then
    raise exception 'Guest phone is required';
  end if;
  if p_guest_address is null or length(trim(p_guest_address)) = 0 then
    raise exception 'Guest address is required';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Too many distinct items (max 50)';
  end if;

  -- ---- phone: normalize then validate (digits, optional +, 6-15) ----
  v_phone := regexp_replace(trim(p_guest_phone), '[\s\-\(\)\.]', '', 'g');
  if v_phone !~ '^\+?[0-9]{6,15}$' then
    raise exception 'Invalid phone number';
  end if;

  -- ---- email: optional, format-checked when provided ----
  v_email := nullif(trim(coalesce(p_guest_email, '')), '');
  if v_email is not null
    and v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'Invalid email address';
  end if;

  -- ---- payment method: COD only ----
  v_payment_method := coalesce(p_payment_method, 'cod');
  if v_payment_method <> 'cod' then
    raise exception 'Unsupported payment method';
  end if;

  -- ---- create the order (race on idempotency_key -> return winner) ----
  begin
    insert into public.orders
      (guest_name, guest_phone, guest_email, guest_address, payment_method, status, subtotal, discount_total, total, idempotency_key)
    values
      (trim(p_guest_name), v_phone, v_email, trim(p_guest_address), v_payment_method, 'pending', 0, 0, 0, v_key)
    returning id, confirmation_token into v_order_id, v_confirmation_token;
  exception when unique_violation then
    select jsonb_build_object(
      'order_id', o.id,
      'confirmation_token', o.confirmation_token,
      'subtotal', o.subtotal,
      'discount_total', o.discount_total,
      'total', o.total
    )
    into v_existing
    from public.orders o
    where o.idempotency_key = v_key;

    if found then
      return v_existing;
    end if;
    raise;
  end;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);

    if v_quantity <= 0 or v_quantity > 10 then
      raise exception 'Invalid quantity for variant % (allowed 1-10)', v_variant_id;
    end if;

    v_total_units := v_total_units + v_quantity;
    if v_total_units > 100 then
      raise exception 'Too many units in one order (max 100)';
    end if;

    select
      p.id as product_id,
      p.name as product_name,
      p.is_active as is_active,
      coalesce(pv.price, p.base_price) as effective_price,
      p.discount_percentage,
      p.discount_amount,
      pv.color,
      pv.size,
      pv.stock_quantity
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = v_variant_id
    for update of pv;

    if not found then
      raise exception 'Product variant % not found', v_variant_id;
    end if;

    if not v_variant.is_active then
      raise exception 'Product % is not available', v_variant.product_name;
    end if;

    if v_variant.stock_quantity < v_quantity then
      raise exception 'Insufficient stock for variant %', v_variant_id;
    end if;

    v_effective_price := v_variant.effective_price;

    if v_variant.discount_percentage > 0 then
      v_unit_discount := round((v_effective_price * v_variant.discount_percentage / 100.0)::numeric, 2);
    elsif v_variant.discount_amount > 0 then
      v_unit_discount := v_variant.discount_amount;
    else
      v_unit_discount := 0;
    end if;

    v_unit_price := v_effective_price - v_unit_discount;

    insert into public.order_items
      (order_id, product_variant_id, product_id, product_name, color, size, quantity, unit_price_at_purchase, discount_amount_at_purchase)
    values
      (v_order_id, v_variant_id, v_variant.product_id, v_variant.product_name, v_variant.color, v_variant.size, v_quantity, v_unit_price, v_unit_discount);

    update public.product_variants
    set stock_quantity = stock_quantity - v_quantity
    where id = v_variant_id;

    v_subtotal := v_subtotal + (v_effective_price * v_quantity);
    v_discount_total := v_discount_total + (v_unit_discount * v_quantity);
  end loop;

  v_total := v_subtotal - v_discount_total;

  update public.orders
  set subtotal = v_subtotal, discount_total = v_discount_total, total = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'confirmation_token', v_confirmation_token,
    'subtotal', v_subtotal,
    'discount_total', v_discount_total,
    'total', v_total
  );
end;
$$;

revoke all on function public.place_guest_order(text, text, text, jsonb, text, text, text) from public;
grant execute on function public.place_guest_order(text, text, text, jsonb, text, text, text) to anon;

-- ------------------------------------------------------------
-- 4) Hardened submit_review (signature unchanged)
-- ------------------------------------------------------------
create or replace function public.submit_review(
  p_product_id uuid,
  p_reviewer_name text,
  p_rating integer,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_review_id uuid;
  v_name text;
begin
  v_name := trim(coalesce(p_reviewer_name, ''));
  if v_name = '' then
    raise exception 'Reviewer name is required';
  end if;
  if char_length(v_name) > 120 then
    raise exception 'Reviewer name is too long (max 120 characters)';
  end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;
  if p_comment is not null and char_length(p_comment) > 2000 then
    raise exception 'Comment is too long (max 2000 characters)';
  end if;

  perform 1
  from public.products p
  where p.id = p_product_id
    and p.is_active = true;

  if not found then
    raise exception 'Product is not available';
  end if;

  insert into public.reviews (product_id, reviewer_name, rating, comment)
  values (p_product_id, v_name, p_rating, p_comment)
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.submit_review(uuid, text, integer, text) from public;
grant execute on function public.submit_review(uuid, text, integer, text) to anon;

-- ------------------------------------------------------------
-- 5) restore_stock_on_cancel: give stock back exactly once
-- ------------------------------------------------------------
create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only on a transition INTO cancelled from a stock-holding state.
  -- Re-updating an already-cancelled order is a no-op (idempotent).
  if (NEW.status = 'cancelled' and OLD.status <> 'cancelled') then
    update public.product_variants pv
    set stock_quantity = pv.stock_quantity + oi.quantity
    from public.order_items oi
    where oi.order_id = NEW.id
      and oi.product_variant_id = pv.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists orders_restore_stock_on_cancel on public.orders;

create trigger orders_restore_stock_on_cancel
  after update of status on public.orders
  for each row execute function public.restore_stock_on_cancel();
