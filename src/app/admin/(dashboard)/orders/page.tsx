import Link from "next/link";
import { getDeliveryZonesAdmin, getOrders } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import QuickStatusSelect from "@/components/admin/QuickStatusSelect";
import {
  ORDER_STATUSES,
  isOrderStatus,
} from "@/lib/admin/order-transitions";
import { ar, statusLabelAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

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

  const zoneMap = new Map(zones.map((z) => [z.wilaya_code, z]));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = {
    q: q || undefined,
    from: from || undefined,
    to: to || undefined,
    wilaya: wilaya ? String(wilaya) : undefined,
  };

  const tabClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap",
      active
        ? "bg-admin-primary text-admin-primary-foreground"
        : "bg-admin-card border border-admin-border text-admin-muted-foreground hover:border-admin-ring"
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{ar.orders.title}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={buildHref(base, {})} className={tabClass(!status)}>
          {ar.common.all} ({total})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref(base, { status: s })}
            className={tabClass(status === s)}
          >
            {statusLabelAr(s)} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 bg-admin-card border border-admin-border rounded-lg p-4 mb-4"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium mb-1" htmlFor="order-q">
            {ar.common.search}
          </label>
          <input
            id="order-q"
            name="q"
            defaultValue={q}
            placeholder={ar.orders.searchPlaceholder}
            className="w-full px-3 py-2 border border-admin-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-from">
            {ar.orders.from}
          </label>
          <input
            id="order-from"
            name="from"
            type="date"
            defaultValue={from}
            className="px-3 py-2 border border-admin-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-to">
            {ar.orders.to}
          </label>
          <input
            id="order-to"
            name="to"
            type="date"
            defaultValue={to}
            className="px-3 py-2 border border-admin-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-wilaya">
            {ar.orders.wilaya}
          </label>
          <select
            id="order-wilaya"
            name="wilaya"
            defaultValue={wilaya ? String(wilaya) : ""}
            className="px-3 py-2 border border-admin-border rounded-lg text-sm bg-admin-card"
          >
            <option value="">{ar.orders.allWilayas}</option>
            {zones.map((zone) => (
              <option key={zone.wilaya_code} value={zone.wilaya_code}>
                {String(zone.wilaya_code).padStart(2, "0")} — {zone.name_fr}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-admin-primary text-admin-primary-foreground text-sm font-medium hover:bg-admin-primary/90"
        >
          {ar.common.filter}
        </button>
        <Link
          href={buildHref({}, {})}
          className="px-4 py-2 rounded-lg border border-admin-border text-sm font-medium hover:bg-admin-muted"
        >
          {ar.common.reset}
        </Link>
      </form>

      <div className="bg-admin-card border border-admin-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border text-start text-admin-muted-foreground">
              <th className="px-4 py-3 font-medium text-start">{ar.orders.order}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.orders.guest}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.common.phone}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.orders.wilaya}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.common.delivery}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.common.status}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.common.total}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.common.created}</th>
              <th className="px-4 py-3 font-medium text-start">{ar.orders.quickAction}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const zone =
                order.wilaya_code != null ? zoneMap.get(order.wilaya_code) : null;
              return (
                <tr
                  key={order.id}
                  className="border-b border-admin-border/60 hover:bg-admin-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs underline underline-offset-2"
                    >
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.guest_name}</td>
                  <td className="px-4 py-3">{order.guest_phone}</td>
                  <td className="px-4 py-3 text-admin-foreground/80">
                    {zone
                      ? `${zone.name_fr} (${String(order.wilaya_code).padStart(2, "0")})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-admin-foreground/80">
                    {order.delivery_type === "office"
                      ? ar.common.office
                      : ar.common.home}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-admin-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3">
                    <QuickStatusSelect
                      orderId={order.id}
                      status={order.status}
                    />
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-admin-muted-foreground">
                  {ar.orders.noOrders}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-admin-muted-foreground">
        <span>
          {total === 0
            ? ar.common.noResults
            : `${ar.orders.showing} ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                page * PAGE_SIZE,
                total
              )} ${ar.common.of} ${total}`}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={buildHref(base, {
                status,
                page: page - 1,
              })}
              className="px-3 py-1.5 rounded-lg border border-admin-border hover:bg-admin-muted"
            >
              {ar.common.previous}
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-admin-border text-admin-muted-foreground/50">
              {ar.common.previous}
            </span>
          )}
          <span className="px-2 py-1.5">
            {ar.common.page} {page} {ar.common.of} {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={buildHref(base, {
                status,
                page: page + 1,
              })}
              className="px-3 py-1.5 rounded-lg border border-admin-border hover:bg-admin-muted"
            >
              {ar.common.next}
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-admin-border text-admin-muted-foreground/50">
              {ar.common.next}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
