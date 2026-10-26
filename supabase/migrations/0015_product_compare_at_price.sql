-- ============================================================
-- SnapShop - Migration 15: products.compare_at_price
-- ============================================================
-- What this migration does:
--   1. Adds a nullable old ("was") price to products. The merchant
--      types two independent numbers:
--        - base_price      = what the customer pays (real price)
--        - compare_at_price = the higher price shown struck through
--      There is NO calculated percentage anywhere: the admin form
--      stops showing discount_percentage / discount_amount, and the
--      product page stops using them for display when this column
--      is set. The legacy columns and the discount logic inside
--      place_guest_order stay untouched (backward compatible).
--   2. Enforces compare_at_price > base_price when present, so a
--      struck price can never sit below (or equal) the real price.
--      The admin form validates the same rule in Arabic before
--      saving; this CHECK is the database-level backstop.
--
-- Idempotency / safety:
--   - add column if not exists; drop constraint if exists before add.
--   - Nullable column, no default: every existing row gets NULL, so
--     the live page behaves exactly as today until data is migrated.
--   - This file is NOT applied automatically. Apply it from the
--     Supabase dashboard (or `supabase db push`) when ready. The app
--     code reads the column defensively and treats "column missing"
--     the same as NULL, so deploying the code first is safe.
--
-- Manual test plan:
--   -- \d public.products -> compare_at_price numeric(10,2), null
--   -- update products set compare_at_price = base_price where ...;
--   --   -> error: products_compare_at_price_check
--   -- update products set compare_at_price = base_price + 100; -> ok
--   -- update products set compare_at_price = null; -> ok
-- ============================================================

alter table public.products
  add column if not exists compare_at_price numeric(10,2);

alter table public.products
  drop constraint if exists products_compare_at_price_check;

alter table public.products
  add constraint products_compare_at_price_check
    check (compare_at_price is null or compare_at_price > base_price);
