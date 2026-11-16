import * as React from "react";

import { Card } from "@/components/admin/ui/card";
import { cn } from "@/lib/utils";

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "h-full rounded-xl border border-admin-border bg-admin-card ring-1 ring-admin-foreground/10 shadow-sm overflow-hidden",
        className
      )}
      {...props}
    />
  );
}
