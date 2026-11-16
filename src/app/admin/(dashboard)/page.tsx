import {
  Clock,
  Package,
  ShoppingBag,
  Star,
  Wallet,
} from "lucide-react";

import { InventorySummary } from "@/components/admin/dashboard/inventory-summary";
import { OverviewBanner } from "@/components/admin/dashboard/overview-banner";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { StatCard } from "@/components/admin/dashboard/stat-card";
import { StatusBreakdown } from "@/components/admin/dashboard/status-breakdown";
import { getDashboardOverview } from "@/lib/api/admin-dashboard";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const overview = await getDashboardOverview();

  const kpis = [
    {
      label: ar.dashboard.totalSales,
      value: formatPrice(overview.totalSales),
      hint: `${ar.dashboard.averageOrderValue}: ${formatPrice(
        overview.averageOrderValue
      )}`,
      icon: Wallet,
      href: "/admin/orders",
    },
    {
      label: ar.dashboard.totalOrders,
      value: overview.totalOrders.toLocaleString("en-US"),
      hint: `${overview.pendingOrders} ${ar.dashboard.pendingOrders}`,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      label: ar.dashboard.pendingOrders,
      value: overview.pendingOrders.toLocaleString("en-US"),
      icon: Clock,
      href: "/admin/orders?status=pending",
    },
    {
      label: ar.dashboard.totalProducts,
      value: overview.totalProducts.toLocaleString("en-US"),
      icon: Package,
      href: "/admin/products",
    },
    {
      label: ar.dashboard.pendingReviews,
      value: overview.pendingReviews.toLocaleString("en-US"),
      icon: Star,
      href: "/admin/reviews?filter=pending",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-admin-foreground">
          {ar.dashboard.title}
        </h1>
        <p className="text-sm text-admin-muted-foreground">
          {ar.dashboard.welcomeSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-1 lg:col-span-7">
          <SalesChart
            data={overview.dailySales}
            totalSales={overview.totalSales}
            averageOrderValue={overview.averageOrderValue}
          />
        </div>
        <div className="col-span-1 lg:col-span-5">
          <InventorySummary inventory={overview.inventory} />
        </div>
      </div>

      <StatusBreakdown
        statusCounts={overview.statusCounts}
        totalOrders={overview.totalOrders}
      />

      <RecentOrders orders={overview.recentOrders} />
    </div>
  );
}
