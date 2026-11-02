"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/admin/ui/chart";
import type { DashboardDailySales } from "@/lib/api/admin-dashboard";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";

const chartConfig = {
  revenue: {
    label: ar.dashboard.totalSales,
    color: "hsl(var(--admin-primary))",
  },
} satisfies ChartConfig;

function compactNumber(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Math.round(millions * 10) / 10}m`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${Math.round(thousands * 10) / 10}k`;
  }
  return String(value);
}

export function SalesChart({
  data,
  totalSales,
  averageOrderValue,
}: {
  data: DashboardDailySales[];
  totalSales: number;
  averageOrderValue: number;
}) {
  const hasData = data.some((point) => point.revenue > 0 || point.orders > 0);

  return (
    <DashboardCard className="flex flex-col">
      <CardHeader className="border-b border-admin-border pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.salesOverview}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-admin-muted-foreground">
              {ar.dashboard.totalSales}
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatPrice(totalSales)}
            </span>
            <span className="text-xs text-admin-muted-foreground">
              {ar.dashboard.averageOrderValue}: {formatPrice(averageOrderValue)}
            </span>
          </div>
          <span className="rounded-md border border-admin-border px-2.5 py-1 text-xs text-admin-muted-foreground">
            {ar.dashboard.last14Days}
          </span>
        </div>

        {hasData ? (
          <div dir="ltr">
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--admin-primary))"
                      stopOpacity={0.18}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--admin-primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--admin-border))"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={20}
                  tick={{ fontSize: 11, fill: "hsl(var(--admin-muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickMargin={4}
                  tick={{ fontSize: 11, fill: "hsl(var(--admin-muted-foreground))" }}
                  tickFormatter={(value) => compactNumber(Number(value))}
                />
                <Tooltip
                  cursor={{
                    stroke: "hsl(var(--admin-border))",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={
                    <ChartTooltipContent
                      valueFormatter={(value) => formatPrice(value)}
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  stroke="hsl(var(--admin-primary))"
                  strokeWidth={1.5}
                  fill="url(#salesFill)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-admin-border text-center">
            <TrendingUp className="size-6 text-admin-muted-foreground" />
            <p className="max-w-[240px] text-sm text-admin-muted-foreground">
              {ar.dashboard.noSalesData}
            </p>
          </div>
        )}
      </CardContent>
    </DashboardCard>
  );
}
