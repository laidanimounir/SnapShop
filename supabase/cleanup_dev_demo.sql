-- ============================================================
-- SnapShop - cleanup for supabase/seed_dev_demo.sql
-- Deletes ONLY brand = 'DEMO' rows (and their dependent rows).
-- Safe to run multiple times. Run AFTER deleting any test orders
-- created against DEMO variants (their order_items keep a snapshot
-- and product_variant_id is SET NULL on variant delete).
-- ============================================================

DELETE FROM public.reviews
WHERE product_id IN (SELECT id FROM public.products WHERE brand = 'DEMO');

DELETE FROM public.product_images
WHERE product_id IN (SELECT id FROM public.products WHERE brand = 'DEMO');

DELETE FROM public.product_variants
WHERE product_id IN (SELECT id FROM public.products WHERE brand = 'DEMO');

DELETE FROM public.products
WHERE brand = 'DEMO';
