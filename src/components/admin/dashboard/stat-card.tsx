"use client";

import * as React from "react";
import Link from "next/link";

import { Package, ShoppingBag, Star, Wallet } from "lucide-react";

import { Card } from "@/components/admin/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type TrendVariant = "default" | "success" | "warning" | "destructive";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconName: string;
  iconClassName?: string;
  href?: string;
  className?: string;
  sparklineData?: { label: string; value: number }[];
  sparklineColor?: string;
  trend?: string;
  trendVariant?: TrendVariant;
};

const ICON_MAP: Record<string, React.ElementType> = {
  wallet: Wallet,
  "shopping-bag": ShoppingBag,
  package: Package,
  star: Star,
};

const TREND_CLASSES: Record<TrendVariant, string> = {
  default: "bg-admin-muted text-admin-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  destructive: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

function Sparkline({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  if (!isMounted || !data?.length) return null;
  return (
    <div className="h-[48px] w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#sparklineFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  iconName,
  iconClassName,
  href,
  className,
  sparklineData,
  sparklineColor = "hsl(var(--admin-chart-1))",
  trend,
  trendVariant = "default",
}: StatCardProps) {
  const Icon = ICON_MAP[iconName];

  const content = (
    <Card className="h-full overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col h-full">
          {/* Top row: label + icon badge */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-8 shrink-0 rounded-xl flex items-center justify-center text-admin-foreground",
                  iconClassName
                )}
              >
                <Icon className="size-4" />
              </div>
              {hint ? (
                <span className="text-xs font-medium text-admin-muted-foreground">
                  {hint}
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium text-admin-muted-foreground">
              {label}
            </p>
          </div>

          {/* Big metric number */}
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-medium tracking-tight tabular-nums text-admin-foreground leading-none">
              {value}
            </p>
          </div>

          {/* Sparkline */}
          {sparklineData ? (
            <Sparkline data={sparklineData} color={sparklineColor} />
          ) : null}

          {/* Pill badge at bottom */}
          <div className="mt-auto mt-2">
            {trend ? (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                TREND_CLASSES[trendVariant]
              )}>
                {trend}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );

  if (!href) {
    return <div className={cn(className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "group block h-full outline-none focus-visible:ring-1 focus-visible:ring-white/20",
        className
      )}
    >
      {content}
    </Link>
  );
}
