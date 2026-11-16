import Link from "next/link";
import { ListChecks } from "lucide-react";

import { Card } from "@/components/admin/ui/card";
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
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "hsl(var(--admin-chart-4))",
  confirmed: "hsl(var(--admin-chart-2))",
  no_answer: "hsl(var(--admin-chart-5))",
  shipped: "hsl(var(--admin-chart-3))",
  delivered: "hsl(var(--admin-chart-1))",
  cancelled: "hsl(var(--admin-chart-5))",
  returned: "hsl(var(--admin-chart-5))",
};

export function StatusBreakdown({
  statusCounts,
  totalOrders,
}: {
  statusCounts: Record<string, number>;
  totalOrders: number;
}) {
  return (
    <Card className="h-full overflow-hidden">
        <CardHeader className="border-b border-white/[0.08] pb-3">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.ordersByStatus}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid gap-4 sm:grid-cols-4 xl:grid-cols-7">
          {ORDER_STATUSES.map((status) => {
            const count = statusCounts[status] ?? 0;
            const percent = totalOrders
              ? Math.min(100, Math.round((count / totalOrders) * 100))
              : 0;
            const color = STATUS_COLORS[status];

            return (
              <Link
                key={status}
                href={`/admin/orders?status=${status}`}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-admin-card p-4 transition-colors hover:bg-white/[0.03] hover:border-white/[0.12]",
                  "group"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-2xl font-semibold tracking-tight tabular-nums text-admin-foreground">
                      {count}
                    </p>
                    <p className="text-xs text-admin-muted-foreground">
                      {statusLabelAr(status)}
                    </p>
                  </div>
                  <div className="size-6 shrink-0 rounded-full flex items-center justify-center bg-admin-muted/50">
                    <span className="text-[10px] font-medium text-admin-muted-foreground">
                      {percent}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-admin-muted/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
