import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import type { DashboardRecentOrder } from "@/lib/api/admin-dashboard";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";

export function RecentOrders({
  orders,
}: {
  orders: DashboardRecentOrder[];
}) {
  return (
    <DashboardCard className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between border-b border-admin-border pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.recentOrders}
        </CardTitle>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-admin-muted-foreground transition-colors hover:text-admin-foreground"
        >
          {ar.dashboard.viewAll}
          <ArrowLeft className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead className="border-b border-admin-border text-xs text-admin-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 font-normal">
                  {ar.orders.order}
                </th>
                <th className="px-4 py-2.5 font-normal">
                  {ar.orders.guest}
                </th>
                <th className="px-4 py-2.5 font-normal">
                  {ar.orders.status}
                </th>
                <th className="px-4 py-2.5 font-normal">
                  {ar.orders.total}
                </th>
                <th className="px-4 py-2.5 font-normal">
                  {ar.orders.date}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-admin-border/60 last:border-0 hover:bg-admin-muted/40"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs underline underline-offset-2"
                    >
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col leading-5">
                      <span className="font-medium">{order.guest_name}</span>
                      <span className="text-xs text-admin-muted-foreground">
                        {order.guest_phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3 text-admin-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-admin-muted-foreground"
                  >
                    {ar.orders.noOrders}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
