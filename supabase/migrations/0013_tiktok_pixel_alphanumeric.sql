-- TikTok pixel ids can be alphanumeric (letters + digits, 5-30 chars),
-- while Facebook pixel ids stay digits only (5-20 chars).
-- Replace the digits-only CHECK on tiktok_pixel_id from migration 0011.

alter table public.product_landing_pages
  drop constraint if exists product_landing_pages_tiktok_pixel_id_check;

alter table public.product_landing_pages
  add constraint product_landing_pages_tiktok_pixel_id_check
    check (tiktok_pixel_id is null or tiktok_pixel_id ~ '^[A-Za-z0-9]{5,30}$');
