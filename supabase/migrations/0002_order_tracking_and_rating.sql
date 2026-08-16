-- ============================================================
-- SnapShop - Migration 2: order tracking + auto rating
-- ============================================================

-- 1) ORDER TRACKING: confirmation token on orders
alter table public.orders
  add column confirmation_token uuid not null unique default gen_random_uuid();

-- 2) Update place_guest_order to also return confirmation_token
create or replace function public.place_guest_order(
  p_guest_name text,
  p_guest_phone text,
  p_guest_address text,
  p_items jsonb,
  p_guest_email text default null,
  p_payment_method text default 'cod'
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
  v_effective_price numeric(10,2);
  v_unit_discount numeric(10,2);
  v_unit_price numeric(10,2);
  v_variant record;
begin
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

  insert into public.orders
    (guest_name, guest_phone, guest_email, guest_address, payment_method, status, subtotal, discount_total, total)
  values
    (trim(p_guest_name), trim(p_guest_phone), p_guest_email, trim(p_guest_address), p_payment_method, 'pending', 0, 0, 0)
  returning id, confirmation_token into v_order_id, v_confirmation_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_variant_id := (v_item->>'variant_id')::uuid;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);

    if v_quantity <= 0 then
      raise exception 'Invalid quantity for variant %', v_variant_id;
    end if;

    select
      p.id as product_id,
      p.name as product_name,
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

-- 3) get_order_by_token: guest order lookup by confirmation token
create or replace function public.get_order_by_token(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'order_id', o.id,
    'status', o.status,
    'subtotal', o.subtotal,
    'discount_total', o.discount_total,
    'total', o.total,
    'created_at', o.created_at,
    'guest_name', o.guest_name,
    'items', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'product_name', oi.product_name,
          'color', oi.color,
          'size', oi.size,
          'quantity', oi.quantity,
          'unit_price_at_purchase', oi.unit_price_at_purchase
        ) order by oi.created_at)
        from public.order_items oi
        where oi.order_id = o.id
      ),
      '[]'::jsonb
    )
  )
  into v_result
  from public.orders o
  where o.confirmation_token = p_token;

  return v_result;
end;
$$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon;

-- 4) Auto-computed product rating
create or replace function public.recalculate_product_rating()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_product_id uuid;
begin
  if (TG_OP = 'DELETE') then
    v_product_id := old.product_id;
  else
    v_product_id := new.product_id;
  end if;

  update public.products
  set rating = coalesce(
    (
      select round(avg(r.rating), 1)
      from public.reviews r
      where r.product_id = v_product_id
        and r.is_approved = true
    ),
    0
  )
  where id = v_product_id;

  if (TG_OP = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

create trigger reviews_rating_trigger
  after insert or update or delete on public.reviews
  for each row execute function public.recalculate_product_rating();
