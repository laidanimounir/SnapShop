import { InventorySummary } from "@/components/admin/dashboard/inventory-summary";
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

  const dailySales = overview.dailySales;

  const kpis = [
    {
      label: ar.dashboard.totalSales,
      value: formatPrice(overview.totalSales),
      hint: `${ar.dashboard.averageOrderValue}: ${formatPrice(
        overview.averageOrderValue
      )}`,
      iconName: "wallet",
      href: "/admin/orders",
      iconClassName: "bg-emerald-500/10 text-emerald-400",
      sparklineData: dailySales.map((d) => ({ label: d.label, value: d.revenue })),
      sparklineColor: "hsl(var(--admin-chart-1))",
    },
    {
      label: ar.dashboard.totalOrders,
      value: overview.totalOrders.toLocaleString("en-US"),
      hint: `${overview.pendingOrders} ${ar.dashboard.pendingOrders}`,
      iconName: "shopping-bag",
      href: "/admin/orders",
      iconClassName: "bg-blue-500/10 text-blue-400",
      sparklineData: dailySales.map((d) => ({ label: d.label, value: d.orders })),
      sparklineColor: "hsl(var(--admin-chart-2))",
      trend: `${overview.pendingOrders} ${ar.dashboard.pendingOrders}`,
      trendVariant: "warning" as const,
    },
    {
      label: ar.dashboard.totalProducts,
      value: overview.totalProducts.toLocaleString("en-US"),
      iconName: "package",
      href: "/admin/products",
      iconClassName: "bg-admin-card/50 text-admin-foreground",
      trend: `${overview.inventory.skuCount} SKU`,
      trendVariant: "default" as const,
    },
    {
      label: ar.dashboard.pendingReviews,
      value: overview.pendingReviews.toLocaleString("en-US"),
      iconName: "star",
      href: "/admin/reviews?filter=pending",
      iconClassName: "bg-amber-500/10 text-amber-400",
      trend: ar.dashboard.pendingReviews,
      trendVariant: "warning" as const,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
