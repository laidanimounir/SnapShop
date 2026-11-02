import * as React from "react";
import Link from "next/link";

import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import { CardContent } from "@/components/admin/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  href?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  className,
}: StatCardProps) {
  const content = (
    <CardContent className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-normal text-admin-muted-foreground">
          {label}
        </p>
        <span className="rounded-md border border-admin-border p-2">
          <Icon className="size-4 text-admin-foreground" />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="whitespace-nowrap text-lg font-semibold tracking-tight tabular-nums sm:text-xl md:text-2xl">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-admin-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </CardContent>
  );

  if (!href) {
    return (
      <DashboardCard className={cn("py-0", className)}>{content}</DashboardCard>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group block h-full outline-none focus-visible:ring-1 focus-visible:ring-admin-ring/50",
        className
      )}
    >
      <DashboardCard className="py-0 transition-colors group-hover:border-admin-ring">
        {content}
      </DashboardCard>
    </Link>
  );
}
