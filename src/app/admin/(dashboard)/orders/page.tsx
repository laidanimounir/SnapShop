import Link from "next/link";
import { getDeliveryZonesAdmin, getOrders } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import QuickStatusSelect from "@/components/admin/QuickStatusSelect";
import {
  ORDER_STATUSES,
  STATUS_LABELS,
  isOrderStatus,
} from "@/lib/admin/order-transitions";
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
        ? "bg-black text-white"
        : "bg-white border border-black/10 text-black/60 hover:border-black/30"
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href={buildHref(base, {})} className={tabClass(!status)}>
          All ({total})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref(base, { status: s })}
            className={tabClass(status === s)}
          >
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 bg-white border border-black/10 rounded-lg p-4 mb-4"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium mb-1" htmlFor="order-q">
            Search
          </label>
          <input
            id="order-q"
            name="q"
            defaultValue={q}
            placeholder="Phone, name or order id"
            className="w-full px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-from">
            From
          </label>
          <input
            id="order-from"
            name="from"
            type="date"
            defaultValue={from}
            className="px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-to">
            To
          </label>
          <input
            id="order-to"
            name="to"
            type="date"
            defaultValue={to}
            className="px-3 py-2 border border-black/15 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" htmlFor="order-wilaya">
            Wilaya
          </label>
          <select
            id="order-wilaya"
            name="wilaya"
            defaultValue={wilaya ? String(wilaya) : ""}
            className="px-3 py-2 border border-black/15 rounded-lg text-sm bg-white"
          >
            <option value="">All wilayas</option>
            {zones.map((zone) => (
              <option key={zone.wilaya_code} value={zone.wilaya_code}>
                {String(zone.wilaya_code).padStart(2, "0")} — {zone.name_fr}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80"
        >
          Filter
        </button>
        <Link
          href={buildHref({}, {})}
          className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100"
        >
          Reset
        </Link>
      </form>

      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-start text-black/60">
              <th className="px-4 py-3 font-medium text-start">Order</th>
              <th className="px-4 py-3 font-medium text-start">Guest</th>
              <th className="px-4 py-3 font-medium text-start">Phone</th>
              <th className="px-4 py-3 font-medium text-start">Wilaya</th>
              <th className="px-4 py-3 font-medium text-start">Delivery</th>
              <th className="px-4 py-3 font-medium text-start">Status</th>
              <th className="px-4 py-3 font-medium text-start">Total</th>
              <th className="px-4 py-3 font-medium text-start">Created</th>
              <th className="px-4 py-3 font-medium text-start">Quick action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const zone =
                order.wilaya_code != null ? zoneMap.get(order.wilaya_code) : null;
              return (
                <tr
                  key={order.id}
                  className="border-b border-black/5 hover:bg-gray-50"
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
                  <td className="px-4 py-3 text-black/70">
                    {zone
                      ? `${zone.name_fr} (${String(order.wilaya_code).padStart(2, "0")})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-black/70">
                    {order.delivery_type === "office" ? "Office" : "Home"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-black/60">
                    {new Date(order.created_at).toLocaleDateString()}
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
                <td colSpan={9} className="px-4 py-6 text-center text-black/50">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-black/60">
        <span>
          {total === 0
            ? "No results"
            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                page * PAGE_SIZE,
                total
              )} of ${total}`}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={buildHref(base, {
                status,
                page: page - 1,
              })}
              className="px-3 py-1.5 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              Previous
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-black/10 text-black/30">
              Previous
            </span>
          )}
          <span className="px-2 py-1.5">
            Page {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              href={buildHref(base, {
                status,
                page: page + 1,
              })}
              className="px-3 py-1.5 rounded-lg border border-black/15 hover:bg-gray-100"
            >
              Next
            </Link>
          ) : (
            <span className="px-3 py-1.5 rounded-lg border border-black/10 text-black/30">
              Next
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
