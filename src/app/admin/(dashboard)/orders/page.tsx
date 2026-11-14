import Link from "next/link";

import { OrdersTable } from "@/components/admin/orders/orders-table";
import { OrdersToolbar } from "@/components/admin/orders/orders-toolbar";
import { Button } from "@/components/admin/ui/button";
import { getDeliveryZonesAdmin, getOrders } from "@/lib/api/admin";
import { isOrderStatus } from "@/lib/admin/order-transitions";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type Search = Record<string, string | string[] | undefined>;

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const statusParam = pick(searchParams.status);
  const status = statusParam && isOrderStatus(statusParam) ? statusParam : undefined;
  const q = pick(searchParams.q) ?? "";
  const from = pick(searchParams.from) ?? "";
  const to = pick(searchParams.to) ?? "";
  const wilayaParam = Number(pick(searchParams.wilaya));
  const wilaya =
    Number.isInteger(wilayaParam) && wilayaParam >= 1 && wilayaParam <= 58
      ? wilayaParam
      : undefined;
  const pageParam = Number(pick(searchParams.page));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [{ orders, total, counts }, zones] = await Promise.all([
    getOrders({
      status,
      q: q || undefined,
      from: from || undefined,
      to: to || undefined,
      wilaya,
      page,
      pageSize: PAGE_SIZE,
    }),
    getDeliveryZonesAdmin(),
  ]);

  const zoneMap: Record<number, string> = {};
  zones.forEach((zone) => {
    zoneMap[zone.wilaya_code] = zone.name_fr;
  });

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = {
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
    wilaya: wilaya ? String(wilaya) : undefined,
  };
  const hasFilters = Boolean(q || from || to || wilaya || status);
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar.orders.title}
          </h1>
          <p className="text-sm text-admin-muted-foreground">
            {total} {ar.dashboard.ordersCount}
          </p>
        </div>
      </div>

      <OrdersToolbar
        q={q}
        from={from}
        to={to}
        wilaya={wilaya}
        status={status}
        total={total}
        counts={counts}
        zones={zones}
      />

      <OrdersTable orders={orders} zoneMap={zoneMap} hasFilters={hasFilters} />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-admin-muted-foreground">
        <span>
          {total === 0
            ? ar.common.noResults
            : `${ar.orders.showing} ${firstRow}–${lastRow} ${ar.common.of} ${total}`}
        </span>

        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildHref(base, { status, page: page - 1 })}
                rel="prev"
              >
                {ar.common.previous}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {ar.common.previous}
            </Button>
          )}

          <span className="px-1 tabular-nums">
            {ar.common.page} {page} {ar.common.of} {pageCount}
          </span>

          {page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={buildHref(base, { status, page: page + 1 })}
                rel="next"
              >
                {ar.common.next}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {ar.common.next}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
