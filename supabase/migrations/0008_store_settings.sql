-- ============================================================
-- SnapShop - Migration 8: server-side store settings
-- ============================================================
-- A generic key/value store for settings that must never be exposed to
-- the browser (tracking pixel id, delivery-provider credentials).
--
-- Security model:
--   - RLS is enabled and there are NO policies: anon and authenticated
--     cannot read or write any row.
--   - No grants to anon/authenticated.
--   - All access goes through Next.js server actions using the
--     service-role key after requireAdmin().
--   - Secret values are never returned to the browser in full; the
--     admin UI only receives a masked suffix.
--
-- Known keys (value is jsonb):
--   "tracking_pixel"            { pixel_id: string, enabled: boolean }
--   "delivery_provider_ecotrack"{ api_key: string, base_url: string,
--                                 enabled: boolean }
--
-- This migration seeds NO secrets.
--
-- Manual test plan:
--   -- select * from public.store_settings;  (as service role only)
--   -- as anon: select * from public.store_settings;
--   --   expect: permission denied / empty due to no policy+grants.
-- ============================================================

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.store_settings enable row level security;

-- Deliberately no policies and no grants: service role only.
revoke all on public.store_settings from anon, authenticated;
