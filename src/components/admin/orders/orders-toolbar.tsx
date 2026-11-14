import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { ORDER_STATUSES } from "@/lib/admin/order-transitions";
import { ar, statusLabelAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

type Zone = { wilaya_code: number; name_fr: string };

type OrdersToolbarProps = {
  q: string;
  from: string;
  to: string;
  wilaya?: number;
  status?: string;
  total: number;
  counts: Record<string, number>;
  zones: Zone[];
};

function buildHref(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return `/admin/orders${qs ? `?${qs}` : ""}`;
}

export function OrdersToolbar({
  q,
  from,
  to,
  wilaya,
  status,
  total,
  counts,
  zones,
}: OrdersToolbarProps) {
  const base = {
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
    wilaya: wilaya ? String(wilaya) : undefined,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref(base, {})}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !status
              ? "border-transparent bg-admin-primary text-admin-primary-foreground"
              : "border-admin-border text-admin-muted-foreground hover:bg-admin-muted"
          )}
        >
          {ar.common.all}
          <span className="tabular-nums opacity-70">{total}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref(base, { status: s })}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              status === s
                ? "border-transparent bg-admin-primary text-admin-primary-foreground"
                : "border-admin-border text-admin-muted-foreground hover:bg-admin-muted"
            )}
          >
            {statusLabelAr(s)}
            <span className="tabular-nums opacity-70">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 border border-admin-border bg-admin-background p-3"
      >
        {status && <input type="hidden" name="status" value={status} />}

        <div className="min-w-[200px] flex-1">
          <label
            htmlFor="order-q"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.common.search}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-admin-muted-foreground" />
            <Input
              id="order-q"
              name="q"
              defaultValue={q}
              placeholder={ar.orders.searchPlaceholder}
              className="ps-9"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="order-from"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.orders.from}
          </label>
          <Input id="order-from" name="from" type="date" defaultValue={from} />
        </div>

        <div>
          <label
            htmlFor="order-to"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.orders.to}
          </label>
          <Input id="order-to" name="to" type="date" defaultValue={to} />
        </div>

        <div className="min-w-[170px]">
          <label
            htmlFor="order-wilaya"
            className="mb-1.5 block text-xs text-admin-muted-foreground"
          >
            {ar.orders.wilaya}
          </label>
          <select
            id="order-wilaya"
            name="wilaya"
            defaultValue={wilaya ? String(wilaya) : ""}
            className="h-9 w-full rounded-md border border-admin-input bg-transparent px-3 text-sm outline-none focus-visible:border-admin-ring focus-visible:ring-1 focus-visible:ring-admin-ring/50"
          >
            <option value="">{ar.orders.allWilayas}</option>
            {zones.map((zone) => (
              <option key={zone.wilaya_code} value={zone.wilaya_code}>
                {String(zone.wilaya_code).padStart(2, "0")} — {zone.name_fr}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit">
          <SlidersHorizontal className="size-4" />
          {ar.common.filter}
        </Button>

        <Button asChild variant="outline">
          <Link href="/admin/orders">{ar.common.reset}</Link>
        </Button>
      </form>
    </div>
  );
}
