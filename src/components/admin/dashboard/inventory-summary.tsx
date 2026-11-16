import { Box, PackageX, Layers, Wallet } from "lucide-react";

import { Card } from "@/components/admin/ui/card";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import type { DashboardInventory } from "@/lib/api/admin-dashboard";
import { ar } from "@/lib/admin/i18n-ar";
import { formatPrice } from "@/lib/pricing";

export function InventorySummary({
  inventory,
}: {
  inventory: DashboardInventory;
}) {
  const cells = [
    {
      label: ar.dashboard.inventoryUnits,
      value: inventory.totalUnits.toLocaleString("en-US"),
      hint: `${inventory.skuCount} SKU`,
      icon: Layers,
    },
    {
      label: ar.dashboard.stockValue,
      value: formatPrice(inventory.stockValue),
      icon: Wallet,
    },
    {
      label: ar.dashboard.lowStock,
      value: inventory.lowStock.toLocaleString("en-US"),
      icon: Box,
    },
    {
      label: ar.dashboard.outOfStock,
      value: inventory.outOfStock.toLocaleString("en-US"),
      icon: PackageX,
    },
  ];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b border-white/[0.08] pb-3">
        <CardTitle className="flex items-center gap-2">
          <Box className="size-4 text-admin-muted-foreground" />
          {ar.dashboard.inventory}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 p-0">
        <div className="grid h-full w-full grid-cols-2 gap-px bg-admin-border">
          {cells.map((cell) => {
            const Icon = cell.icon;
            return (
              <div
                key={cell.label}
                className="flex flex-col justify-between gap-4 bg-admin-background p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-admin-muted-foreground">
                    {cell.label}
                  </p>
                  <Icon className="size-4 text-admin-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xl font-semibold tracking-tight tabular-nums">
                    {cell.value}
                  </p>
                  {cell.hint ? (
                    <p className="text-xs text-admin-muted-foreground">
                      {cell.hint}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
