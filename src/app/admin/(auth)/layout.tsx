// Isolated layout for /admin/login: intentionally minimal so the admin
// sidebar and the "sign in required" banner never render for
// signed-out users. Route groups keep the URL path unchanged.
import { cookies } from "next/headers";

import "@/styles/admin.css";
import { cairo } from "@/styles/fonts";
import type { AdminTheme } from "@/components/admin/layout/theme-toggle";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme: AdminTheme =
    cookies().get("admin_theme")?.value === "dark" ? "dark" : "light";

  return (
    <div
      dir="rtl"
      lang="ar"
      data-theme={theme}
      className={`admin-root ${cairo.className}`}
    >
      {children}
    </div>
  );
}
