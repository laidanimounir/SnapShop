import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import "@/styles/admin.css";
import { requireAdmin } from "@/lib/supabase/admin";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/access";
import { cairo } from "@/styles/fonts";
import { BRAND_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { AdminSidebar } from "@/components/admin/layout/sidebar";
import { AdminHeader } from "@/components/admin/layout/header";
import { PreferencesProvider } from "@/components/admin/layout/preferences-provider";
import type { AdminTheme } from "@/components/admin/layout/theme-toggle";

export const metadata: Metadata = {
  title: "SnapShop Admin",
};

function readPreferenceCookie(key: string): string | undefined {
  const cookieStore = cookies();
  const value = cookieStore.get(`admin_pref_${key}`)?.value;
  return value;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email = "";
  try {
    const session = await requireAdmin();
    email = session.email ?? "";
  } catch {
    redirect(`${ADMIN_LOGIN_PATH}?reason=no-access`);
  }

  const cookieStore = cookies();
  const theme: AdminTheme =
    cookieStore.get("admin_theme")?.value === "light" ? "light" : "dark";

  const initialValues = {
    theme_mode: (readPreferenceCookie("theme_mode") as
      | "light"
      | "dark"
      | "system") || "dark",
    theme_preset: (readPreferenceCookie("theme_preset") as
      | "default"
      | "brutalist"
      | "soft-pop"
      | "tangerine") || "default",
    content_layout: (readPreferenceCookie("content_layout") as
      | "centered"
      | "full-width") || "full-width",
    navbar_style: (readPreferenceCookie("navbar_style") as
      | "sticky"
      | "scroll") || "sticky",
    sidebar_variant: (readPreferenceCookie("sidebar_variant") as
      | "inset"
      | "sidebar"
      | "floating") || "sidebar",
    sidebar_collapsible: (readPreferenceCookie("sidebar_collapsible") as
      | "icon"
      | "offcanvas") || "icon",
  };

  const sidebarDefaultOpen =
    cookieStore.get("admin_sidebar_state")?.value !== "collapsed";

  const isDark = theme === "dark";
  const isCentered = initialValues.content_layout === "centered";

  return (
    <div
      dir="rtl"
      lang="ar"
      data-theme={theme}
      data-theme-mode={initialValues.theme_mode}
      data-theme-preset={initialValues.theme_preset}
      data-content-layout={initialValues.content_layout}
      data-navbar-style={initialValues.navbar_style}
      data-sidebar-variant={initialValues.sidebar_variant}
      data-sidebar-collapsible={initialValues.sidebar_collapsible}
      className={cn(
        "admin-root",
        cairo.className,
        isDark ? "dark" : "",
        isCentered ? "max-w-[72rem] mx-auto" : "w-full"
      )}
    >
      <PreferencesProvider initialValues={initialValues}>
        <AdminShell defaultOpen={sidebarDefaultOpen}>
          <AdminSidebar email={email} />
          <div className="flex min-w-0 flex-1 flex-col print:block md:pr-64">
            <AdminHeader email={email} theme={theme} />
            <main className="min-w-0 flex-1 overflow-x-hidden px-4 lg:px-6 gap-4 md:gap-6 print:p-0">
              {children}
            </main>
            <footer className="border-t border-admin-border px-4 py-4 text-center text-[10px] text-admin-muted-foreground print:hidden md:px-6">
              © {new Date().getFullYear()} {BRAND_NAME}
            </footer>
          </div>
        </AdminShell>
      </PreferencesProvider>
    </div>
  );
}
