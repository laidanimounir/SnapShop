"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

import { Card } from "@/components/admin/ui/card";
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
    color: "hsl(var(--admin-chart-1))",
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
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  const hasData = data.some((point) => point.revenue > 0 || point.orders > 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b border-white/[0.08] pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.salesOverview}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-admin-muted-foreground">
              {ar.dashboard.totalSales}
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatPrice(totalSales)}
            </span>
            <span className="text-xs text-admin-muted-foreground">
              {ar.dashboard.averageOrderValue}: {formatPrice(averageOrderValue)}
            </span>
          </div>
          <span className="rounded-md border border-white/[0.08] px-2.5 py-1 text-xs text-admin-muted-foreground">
            {ar.dashboard.last14Days}
          </span>
        </div>

        <div className="relative flex h-[260px] w-full flex-col items-center justify-center rounded-xl bg-zinc-900/40">
          {isMounted ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
                  barCategoryGap={10}
                >
                  <defs>
                    <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--admin-chart-1))" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="hsl(var(--admin-chart-1))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="hsl(var(--admin-border))"
                    strokeOpacity={0.3}
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
                    hide={true}
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
                  {hasData ? (
                    <Bar
                      dataKey="revenue"
                      radius={[6, 6, 0, 0]}
                      fill="url(#salesBarGradient)"
                      isAnimationActive={false}
                    />
                  ) : null}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : null}
          {!hasData && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
              <TrendingUp className="size-6 text-admin-muted-foreground mb-2" />
              <p className="max-w-[240px] text-sm text-admin-muted-foreground text-center">
                {ar.dashboard.noSalesData}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
