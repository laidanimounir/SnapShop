-- ============================================================
-- SnapShop - Migration 11: product landing pages
-- ============================================================
-- What this migration does:
--   1. product_landing_pages: one landing page per product
--      (product_id UNIQUE), a URL slug, a status
--      ('draft' | 'published' | 'unpublished'), two content
--      snapshots (draft_content is what the admin edits,
--      published_content is what the public renders; they are
--      only equal while the page is live), SEO fields, optional
--      facebook/tiktok pixel ids (digits only), timestamps.
--   2. landing_page_templates: reusable section/theme JSON the
--      admin can copy into a product page.
--   3. RLS: anon and authenticated can SELECT only rows where
--      status = 'published'. NO insert/update/delete policies
--      for anon or authenticated anywhere: every write goes
--      through Next.js server actions using the service-role
--      key after requireAdmin().
--   4. Storage: public bucket "landing-assets" (5 MB limit,
--      jpeg/png/webp only) + ONE public SELECT policy. NO
--      insert/update/delete policies: uploads happen only with
--      the service-role key inside admin server actions.
--
-- Idempotency / safety:
--   - create table/index/policy if not exists or drop policy
--     if exists first; bucket upsert via ON CONFLICT (id).
--   - Fresh tables: no data migration, nothing dropped.
--
-- Manual test plan:
--   -- select table_name from information_schema.tables
--   --   where table_name in
--   --   ('product_landing_pages','landing_page_templates');
--   -- select polname from pg_policies
--   --   where tablename = 'product_landing_pages';
--   --   expect: one 'published' SELECT policy, no write policy
--   -- as anon: select * from public.product_landing_pages;
--   --   expect: only rows with status = 'published'
--   -- insert into storage.buckets ... on conflict works and
--   --   "landing-assets public read" policy exists.
-- ============================================================

-- ------------------------------------------------------------
-- 1) product_landing_pages
-- ------------------------------------------------------------
create table if not exists public.product_landing_pages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique
    references public.products (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
           and length(slug) between 3 and 80),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'unpublished')),
  draft_content jsonb not null default '{"theme": {}, "sections": []}'::jsonb,
  published_content jsonb,
  seo_title text check (seo_title is null or length(seo_title) between 1 and 200),
  seo_description text
    check (seo_description is null or length(seo_description) between 1 and 400),
  og_image_url text
    check (og_image_url is null or length(og_image_url) between 1 and 2048),
  facebook_pixel_id text
    check (facebook_pixel_id is null or facebook_pixel_id ~ '^[0-9]{5,20}$'),
  tiktok_pixel_id text
    check (tiktok_pixel_id is null or tiktok_pixel_id ~ '^[0-9]{5,20}$'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_landing_pages_status
  on public.product_landing_pages (status);

alter table public.product_landing_pages enable row level security;

-- Anon sees only the live snapshot; drafts stay admin-only.
drop policy if exists "landing pages published read"
  on public.product_landing_pages;

create policy "landing pages published read" on public.product_landing_pages
  for select to anon, authenticated
  using (status = 'published');

-- NOTE: deliberately NO insert/update/delete policies. Writes go
-- through the service-role key inside admin server actions only.

-- Base table privilege so RLS can be evaluated (0003 pattern).
grant select on public.product_landing_pages to anon, authenticated;

-- ------------------------------------------------------------
-- 2) landing_page_templates
-- ------------------------------------------------------------
create table if not exists public.landing_page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  content jsonb not null default '{"theme": {}, "sections": []}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.landing_page_templates enable row level security;

-- Deliberately no policies and no grants: service role only,
-- same model as store_settings (0008).
revoke all on public.landing_page_templates from anon, authenticated;

-- ------------------------------------------------------------
-- 3) Storage: public landing-assets bucket, read-only for anon
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('landing-assets', 'landing-assets', true, 5242880,
        '{image/jpeg,image/png,image/webp}')
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = '{image/jpeg,image/png,image/webp}';

drop policy if exists "landing-assets public read" on storage.objects;

create policy "landing-assets public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'landing-assets');

-- NOTE: deliberately NO insert/update/delete policies on
-- storage.objects for this bucket either: uploads and deletes go
-- through the service-role key inside admin server actions only.
