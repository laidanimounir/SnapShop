import Link from "next/link";
import { getDashboardStats } from "@/lib/api/admin";
import { ORDER_STATUSES } from "@/lib/admin/order-transitions";
import { ar, statusLabelAr } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const stats = await getDashboardStats();

  const cards = [
    { label: ar.dashboard.totalOrders, value: stats.totalOrders, href: "/admin/orders" },
    { label: ar.dashboard.pendingOrders, value: stats.pendingOrders, href: "/admin/orders?status=pending" },
    { label: ar.dashboard.totalProducts, value: stats.totalProducts, href: "/admin/products" },
    { label: ar.dashboard.pendingReviews, value: stats.pendingReviews, href: "/admin/reviews?filter=pending" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{ar.dashboard.title}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white border border-black/10 rounded-lg p-5 hover:border-black/30 transition-colors"
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-black/60 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-3">
        {ar.dashboard.ordersByStatus}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {ORDER_STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="bg-white border border-black/10 rounded-lg p-4 hover:border-black/30 transition-colors"
          >
            <p className="text-2xl font-bold">
              {stats.statusCounts[status] ?? 0}
            </p>
            <p className="text-xs text-black/60 mt-1">
              {statusLabelAr(status)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
