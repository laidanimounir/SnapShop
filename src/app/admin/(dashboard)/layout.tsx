import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { signOutAdmin } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "SnapShop Admin",
};

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/delivery", label: "Delivery" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let email: string | null = null;
  try {
    const supabase = createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-600 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-3 print:hidden">
        {email ? (
          <>
            <span>Signed in as {email}</span>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="underline underline-offset-2 hover:no-underline"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <span>SnapShop Admin — sign in required</span>
        )}
      </div>
      <div className="flex">
        <aside className="w-56 bg-white border-r border-black/10 min-h-[calc(100vh-2.5rem)] p-4 shrink-0 print:hidden">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-black hover:bg-gray-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
