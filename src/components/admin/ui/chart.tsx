"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart(): ChartContextValue {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer.");
  }
  return context;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactElement;
}) {
  const uniqueId = React.useId();
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => value.color)
      .map(([key, value]) => [`--color-${key}`, value.color])
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={uniqueId}
        style={style}
        className={cn(
          "flex aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-admin-card shadow-xs justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-admin-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-white/[0.08] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-white/[0.12]",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

type TooltipItem = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  valueFormatter?: (value: number, key: string) => string;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-md border border-admin-border bg-admin-popover px-2.5 py-1.5 text-xs text-admin-popover-foreground shadow-lg">
      {label ? <div className="font-medium">{label}</div> : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey ?? "");
          const value = Number(item.value ?? 0);
          return (
            <div key={index} className="flex w-full items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-admin-muted-foreground">
                {config[key]?.label ?? item.name ?? key}
              </span>
              <span className="me-auto font-mono font-medium tabular-nums text-admin-foreground">
                {valueFormatter ? valueFormatter(value, key) : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
