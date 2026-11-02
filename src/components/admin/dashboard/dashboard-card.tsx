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
        "h-full gap-0 rounded-none border border-admin-border bg-admin-background shadow-none ring-0",
        className
      )}
      {...props}
    />
  );
}
