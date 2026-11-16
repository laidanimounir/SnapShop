import * as React from "react";
import Link from "next/link";

import { Card } from "@/components/admin/ui/card";
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
    <Card className="h-full overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-xs font-medium text-admin-muted-foreground">
            {label}
          </p>
          <div className="grid size-6 place-items-center rounded-md bg-admin-muted">
            <Icon className="size-4 text-admin-foreground" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-medium tracking-tight tabular-nums text-admin-foreground leading-none">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-admin-muted-foreground">{hint}</p>
          ) : null}
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
        "group block h-full outline-none focus-visible:ring-1 focus-visible:ring-admin-ring/50",
        className
      )}
    >
      {content}
    </Link>
  );
}
