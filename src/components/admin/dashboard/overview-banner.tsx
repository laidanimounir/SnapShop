import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { ar } from "@/lib/admin/i18n-ar";

function formatToday(): string {
  try {
    return new Intl.DateTimeFormat("ar-DZ-u-nu-latn", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString("en-GB");
  }
}

export function OverviewBanner() {
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 17;
  const greeting = isMorning
    ? ar.dashboard.greetingMorning
    : ar.dashboard.greetingEvening;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-admin-muted-foreground">
          {ar.dashboard.welcomeSubtitle}
        </p>
        <p className="text-xs text-admin-muted-foreground">{formatToday()}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/orders">
            {ar.dashboard.viewOrders}
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            {ar.dashboard.addProduct}
          </Link>
        </Button>
      </div>
    </div>
  );
}
