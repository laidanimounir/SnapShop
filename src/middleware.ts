import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  getAdminAccessDecision,
} from "@/lib/admin/access";

// Protects /admin/* (except /admin/login): unauthenticated requests are
// redirected to /admin/login; signed-in admins visiting /admin/login are
// redirected to /admin. Admin membership itself is enforced later,
// server-side, by requireAdmin() — the only DB lookup here decides
// whether a signed-in user on the login page is already an admin.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user && request.nextUrl.pathname === ADMIN_LOGIN_PATH) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const adminSupabase = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data } = await adminSupabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      isAdmin = !!data;
    }
  }

  const decision = getAdminAccessDecision({
    pathname: request.nextUrl.pathname,
    isAuthenticated: !!user,
    isAdmin,
  });

  if (decision.action === "allow") return response;

  const destination = request.nextUrl.clone();
  destination.pathname = decision.destination;
  destination.search = "";
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
