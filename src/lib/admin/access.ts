export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin";

export type AdminAccessDecision =
  | { action: "allow" }
  | {
      action: "redirect";
      destination: typeof ADMIN_LOGIN_PATH | typeof ADMIN_HOME_PATH;
      reason: "unauthenticated" | "already-admin";
    };

// Pure redirect/authorization decision for /admin routes, shared by
// middleware and covered by tests. The login page is public for
// signed-out users; signed-in admins are bounced to /admin; every
// other /admin/* path requires an authenticated session. Admin
// membership on protected pages is enforced separately by
// requireAdmin() so this stays a cheap, DB-free cookie check.
export function getAdminAccessDecision({
  pathname,
  isAuthenticated,
  isAdmin = false,
}: {
  pathname: string;
  isAuthenticated: boolean;
  isAdmin?: boolean;
}): AdminAccessDecision {
  if (pathname === ADMIN_LOGIN_PATH) {
    if (!isAuthenticated) return { action: "allow" };
    if (isAdmin) {
      return {
        action: "redirect",
        destination: ADMIN_HOME_PATH,
        reason: "already-admin",
      };
    }
    // Signed-in non-admin: stays on the login page so the denial
    // message from signInAdmin remains visible and a different
    // (admin) account can be used.
    return { action: "allow" };
  }

  if (!isAuthenticated) {
    return {
      action: "redirect",
      destination: ADMIN_LOGIN_PATH,
      reason: "unauthenticated",
    };
  }

  return { action: "allow" };
}
