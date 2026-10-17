-- ============================================================
-- SnapShop - Migration 7: delivery zones and order statuses
-- ============================================================
-- What this migration does:
--   1. delivery_zones: the 58 Algerian wilayas with Arabic and
--      French names, home/office delivery prices and an is_active
--      flag. Seeded with home 600 / office 400 (editable from the
--      admin UI via the service role). RLS ON: anon/authenticated
--      may SELECT active rows only; there are NO write policies and
--      no write grants. No free-delivery threshold.
--   2. orders: wilaya_code, delivery_type ('home'|'office'),
--      delivery_price, admin_note and status_updated_at.
--      Semantics: total = subtotal - discount_total + delivery_price.
--      Existing rows get delivery_price = 0, so their total is
--      unchanged.
--   3. Statuses: the old CHECK (pending, confirmed, shipped,
--      delivered, cancelled) is replaced by
--      (pending, confirmed, no_answer, shipped, delivered,
--       cancelled, returned). All previous values remain valid.
--   4. order_status_history: one row per status change. RLS ON with
--      NO client policies and NO grants: written only by the
--      SECURITY DEFINER trigger below and read by the service role.
--   5. restore_stock_on_cancel(): now restores stock on a transition
--      INTO cancelled OR returned, only from stock-holding states
--      (pending, confirmed, no_answer, shipped). It never restores
--      from delivered, and it forbids reopening cancelled/returned
--      orders. The OLD.status guard makes the restore happen at
--      most once.
--   6. place_guest_order: same guards as 0004/0006 plus wilaya and
--      delivery type. The delivery price is computed SERVER-SIDE
--      from delivery_zones (unknown or inactive wilaya rejected;
--      wilaya required whenever at least one active zone exists).
--      The previous overload is dropped so exactly ONE
--      place_guest_order exists.
--   7. get_order_by_token: also returns status, wilaya_code,
--      wilaya names, delivery_type and delivery_price.
--
-- Where forward transitions are enforced:
--   The database trigger enforces only the two invariants that must
--   never be bypassed (no reopening cancelled/returned, restore once).
--   The forward transition graph is enforced in the application:
--     pending    -> confirmed | no_answer | cancelled
--     confirmed  -> shipped | cancelled
--     no_answer  -> confirmed | cancelled
--     shipped    -> delivered | returned
--     delivered / cancelled / returned -> (terminal)
--   See src/lib/admin/order-transitions.ts (Step 5). Service-role
--   callers can still move rows directly with SQL, but stock and
--   history invariants remain protected by the triggers here.
--
-- Manual test plan (rollback-style DO blocks; each ends with
-- RAISE EXCEPTION so nothing is persisted):
--   -- 1) delivery price: wilaya 16 (Alger) home => 600,
--   --    office => 400; wilaya 1 (Adrar) => 600/400. total equals
--   --    subtotal - discount + delivery.
--   -- 2) unknown/inactive wilaya => 'Delivery is not available for
--   --    this wilaya'; null wilaya while active zones exist =>
--   --    'Wilaya is required'.
--   -- 3) idempotent replay returns the same order_id/total.
--   -- 4) update status => one order_status_history row.
--   -- 5) returned restores stock exactly once.
--   -- 6) delivered -> cancelled does not restore stock.
--   -- 7) cancelled/returned cannot be reopened.
-- ============================================================

-- ------------------------------------------------------------
-- 1) delivery_zones
-- ------------------------------------------------------------
create table if not exists public.delivery_zones (
  wilaya_code integer primary key
    check (wilaya_code >= 1 and wilaya_code <= 58),
  name_ar text not null,
  name_fr text not null,
  home_price numeric(10,2) not null default 0
    check (home_price >= 0),
  office_price numeric(10,2) not null default 0
    check (office_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.delivery_zones
  (wilaya_code, name_ar, name_fr, home_price, office_price)
values
  ( 1, 'أدرار',            'Adrar',               600, 400),
  ( 2, 'الشلف',            'Chlef',               600, 400),
  ( 3, 'الأغواط',          'Laghouat',            600, 400),
  ( 4, 'أم البواقي',       'Oum El Bouaghi',      600, 400),
  ( 5, 'باتنة',            'Batna',               600, 400),
  ( 6, 'بجاية',            'Béjaïa',              600, 400),
  ( 7, 'بسكرة',            'Biskra',              600, 400),
  ( 8, 'بشار',             'Béchar',              600, 400),
  ( 9, 'البليدة',          'Blida',               600, 400),
  (10, 'البويرة',          'Bouira',              600, 400),
  (11, 'تمنراست',          'Tamanrasset',         600, 400),
  (12, 'تبسة',             'Tébessa',             600, 400),
  (13, 'تلمسان',           'Tlemcen',             600, 400),
  (14, 'تيارت',            'Tiaret',              600, 400),
  (15, 'تيزي وزو',         'Tizi Ouzou',          600, 400),
  (16, 'الجزائر',          'Alger',               600, 400),
  (17, 'الجلفة',           'Djelfa',              600, 400),
  (18, 'جيجل',             'Jijel',               600, 400),
  (19, 'سطيف',             'Sétif',               600, 400),
  (20, 'سعيدة',            'Saïda',               600, 400),
  (21, 'سكيكدة',           'Skikda',              600, 400),
  (22, 'سيدي بلعباس',      'Sidi Bel Abbès',      600, 400),
  (23, 'عنابة',            'Annaba',              600, 400),
  (24, 'قالمة',            'Guelma',              600, 400),
  (25, 'قسنطينة',          'Constantine',         600, 400),
  (26, 'المدية',           'Médéa',               600, 400),
  (27, 'مستغانم',          'Mostaganem',          600, 400),
  (28, 'المسيلة',          'M''Sila',             600, 400),
  (29, 'معسكر',            'Mascara',             600, 400),
  (30, 'ورقلة',            'Ouargla',             600, 400),
  (31, 'وهران',            'Oran',                600, 400),
  (32, 'البيض',            'El Bayadh',           600, 400),
  (33, 'إليزي',            'Illizi',              600, 400),
  (34, 'برج بوعريريج',     'Bordj Bou Arréridj',  600, 400),
  (35, 'بومرداس',          'Boumerdès',           600, 400),
  (36, 'الطارف',           'El Tarf',             600, 400),
  (37, 'تندوف',            'Tindouf',             600, 400),
  (38, 'تيسمسيلت',         'Tissemsilt',          600, 400),
  (39, 'الوادي',           'El Oued',             600, 400),
  (40, 'خنشلة',            'Khenchela',           600, 400),
  (41, 'سوق أهراس',        'Souk Ahras',          600, 400),
  (42, 'تيبازة',           'Tipaza',              600, 400),
  (43, 'ميلة',             'Mila',                600, 400),
  (44, 'عين الدفلى',       'Aïn Defla',           600, 400),
  (45, 'النعامة',          'Naâma',               600, 400),
  (46, 'عين تموشنت',       'Aïn Témouchent',      600, 400),
  (47, 'غرداية',           'Ghardaïa',            600, 400),
  (48, 'غليزان',           'Relizane',            600, 400),
  (49, 'تيميمون',          'Timimoun',            600, 400),
  (50, 'برج باجي مختار',   'Bordj Badji Mokhtar', 600, 400),
  (51, 'أولاد جلال',       'Ouled Djellal',       600, 400),
  (52, 'بني عباس',         'Béni Abbès',          600, 400),
  (53, 'عين صالح',         'In Salah',            600, 400),
  (54, 'عين قزام',         'In Guezzam',          600, 400),
  (55, 'تقرت',             'Touggourt',           600, 400),
  (56, 'جانت',             'Djanet',              600, 400),
  (57, 'المغير',           "El M'Ghair",          600, 400),
  (58, 'المنيعة',          'El Meniaa',           600, 400)
on conflict (wilaya_code) do nothing;

alter table public.delivery_zones enable row level security;

drop policy if exists delivery_zones_public_read on public.delivery_zones;

create policy delivery_zones_public_read on public.delivery_zones
  for select to anon, authenticated
  using (is_active = true);

revoke all on public.delivery_zones from anon, authenticated;
grant select on public.delivery_zones to anon, authenticated;

-- ------------------------------------------------------------
-- 2) orders: delivery + admin fields
-- ------------------------------------------------------------
alter table public.orders
  add column if not exists wilaya_code integer;

alter table public.orders
  add column if not exists delivery_type text not null default 'home';

alter table public.orders
  add column if not exists delivery_price numeric(10,2) not null default 0;

alter table public.orders
  add column if not exists admin_note text;

alter table public.orders
  add column if not exists status_updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_delivery_type_check'
  ) then
    alter table public.orders
      add constraint orders_delivery_type_check
      check (delivery_type in ('home', 'office'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_delivery_price_nonneg'
  ) then
    alter table public.orders
      add constraint orders_delivery_price_nonneg
      check (delivery_price >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_wilaya_code_range'
  ) then
    alter table public.orders
      add constraint orders_wilaya_code_range
      check (wilaya_code is null or (wilaya_code >= 1 and wilaya_code <= 58));
  end if;
end;
$$;

create index if not exists idx_orders_status_created
  on public.orders (status, created_at desc);

-- ------------------------------------------------------------
-- 3) statuses: replace the CHECK, keeping old values valid
-- ------------------------------------------------------------
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;

  alter table public.orders
    add constraint orders_status_check
    check (status in (
      'pending','confirmed','no_answer','shipped',
      'delivered','cancelled','returned'
    ));
end;
$$;

-- ------------------------------------------------------------
-- 4) order_status_history + trigger
-- ------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order
  on public.order_status_history (order_id, changed_at);

alter table public.order_status_history enable row level security;
revoke all on public.order_status_history from anon, authenticated;

-- Keep status_updated_at in sync (BEFORE, so the AFTER logger sees NEW).
create or replace function public.touch_order_status_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if NEW.status is distinct from OLD.status then
    -- clock_timestamp() (not now()) so a later update in the same
    -- transaction still records a strictly newer timestamp.
    NEW.status_updated_at := clock_timestamp();
  end if;
  return NEW;
end;
$$;

drop trigger if exists orders_touch_status_updated_at on public.orders;

create trigger orders_touch_status_updated_at
  before update of status on public.orders
  for each row execute function public.touch_order_status_updated_at();

-- One history row per effective status change. SECURITY DEFINER so
-- it can insert while the table has no client policies. The optional
-- note comes from a transaction-local setting:
--   select set_config('app.order_status_note', 'reason', true);
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text;
  v_changed_by uuid;
begin
  if NEW.status is distinct from OLD.status then
    begin
      v_note := nullif(current_setting('app.order_status_note', true), '');
    exception when others then
      v_note := null;
    end;

    begin
      v_changed_by := auth.uid();
    exception when others then
      v_changed_by := null;
    end;

    insert into public.order_status_history
      (order_id, old_status, new_status, changed_by, note)
    values
      (NEW.id, OLD.status, NEW.status, v_changed_by, v_note);
  end if;
  return NEW;
end;
$$;

drop trigger if exists orders_log_status_change on public.orders;

create trigger orders_log_status_change
  after update of status on public.orders
  for each row execute function public.log_order_status_change();

-- ------------------------------------------------------------
-- 5) restore_stock_on_cancel: cancelled OR returned, once
-- ------------------------------------------------------------
create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Terminal states cannot be reopened (they already restored stock).
  if OLD.status in ('cancelled', 'returned')
     and NEW.status is distinct from OLD.status then
    raise exception '% orders cannot be reopened', OLD.status;
  end if;

  -- Restore once, only from stock-holding states. Delivered means the
  -- goods were received, so nothing is restored from it.
  if NEW.status in ('cancelled', 'returned')
     and OLD.status in ('pending', 'confirmed', 'no_answer', 'shipped') then
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

-- ------------------------------------------------------------
-- 6) place_guest_order: + wilaya + delivery type + delivery price
-- ------------------------------------------------------------
drop function if exists
  public.place_guest_order(text, text, text, jsonb, text, text, text);
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
  p_delivery_type text default 'home'
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
      (guest_name, guest_phone, guest_email, guest_address, payment_method,
       status, subtotal, discount_total, delivery_price, total,
       wilaya_code, delivery_type, idempotency_key)
    values
      (trim(p_guest_name), v_phone, v_email, trim(p_guest_address),
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
  public.place_guest_order(text, text, text, jsonb, text, text, text, integer, text)
  from public;
grant execute on function
  public.place_guest_order(text, text, text, jsonb, text, text, text, integer, text)
  to anon;

-- ------------------------------------------------------------
-- 7) get_order_by_token: + wilaya / delivery fields
-- ------------------------------------------------------------
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
    'delivery_price', o.delivery_price,
    'total', o.total,
    'created_at', o.created_at,
    'guest_name', o.guest_name,
    'wilaya_code', o.wilaya_code,
    'wilaya_name_ar', dz.name_ar,
    'wilaya_name_fr', dz.name_fr,
    'delivery_type', o.delivery_type,
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
  left join public.delivery_zones dz on dz.wilaya_code = o.wilaya_code
  where o.confirmation_token = p_token;

  return v_result;
end;
$$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon;

-- ------------------------------------------------------------
-- 8) Lock down EXECUTE on internal/trigger helpers
-- ------------------------------------------------------------
-- Supabase default privileges grant EXECUTE on new functions to
-- anon/authenticated. These helpers are only meant to run as
-- triggers (or, for is_admin(), for signed-in admins), so remove
-- the defaults. Trigger functions do not need EXECUTE to fire.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.recalculate_product_rating() from public, anon, authenticated;
revoke all on function public.restore_stock_on_cancel() from public, anon, authenticated;
revoke all on function public.log_order_status_change() from public, anon, authenticated;
revoke all on function public.touch_order_status_updated_at() from public, anon, authenticated;
revoke all on function public.is_admin() from anon;

