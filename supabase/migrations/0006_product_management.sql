-- ============================================================
-- SnapShop - Migration 6: product management schema + image bucket
-- ============================================================
-- What this migration does:
--   1. products.size_type text NOT NULL DEFAULT 'none',
--      CHECK in ('none','clothing','shoes','custom').
--      Backfill: 'clothing' for products that already have size
--      variants, 'none' otherwise (the column default).
--   2. product_variants.color / color_hex / size become NULLABLE
--      (color_hex already was); new is_active boolean NOT NULL
--      DEFAULT true; new unique index on
--      (product_id, coalesce(color,''), coalesce(size,'')) so a
--      (product, color, size) combination can exist only once,
--      including NULL color/size. Pre-checked: existing data has
--      no duplicates under this definition.
--   3. product_images.color text NULLABLE (optional link of an
--      image to a color name); partial unique index so at most one
--      is_primary = true per product (pre-checked: no violations);
--      CHECK that url length is 1-2048.
--   4. RLS: the public product_variants read policy now also
--      requires product_variants.is_active = true (anon can no
--      longer read inactive variants). products / images / reviews
--      policies unchanged. orders / order_items untouched.
--   5. place_guest_order: same 7-arg signature, every 0004 guard
--      kept (caps, phone/email/payment, idempotency, uuid check,
--      per-variant aggregate cap, deterministic locking, discount
--      cap/floor, inactive-product rejection, same return shape);
--      additionally rejects is_active = false variants with
--      'Product variant is not available'. SECURITY DEFINER with
--      search_path = '' preserved.
--   6. Storage: public bucket "product-images" (5 MB limit,
--      jpeg/png/webp only) + ONE public SELECT policy on that
--      bucket. NO insert/update/delete policies for anon or
--      authenticated: uploads happen only with the service-role
--      key inside server actions.
--
-- Idempotency / safety:
--   - ADD COLUMN IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS /
--     DROP POLICY IF EXISTS / constraint guards via pg_constraint /
--     bucket upsert via ON CONFLICT (id) DO UPDATE.
--   - Backfill only touches rows still on the default ('none').
--   - No data loss: nullable changes only widen; the new unique
--     index was pre-verified against existing rows.
--
-- Manual test plan (rollback-style DO blocks, then delete rows):
--   -- 1) inactive variant rejected:
--   -- update public.product_variants set is_active = false
--   --   where id = '<variant>';
--   -- select public.place_guest_order('T','+1000000000','Addr',
--   --   '[{"variant_id":"<variant>","quantity":1}]'::jsonb);
--   -- expect: 'Product variant is not available'
--   -- 2) duplicate (product,color,size) rejected by
--   --    uq_variants_product_color_size (incl. NULL color/size).
--   -- 3) second is_primary = true for the same product rejected by
--   --    uq_images_one_primary.
--   -- 4) variant with NULL color AND NULL size can be ordered.
--   -- 5) anon (PostgREST) cannot SELECT an inactive variant, but
--   --    can still SELECT active ones.
-- ============================================================

-- ------------------------------------------------------------
-- 1) products.size_type
-- ------------------------------------------------------------
alter table public.products
  add column if not exists size_type text not null default 'none';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_size_type_check'
  ) then
    alter table public.products
      add constraint products_size_type_check
      check (size_type in ('none', 'clothing', 'shoes', 'custom'));
  end if;
end;
$$;

-- Backfill: products that already have size variants are clothing.
-- (All pre-0006 variants carry a size, so this is every product
-- that has at least one variant.)
update public.products
set size_type = 'clothing'
where size_type = 'none'
  and id in (select distinct product_id from public.product_variants);

-- ------------------------------------------------------------
-- 2) product_variants: nullable color/size, is_active, uniqueness
-- ------------------------------------------------------------
alter table public.product_variants
  alter column color drop not null;

alter table public.product_variants
  alter column size drop not null;

alter table public.product_variants
  add column if not exists is_active boolean not null default true;

create unique index if not exists uq_variants_product_color_size
  on public.product_variants
    (product_id, (coalesce(color, '')), (coalesce(size, '')));

-- ------------------------------------------------------------
-- 3) product_images: color link, single primary, url length
-- ------------------------------------------------------------
alter table public.product_images
  add column if not exists color text;

create unique index if not exists uq_images_one_primary
  on public.product_images (product_id)
  where is_primary = true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_images_url_length'
  ) then
    alter table public.product_images
      add constraint product_images_url_length
      check (char_length(url) >= 1 and char_length(url) <= 2048);
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 4) RLS: public variant reads require variant is_active
-- ------------------------------------------------------------
drop policy if exists "product_variants_public_read" on public.product_variants;

create policy "product_variants_public_read" on public.product_variants
  for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_active = true
    )
  );

-- ------------------------------------------------------------
-- 5) place_guest_order: same signature, plus inactive-variant guard
-- ------------------------------------------------------------
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

  -- ---- pre-validate items: uuid format, per-variant aggregate cap ----
  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    where e.value->>'variant_id' is null
       or e.value->>'variant_id' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ) then
    raise exception 'Invalid product variant id';
  end if;

  if exists (
    select 1
    from (
      select
        e.value->>'variant_id' as vid,
        sum(
          case
            when e.value->>'quantity' ~ '^[0-9]+$'
            then (e.value->>'quantity')::integer
            else -1
          end
        ) as total_qty
      from jsonb_array_elements(p_items) e
      group by e.value->>'variant_id'
    ) s
    where s.total_qty <= 0 or s.total_qty > 10
  ) then
    raise exception 'Invalid quantity: max 10 units per variant (allowed 1-10 in total)';
  end if;

  -- ---- lock all requested variants up-front in deterministic order ----
  perform 1
  from public.product_variants
  where id in (
    select distinct (e.value->>'variant_id')::uuid
    from jsonb_array_elements(p_items) e
  )
  order by id
  for update;

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
      pv.is_active as variant_is_active,
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

    if not v_variant.variant_is_active then
      raise exception 'Product variant is not available';
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

    -- cap discount at the effective price so unit price never goes negative
    v_unit_discount := least(v_unit_discount, v_effective_price);
    v_unit_price := greatest(0, v_effective_price - v_unit_discount);

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
-- 6) Storage: public product-images bucket, read-only for anon
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, '{image/jpeg,image/png,image/webp}')
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = '{image/jpeg,image/png,image/webp}';

drop policy if exists "product-images public read" on storage.objects;

create policy "product-images public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

-- NOTE: deliberately NO insert/update/delete policies on storage.objects
-- for anon/authenticated: uploads and deletes go through the
-- service-role key inside admin server actions only.
