-- ============================================================
-- SnapShop - Migration 5: admin users (Supabase Auth gate)
-- ============================================================
-- The /admin dashboard requires a signed-in Supabase Auth user whose
-- id is present in public.admin_users. All admin reads/writes use the
-- service-role client server-side ONLY after verifying membership
-- (see requireAdmin() in src/lib/supabase/admin.ts).
--
-- Design:
--   - user_id is the PRIMARY KEY and references auth.users(id)
--     ON DELETE CASCADE (deleting the auth user removes membership).
--   - RLS is ENABLED with NO policies: anon/authenticated get no
--     rows through PostgREST; only service_role (which bypasses RLS)
--     reads this table, server-side, after session verification.
--   - is_admin() is a SECURITY DEFINER helper with an empty
--     search_path for future RLS policies; EXECUTE is granted to
--     authenticated only.
--
-- Bootstrap the first admin (Supabase dashboard -> Authentication ->
-- Users -> create user, copy its id, then in the SQL editor):
--   insert into public.admin_users (user_id)
--   values ('<paste-auth-user-id-here>');
-- ============================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- No policies: default-deny for anon/authenticated via PostgREST.
-- (Service role bypasses RLS and is used server-side only.)

revoke all on table public.admin_users from public;
revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;

-- ------------------------------------------------------------
-- is_admin(): true when the calling session user is an admin
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
