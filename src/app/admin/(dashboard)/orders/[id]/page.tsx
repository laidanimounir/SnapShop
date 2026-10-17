import Link from "next/link";
import { getOrderById } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import AdminNoteEditor from "@/components/admin/AdminNoteEditor";
import PrintButton from "@/components/admin/PrintButton";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrderById(params.id);

  if (!order) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">{ar.orders.detailTitle}</h1>
        <p className="text-black/50">{ar.messages.orderNotFound}</p>
        <Link href="/admin/orders" className="text-sm underline underline-offset-2">
          {ar.common.back}
        </Link>
      </div>
    );
  }

  const wilayaLabel =
    order.wilaya_name_fr || order.wilaya_name_ar
      ? `${order.wilaya_name_fr ?? ""}${
          order.wilaya_name_ar ? ` — ${order.wilaya_name_ar}` : ""
        }${order.wilaya_code ? ` (${String(order.wilaya_code).padStart(2, "0")})` : ""}`
      : "—";
  const deliveryLabel =
    order.delivery_type === "office" ? ar.common.office : ar.common.home;
  const shortId = order.id.slice(0, 8);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <h1 className="text-2xl font-bold">
          {ar.orders.detailTitle} {shortId}
        </h1>
        <div className="flex items-center gap-3">
          <PrintButton />
          <Link href="/admin/orders" className="text-sm underline underline-offset-2">
            {ar.common.back}
          </Link>
        </div>
      </div>

      <div className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold">{ar.orders.customer}</h2>
            <p>
              <span className="text-black/60">{ar.common.name}:</span>{" "}
              {order.guest_name}
            </p>
            <p>
              <span className="text-black/60">{ar.common.phone}:</span>{" "}
              {order.guest_phone}
            </p>
            {order.guest_email && (
              <p>
                <span className="text-black/60">{ar.common.email}:</span>{" "}
                {order.guest_email}
              </p>
            )}
            <p>
              <span className="text-black/60">{ar.common.address}:</span>{" "}
              {order.guest_address}
            </p>
            <p>
              <span className="text-black/60">{ar.orders.wilaya}:</span>{" "}
              {wilayaLabel}
            </p>
            <p>
              <span className="text-black/60">{ar.common.delivery}:</span>{" "}
              {deliveryLabel} — {formatPrice(order.delivery_price)}
            </p>
            <p>
              <span className="text-black/60">{ar.orders.payment}:</span>{" "}
              {ar.orders.cod}
            </p>
            <p>
              <span className="text-black/60">{ar.common.created}:</span>{" "}
              {new Date(order.created_at).toLocaleString("en-GB")}
            </p>
            <div>
              <span className="text-black/60">{ar.orders.confirmationToken}:</span>
              <p className="font-mono text-xs break-all mt-1">
                {order.confirmation_token}
              </p>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold">{ar.common.status}</h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-xs text-black/50">
                {ar.common.updated}{" "}
                {new Date(order.status_updated_at).toLocaleString("en-GB")}
              </span>
            </div>
            <OrderStatusActions orderId={order.id} status={order.status} />
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-5 mt-4">
          <h2 className="font-semibold mb-3">{ar.orders.items}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-start text-black/60">
                <th className="py-2 font-medium text-start">{ar.orders.items}</th>
                <th className="py-2 font-medium text-start">{ar.orders.variant}</th>
                <th className="py-2 font-medium text-start">{ar.orders.qty}</th>
                <th className="py-2 font-medium text-start">{ar.orders.unitPrice}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-black/5">
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2 text-black/60">
                    {[item.color, item.size].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">
                    {formatPrice(item.unit_price_at_purchase)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">{ar.common.subtotal}</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">{ar.common.discount}</span>
              <span className="text-red-600">
                -{formatPrice(order.discount_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">
                {ar.common.delivery} ({deliveryLabel})
              </span>
              <span>{formatPrice(order.delivery_price)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{ar.common.total}</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border border-black/10 rounded-lg p-5">
            <h2 className="font-semibold mb-3">{ar.orders.adminNote}</h2>
            <AdminNoteEditor
              orderId={order.id}
              initialNote={order.admin_note}
            />
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-5">
            <h2 className="font-semibold mb-3">{ar.orders.timeline}</h2>
            {order.history.length === 0 ? (
              <p className="text-sm text-black/50">
                {ar.orders.noStatusChanges}
              </p>
            ) : (
              <ol className="space-y-3">
                {order.history.map((entry) => (
                  <li
                    key={entry.id}
                    className="text-sm border-s-2 border-black/10 ps-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-black/50">
                        {entry.old_status
                          ? ar.statuses[
                              entry.old_status as keyof typeof ar.statuses
                            ] ?? entry.old_status
                          : "—"}
                      </span>
                      <span aria-hidden="true">→</span>
                      <StatusBadge status={entry.new_status} />
                    </div>
                    <p className="text-xs text-black/50 mt-1">
                      {new Date(entry.changed_at).toLocaleString("en-GB")}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-black/70 mt-1">
                        {ar.orders.noteLabel}: {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Print-friendly delivery slip */}
      <div className="hidden print:block text-black">
        <div className="border-b-2 border-black pb-2 mb-4">
          <h1 className="text-xl font-bold">{ar.orders.slipTitle}</h1>
          <p className="text-sm">
            {ar.orders.orderNumber} {shortId.toUpperCase()} ·{" "}
            {new Date(order.created_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p>
              <strong>{ar.orders.customer}:</strong> {order.guest_name}
            </p>
            <p>
              <strong>{ar.common.phone}:</strong> {order.guest_phone}
            </p>
            <p>
              <strong>{ar.common.address}:</strong> {order.guest_address}
            </p>
            <p>
              <strong>{ar.orders.wilaya}:</strong> {wilayaLabel}
            </p>
            <p>
              <strong>{ar.common.delivery}:</strong> {deliveryLabel}
            </p>
          </div>
          <div>
            <p>
              <strong>{ar.orders.payment}:</strong> {ar.orders.cod}
            </p>
            <p>
              <strong>{ar.orders.items}:</strong>{" "}
              {order.items.reduce((sum, i) => sum + i.quantity, 0)}
            </p>
            <p className="mt-2 text-lg">
              <strong>
                {ar.orders.totalToCollect}: {formatPrice(order.total)}
              </strong>
            </p>
          </div>
        </div>
        <table className="w-full text-sm border-t border-black">
          <thead>
            <tr className="border-b border-black text-start">
              <th className="py-2 text-start">{ar.products.product}</th>
              <th className="py-2 text-start">{ar.orders.variant}</th>
              <th className="py-2 text-start">{ar.orders.qty}</th>
              <th className="py-2 text-start">{ar.orders.unitPrice}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-black/30">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2">
                  {[item.color, item.size].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">
                  {formatPrice(item.unit_price_at_purchase)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span>{ar.common.subtotal}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{ar.common.discount}</span>
            <span>-{formatPrice(order.discount_total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{ar.common.delivery}</span>
            <span>{formatPrice(order.delivery_price)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-black pt-1">
            <span>{ar.orders.totalToCollect}</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
