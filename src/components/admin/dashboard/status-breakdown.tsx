import Link from "next/link";
import { ListChecks } from "lucide-react";

import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/admin/order-transitions";
import { ar, statusLabelAr } from "@/lib/admin/i18n-ar";

const STATUS_BAR: Record<OrderStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  no_answer: "bg-orange-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  returned: "bg-purple-500",
};

export function StatusBreakdown({
  statusCounts,
  totalOrders,
}: {
  statusCounts: Record<string, number>;
  totalOrders: number;
}) {
  return (
    <DashboardCard className="flex flex-col">
      <CardHeader className="border-b border-admin-border pb-3">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.ordersByStatus}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-px bg-admin-border sm:grid-cols-4 xl:grid-cols-7">
          {ORDER_STATUSES.map((status) => {
            const count = statusCounts[status] ?? 0;
            const percent = totalOrders
              ? Math.min(100, Math.round((count / totalOrders) * 100))
              : 0;
            return (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className="group flex flex-col gap-3 bg-admin-background p-4 transition-colors hover:bg-admin-muted/50"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-semibold tracking-tight tabular-nums">
                    {count}
                  </p>
                  <p className="text-xs text-admin-muted-foreground">
                    {statusLabelAr(status)}
                  </p>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-admin-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR[status]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </DashboardCard>
  );
}
