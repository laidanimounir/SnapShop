import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { BRAND_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function AdminLogo({
  collapsed = false,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/admin"
      aria-label={BRAND_NAME}
      className={cn(
        "flex items-center gap-2 overflow-hidden text-admin-sidebar-foreground",
        collapsed && "justify-center",
        className
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-none bg-admin-primary text-admin-primary-foreground">
        <ShoppingBag className="size-4" />
      </span>
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight">
          {BRAND_NAME}
        </span>
      )}
    </Link>
  );
}
