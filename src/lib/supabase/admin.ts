import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

// Server-only service-role factory. NEVER import this from a client
// component — the service role key bypasses RLS.
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-side only environment variable)"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminSession = {
  userId: string;
  email: string | null;
  supabase: SupabaseClient;
};

// Verifies the request's Supabase Auth session (cookies) and confirms
// the user is listed in public.admin_users — checked with the
// service-role client so the membership table itself stays unreadable
// to anon/authenticated callers. Throws (deny) otherwise.
export async function requireAdmin(): Promise<AdminSession> {
  const sessionClient = createServerSupabase();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated. Please sign in at /admin/login.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Access denied: not an admin user.");

  return { userId: user.id, email: user.email ?? null, supabase: admin };
}
