import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/access";
import { signOutAdmin } from "@/app/admin/actions";
import { cairo } from "@/styles/fonts";
import { ar } from "@/lib/admin/i18n-ar";
import { AdminSidebar } from "./AdminSidebar";

export const metadata: Metadata = {
  title: "SnapShop Admin",
};

const navItems = [
  { href: "/admin", label: ar.nav.dashboard },
  { href: "/admin/orders", label: ar.nav.orders },
  { href: "/admin/products", label: ar.nav.products },
  { href: "/admin/landing-pages", label: ar.landing.title },
  { href: "/admin/landing-templates", label: ar.nav.templates },
  { href: "/admin/delivery", label: ar.nav.delivery },
  { href: "/admin/reviews", label: ar.nav.reviews },
  { href: "/admin/settings", label: ar.nav.settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAdmin() verifies the session AND admin_users membership
  // server-side. A signed-in non-admin used to fall through to the
  // page's data function and hit a raw 500 — now they get a friendly
  // redirect to the login page, which (per getAdminAccessDecision)
  // keeps signed-in non-admins on the login screen without looping.
  let email: string | null = null;
  try {
    const session = await requireAdmin();
    email = session.email;
  } catch {
    redirect(`${ADMIN_LOGIN_PATH}?reason=no-access`);
  }

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} min-h-screen bg-gray-50`}>
      <div className="bg-emerald-600 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-3 print:hidden">
        {email ? (
          <>
            <span>
              {ar.nav.signedInAs} {email}
            </span>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="underline underline-offset-2 hover:no-underline"
              >
                {ar.nav.signOut}
              </button>
            </form>
          </>
        ) : (
          <span>{ar.nav.loginRequired}</span>
        )}
      </div>
      <div className="flex">
        <AdminSidebar items={navItems} />
        <main className="flex-1 min-w-0 p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
