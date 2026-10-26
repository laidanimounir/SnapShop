-- ============================================================
-- SnapShop - Migration 19: public read of the tracking pixel setting
--
-- What this does
--   Lets anonymous visitors read ONLY the tracking_pixel row of
--   store_settings (the store pixel id + enabled flag), so the root
--   layout can inject the pixel on storefront pages. The policy is
--   row-limited: the delivery provider credentials and any other
--   admin-only key stay invisible to the public.
--
-- Idempotency-safety
--   drop policy if exists + create policy: re-running this file is a
--   no-op. THIS FILE IS NOT APPLIED YET - until it is, the public
--   reader silently returns "disabled" and no pixel is injected, so
--   the live site behaves exactly as today.
--
-- Manual test plan (after it is applied some day)
--   1. As anon (SQL editor with the anon role, or curl + anon key):
--      select key, value from store_settings
--      -> only the tracking_pixel row comes back.
--   2. Anon insert/update/delete on store_settings -> denied.
--   3. Admin > Settings: enable the pixel, open a /shop product page
--      -> the pixel request fires; open /admin -> it does not.
-- ============================================================

drop policy if exists "public read tracking pixel" on public.store_settings;

create policy "public read tracking pixel"
  on public.store_settings
  for select
  to anon, authenticated
  using (key = 'tracking_pixel');
