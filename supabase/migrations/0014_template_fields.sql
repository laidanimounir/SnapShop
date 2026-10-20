-- ============================================================
-- SnapShop - Migration 14: landing-page template fields
-- ============================================================
-- What this migration does:
--   1. Adds a short description and an updated_at stamp to
--      landing_page_templates.
--   2. Tightens the name check from 120 to 80 chars (the table is
--      empty, so nothing is dropped) and adds a description length
--      check (<= 300).
--   3. Adds a case-insensitive, trim-insensitive UNIQUE index on the
--      name so two templates cannot collide by case or spacing.
--   4. Reuses set_updated_at() to refresh updated_at on update.
--
-- Idempotency / safety:
--   - add column if not exists; drop constraint if exists before add;
--     create index if not exists; drop trigger if exists before
--     create. Fresh-ish table, empty: no data migration.
--
-- Manual test plan:
--   -- \d public.landing_page_templates  -> description, updated_at,
--   --   name check (1..80), uq_landing_template_name, trigger
--   -- insert two names differing only by case/space -> unique error
--   -- update a row -> updated_at changes
-- ============================================================

alter table public.landing_page_templates
  add column if not exists description text;
alter table public.landing_page_templates
  add column if not exists updated_at timestamptz not null default now();

alter table public.landing_page_templates
  drop constraint if exists landing_page_templates_name_check;
alter table public.landing_page_templates
  add constraint landing_page_templates_name_check
    check (length(name) between 1 and 80);

alter table public.landing_page_templates
  drop constraint if exists landing_page_templates_description_check;
alter table public.landing_page_templates
  add constraint landing_page_templates_description_check
    check (description is null or length(description) <= 300);

-- Names must be unique ignoring case and surrounding spaces.
create unique index if not exists uq_landing_template_name
  on public.landing_page_templates (lower(btrim(name)));

drop trigger if exists landing_page_templates_set_updated_at
  on public.landing_page_templates;
create trigger landing_page_templates_set_updated_at
  before update on public.landing_page_templates
  for each row execute function public.set_updated_at();
