import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import "@/styles/admin.css";
import { requireAdmin } from "@/lib/supabase/admin";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/access";
import { cairo } from "@/styles/fonts";
import { BRAND_NAME } from "@/lib/config";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { AdminSidebar } from "@/components/admin/layout/sidebar";
import { AdminHeader } from "@/components/admin/layout/header";
import type { AdminTheme } from "@/components/admin/layout/theme-toggle";

export const metadata: Metadata = {
  title: "SnapShop Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAdmin() verifies the session AND admin_users membership
  // server-side. A signed-in non-admin is redirected to the login page,
  // which keeps signed-in non-admins on the login screen without looping.
  let email = "";
  try {
    const session = await requireAdmin();
    email = session.email ?? "";
  } catch {
    redirect(`${ADMIN_LOGIN_PATH}?reason=no-access`);
  }

  const cookieStore = cookies();
  const theme: AdminTheme =
    cookieStore.get("admin_theme")?.value === "dark" ? "dark" : "light";
  const sidebarDefaultOpen =
    cookieStore.get("admin_sidebar_state")?.value !== "collapsed";

  return (
    <div
      dir="rtl"
      lang="ar"
      data-theme={theme}
      className={`admin-root ${cairo.className}`}
    >
      <AdminShell defaultOpen={sidebarDefaultOpen}>
        <AdminSidebar email={email} />
        <div className="flex min-w-0 flex-1 flex-col print:block">
          <AdminHeader email={email} theme={theme} />
          <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
          <footer className="border-t border-admin-border px-4 py-4 text-center text-[10px] text-admin-muted-foreground print:hidden md:px-6">
            © {new Date().getFullYear()} {BRAND_NAME}
          </footer>
        </div>
      </AdminShell>
    </div>
  );
}
