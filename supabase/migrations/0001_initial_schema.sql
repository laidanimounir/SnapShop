-- ============================================================
-- SnapShop - Initial Database Schema
-- Guest-checkout e-commerce: products, variants, orders, reviews
-- ============================================================

-- ------------------------------------------------------------
-- Helper: auto-update updated_at
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- products
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text,
  brand text,
  base_price numeric(10,2) not null check (base_price >= 0),
  discount_percentage numeric(5,2) not null default 0 check (discount_percentage >= 0),
  discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0),
  rating numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_discount_mutually_exclusive
    check (discount_percentage = 0 or discount_amount = 0)
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ============================================================
-- product_images
-- ============================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  position integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- product_variants
-- ============================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color text not null,
  color_hex text,
  size text not null,
  price numeric(10,2) check (price is null or price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sku text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_unique_variant unique (product_id, color, size)
);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ============================================================
-- orders
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  guest_address text not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  payment_method text not null default 'cod',
  subtotal numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- order_items
-- ============================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  color text,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price_at_purchase numeric(10,2) not null,
  discount_amount_at_purchase numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- reviews
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Guest order creation (SECURITY DEFINER)
-- Validates stock, computes totals server-side, snapshots prices.
-- ============================================================
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
  returning id into v_order_id;

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
    'subtotal', v_subtotal,
    'discount_total', v_discount_total,
    'total', v_total
  );
end;
$$;

-- ============================================================
-- Guest review submission (SECURITY DEFINER)
-- ============================================================
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
begin
  if p_reviewer_name is null or length(trim(p_reviewer_name)) = 0 then
    raise exception 'Reviewer name is required';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  insert into public.reviews (product_id, reviewer_name, rating, comment)
  values (p_product_id, trim(p_reviewer_name), p_rating, p_comment)
  returning id into v_review_id;

  return v_review_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

-- Public read: active products
create policy "products_public_read_active" on public.products
  for select to anon, authenticated
  using (is_active = true);

-- Public read: images of active products
create policy "product_images_public_read" on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active = true
    )
  );

-- Public read: variants of active products
create policy "product_variants_public_read" on public.product_variants
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_active = true
    )
  );

-- Public read: approved reviews only
create policy "reviews_public_read_approved" on public.reviews
  for select to anon, authenticated
  using (is_approved = true);

-- No policies on orders / order_items: anon has NO direct access.
-- All writes go through the SECURITY DEFINER functions above.

-- ============================================================
-- Grants
-- ============================================================
revoke all on function public.place_guest_order(text, text, text, jsonb, text, text) from public;
grant execute on function public.place_guest_order(text, text, text, jsonb, text, text) to anon;

revoke all on function public.submit_review(uuid, text, integer, text) from public;
grant execute on function public.submit_review(uuid, text, integer, text) to anon;

-- ============================================================
-- Indexes
-- ============================================================
create index idx_products_category on public.products(category);
create index idx_products_brand on public.products(brand);
create index idx_products_is_active on public.products(is_active);

create index idx_product_images_product on public.product_images(product_id);

create index idx_product_variants_product on public.product_variants(product_id);

create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);

create index idx_order_items_order on public.order_items(order_id);
create index idx_order_items_variant on public.order_items(product_variant_id);
create index idx_order_items_product on public.order_items(product_id);

create index idx_reviews_product on public.reviews(product_id);
create index idx_reviews_is_approved on public.reviews(is_approved);
