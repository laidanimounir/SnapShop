import Link from "next/link";
import { ArrowRight, Clock, ShoppingBag } from "lucide-react";

import { Card } from "@/components/admin/ui/card";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import type { DashboardRecentOrder } from "@/lib/api/admin-dashboard";
import { ar } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";

export function RecentOrders({
  orders,
}: {
  orders: DashboardRecentOrder[];
}) {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.08] pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.recentOrders}
        </CardTitle>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-medium text-admin-primary transition-colors hover:text-admin-primary/80"
        >
          {ar.dashboard.viewAll}
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead className="border-b border-white/[0.08] text-xs font-medium text-admin-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">
                  {ar.orders.order}
                </th>
                <th className="px-4 py-3 font-normal">
                  {ar.orders.guest}
                </th>
                <th className="px-4 py-3 font-normal">
                  {ar.orders.status}
                </th>
                <th className="px-4 py-3 font-normal">
                  {ar.orders.total}
                </th>
                <th className="px-4 py-3 font-normal">
                  {ar.orders.date}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 shrink-0 rounded-full bg-admin-muted" />
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs underline underline-offset-2 text-admin-foreground"
                      >
                        {order.id.slice(0, 8)}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col leading-5">
                      <span className="font-medium text-admin-foreground">
                        {order.guest_name}
                      </span>
                      <span className="text-xs text-admin-muted-foreground">
                        {order.guest_phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-admin-foreground">
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
                    className="px-4 py-12 text-center text-admin-muted-foreground"
                  >
                    {ar.orders.noOrders}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
