-- 0012: optional customer note for landing/checkout orders
--
-- The landing order form collects a free-text note (max 300 chars). It is
-- stored on the order so admins can read it from the dashboard later.
--
-- place_guest_order keeps every guard from 0007 (idempotency replay, stock
-- locks, per-variant caps, server-side delivery pricing) and only adds the
-- note. The 9-arg overload is dropped first so PostgREST never has two
-- candidates for the same call (same pattern as 0007).

alter table public.orders
  add column if not exists guest_note text
  constraint orders_guest_note_length
  check (guest_note is null or char_length(guest_note) <= 300);

drop function if exists
  public.place_guest_order(text, text, text, jsonb, text, text, text, integer, text);

create or replace function public.place_guest_order(
  p_guest_name text,
  p_guest_phone text,
  p_guest_address text,
  p_items jsonb,
  p_guest_email text default null,
  p_payment_method text default 'cod',
  p_idempotency_key text default null,
  p_wilaya_code integer default null,
  p_delivery_type text default 'home',
  p_guest_note text default null
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
  v_delivery_price numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_variant_id uuid;
  v_quantity integer;
  v_total_units integer := 0;
  v_effective_price numeric(10,2);
  v_unit_discount numeric(10,2);
  v_unit_price numeric(10,2);
  v_variant record;
  v_zone record;
  v_has_active_zones boolean := false;
  v_phone text;
  v_email text;
  v_guest_note text;
  v_payment_method text;
  v_delivery_type text;
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
      'delivery_price', o.delivery_price,
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

  -- ---- note: optional, trimmed and capped at 300 chars ----
  v_guest_note := nullif(left(trim(coalesce(p_guest_note, '')), 300), '');

  -- ---- payment method: COD only ----
  v_payment_method := coalesce(p_payment_method, 'cod');
  if v_payment_method <> 'cod' then
    raise exception 'Unsupported payment method';
  end if;

  -- ---- delivery type + server-side delivery price ----
  v_delivery_type := lower(trim(coalesce(p_delivery_type, 'home')));
  if v_delivery_type not in ('home', 'office') then
    raise exception 'Invalid delivery type';
  end if;

  select exists (
    select 1 from public.delivery_zones where is_active = true
  ) into v_has_active_zones;

  if v_has_active_zones then
    if p_wilaya_code is null then
      raise exception 'Wilaya is required';
    end if;

    select home_price, office_price
    into v_zone
    from public.delivery_zones
    where wilaya_code = p_wilaya_code
      and is_active = true;

    if not found then
      raise exception 'Delivery is not available for this wilaya';
    end if;

    v_delivery_price := case
      when v_delivery_type = 'office' then v_zone.office_price
      else v_zone.home_price
    end;
  else
    v_delivery_price := 0;
  end if;

  -- ---- create the order (race on idempotency_key -> return winner) ----
  begin
    insert into public.orders
      (guest_name, guest_phone, guest_email, guest_address, guest_note, payment_method,
       status, subtotal, discount_total, delivery_price, total,
       wilaya_code, delivery_type, idempotency_key)
    values
      (trim(p_guest_name), v_phone, v_email, trim(p_guest_address), v_guest_note,
       v_payment_method, 'pending', 0, 0, v_delivery_price, v_delivery_price,
       p_wilaya_code, v_delivery_type, v_key)
    returning id, confirmation_token into v_order_id, v_confirmation_token;
  exception when unique_violation then
    select jsonb_build_object(
      'order_id', o.id,
      'confirmation_token', o.confirmation_token,
      'subtotal', o.subtotal,
      'discount_total', o.discount_total,
      'delivery_price', o.delivery_price,
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

  v_total := v_subtotal - v_discount_total + v_delivery_price;

  update public.orders
  set subtotal = v_subtotal,
      discount_total = v_discount_total,
      delivery_price = v_delivery_price,
      total = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'confirmation_token', v_confirmation_token,
    'subtotal', v_subtotal,
    'discount_total', v_discount_total,
    'delivery_price', v_delivery_price,
    'total', v_total
  );
end;
$$;

revoke all on function
  public.place_guest_order(text, text, text, jsonb, text, text, text, integer, text, text)
  from public;
grant execute on function
  public.place_guest_order(text, text, text, jsonb, text, text, text, integer, text, text)
  to anon;
