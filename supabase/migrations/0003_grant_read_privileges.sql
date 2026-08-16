-- ============================================================
-- SnapShop - Migration 3: table privileges for anon/authenticated
-- RLS policies govern row-level access; these grant the base
-- table SELECT privilege so RLS can be evaluated.
-- (orders / order_items intentionally omitted: guests read orders
--  only through get_order_by_token().)
-- ============================================================
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.product_variants to anon, authenticated;
grant select on public.reviews to anon, authenticated;
