-- 0010: drop three redundant/broken indexes (read-only audit via
-- pg_indexes; composite/superset indexes already cover these paths).
--
-- 1) idx_orders_status -- strict prefix of idx_orders_status_created
--    (status, created_at): every query using it can use the
--    composite instead.
-- 2) product_variants_unique_variant -- a UNIQUE CONSTRAINT, not a
--    plain index; under Postgres' default NULLS DISTINCT, rows with
--    a NULL column never conflict, so it never enforced uniqueness.
--    uq_variants_product_color_size covers the invariant with
--    COALESCE defaults.
-- 3) idx_product_variants_product -- strict prefix of
--    uq_variants_product_color_size (product_id, color, size).

drop index if exists public.idx_orders_status;
alter table if exists public.product_variants
  drop constraint if exists product_variants_unique_variant;
drop index if exists public.idx_product_variants_product;
