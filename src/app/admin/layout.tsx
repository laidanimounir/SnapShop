import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SnapShop Admin",
};

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-500 text-amber-950 text-center text-sm font-medium py-2 px-4">
        Internal testing only — not secured
      </div>
      <div className="flex">
        <aside className="w-56 bg-white border-r border-black/10 min-h-[calc(100vh-2.5rem)] p-4 shrink-0">
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
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
