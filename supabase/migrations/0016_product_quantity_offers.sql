-- ============================================================
-- SnapShop - Migration 16: product_quantity_offers (quantity pricing tiers)
--
-- What this does
--   Creates the quantity-offer table used by the product page:
--   the merchant defines up to 3 tiers per product
--   (e.g. "2 = 4500 DA" = TOTAL price for that quantity, not per unit).
--   - quantity 1..10, UNIQUE per product, total_price > 0
--   - at most 3 offers per product (trigger)
--   - at most one is_default offer per product (partial unique index)
--   - public read of ACTIVE offers of ACTIVE products only
--   - NO write policies: only admin server actions (service role) write
--   - price-vs-base validation lives in the app (no subquery CHECK)
--
-- Idempotency-safety
--   All statements use IF NOT EXISTS / create or replace / drop-if-exists
--   so re-running on an already-migrated database is a no-op.
--   THIS FILE IS NOT APPLIED YET - the live page must keep working
--   without it (app treats a missing table as "no offers").
--
-- Manual test plan (after it is applied some day)
--   1. Admin: add 2 offers to one product, set one as default, save.
--   2. Admin: try to add a 4th offer -> rejected with a clear message.
--   3. Public (anon): select offers of an active product -> visible;
--      inactive product's offers -> invisible; insert/update/delete -> denied.
--   4. Product page: offers show as cards, default pre-selected.
-- ============================================================

create table if not exists public.product_quantity_offers (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products(id) on delete cascade,
  quantity            integer not null check (quantity between 1 and 10),
  total_price         numeric(10,2) not null check (total_price > 0),
  label               text check (label is null or char_length(label) between 1 and 40),
  badge               text check (badge is null or char_length(badge) between 1 and 40),
  is_default          boolean not null default false,
  position            smallint not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint uq_offer_product_quantity unique (product_id, quantity)
);

create index if not exists idx_quantity_offers_product
  on public.product_quantity_offers (product_id, position);

-- one pre-selected tier per product
create unique index if not exists uq_quantity_offers_default
  on public.product_quantity_offers (product_id) where is_default;

alter table public.product_quantity_offers enable row level security;

drop policy if exists quantity_offers_public_read on public.product_quantity_offers;
create policy quantity_offers_public_read on public.product_quantity_offers
  for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_quantity_offers.product_id
        and p.is_active
    )
  );
-- no insert/update/delete policy -> deny-all for anon/authenticated

drop trigger if exists set_updated_at_quantity_offers on public.product_quantity_offers;
create trigger set_updated_at_quantity_offers
  before update on public.product_quantity_offers
  for each row execute function public.set_updated_at();

-- hard cap of 3 tiers per product (the admin action validates too)
create or replace function public.enforce_max_quantity_offers()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.product_quantity_offers
      where product_id = new.product_id
        and id is distinct from new.id) >= 3 then
    raise exception 'A product can have at most 3 quantity offers';
  end if;
  return new;
end $$;

drop trigger if exists trg_max_quantity_offers on public.product_quantity_offers;
create trigger trg_max_quantity_offers
  before insert on public.product_quantity_offers
  for each row execute function public.enforce_max_quantity_offers();

-- new table: RLS above decides row access, this grants the base privilege
grant select on public.product_quantity_offers to anon, authenticated;
