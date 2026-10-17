import Link from "next/link";
import { getOrderById } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusActions from "@/components/admin/OrderStatusActions";
import AdminNoteEditor from "@/components/admin/AdminNoteEditor";
import PrintButton from "@/components/admin/PrintButton";

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
        <h1 className="text-2xl font-bold mb-4">Order</h1>
        <p className="text-black/50">Order not found.</p>
        <Link href="/admin/orders" className="text-sm underline underline-offset-2">
          Back to orders
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
    order.delivery_type === "office" ? "Office pickup" : "Home delivery";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <h1 className="text-2xl font-bold">Order {order.id.slice(0, 8)}</h1>
        <div className="flex items-center gap-3">
          <PrintButton />
          <Link href="/admin/orders" className="text-sm underline underline-offset-2">
            Back to orders
          </Link>
        </div>
      </div>

      <div className="print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold">Customer</h2>
            <p>
              <span className="text-black/60">Name:</span> {order.guest_name}
            </p>
            <p>
              <span className="text-black/60">Phone:</span> {order.guest_phone}
            </p>
            {order.guest_email && (
              <p>
                <span className="text-black/60">Email:</span> {order.guest_email}
              </p>
            )}
            <p>
              <span className="text-black/60">Address:</span>{" "}
              {order.guest_address}
            </p>
            <p>
              <span className="text-black/60">Wilaya:</span> {wilayaLabel}
            </p>
            <p>
              <span className="text-black/60">Delivery:</span> {deliveryLabel} —{" "}
              {formatPrice(order.delivery_price)}
            </p>
            <p>
              <span className="text-black/60">Payment:</span>{" "}
              {order.payment_method}
            </p>
            <p>
              <span className="text-black/60">Created:</span>{" "}
              {new Date(order.created_at).toLocaleString()}
            </p>
            <div>
              <span className="text-black/60">Confirmation token:</span>
              <p className="font-mono text-xs break-all mt-1">
                {order.confirmation_token}
              </p>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
            <h2 className="font-semibold">Status</h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-xs text-black/50">
                Updated {new Date(order.status_updated_at).toLocaleString()}
              </span>
            </div>
            <OrderStatusActions orderId={order.id} status={order.status} />
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-5 mt-4">
          <h2 className="font-semibold mb-3">Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-start text-black/60">
                <th className="py-2 font-medium text-start">Product</th>
                <th className="py-2 font-medium text-start">Variant</th>
                <th className="py-2 font-medium text-start">Qty</th>
                <th className="py-2 font-medium text-start">Unit price</th>
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
              <span className="text-black/60">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Discount</span>
              <span className="text-red-600">
                -{formatPrice(order.discount_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">
                Delivery ({deliveryLabel.toLowerCase()})
              </span>
              <span>{formatPrice(order.delivery_price)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border border-black/10 rounded-lg p-5">
            <h2 className="font-semibold mb-3">Admin note</h2>
            <AdminNoteEditor
              orderId={order.id}
              initialNote={order.admin_note}
            />
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-5">
            <h2 className="font-semibold mb-3">Status timeline</h2>
            {order.history.length === 0 ? (
              <p className="text-sm text-black/50">No status changes yet.</p>
            ) : (
              <ol className="space-y-3">
                {order.history.map((entry) => (
                  <li
                    key={entry.id}
                    className="text-sm border-s-2 border-black/10 ps-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-black/50">
                        {entry.old_status ?? "—"}
                      </span>
                      <span aria-hidden="true">→</span>
                      <StatusBadge status={entry.new_status} />
                    </div>
                    <p className="text-xs text-black/50 mt-1">
                      {new Date(entry.changed_at).toLocaleString()}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-black/70 mt-1">
                        Note: {entry.note}
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
          <h1 className="text-xl font-bold">Delivery slip — SnapShop</h1>
          <p className="text-sm">
            Order {order.id.slice(0, 8).toUpperCase()} ·{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p>
              <strong>Customer:</strong> {order.guest_name}
            </p>
            <p>
              <strong>Phone:</strong> {order.guest_phone}
            </p>
            <p>
              <strong>Address:</strong> {order.guest_address}
            </p>
            <p>
              <strong>Wilaya:</strong> {wilayaLabel}
            </p>
            <p>
              <strong>Delivery:</strong> {deliveryLabel}
            </p>
          </div>
          <div>
            <p>
              <strong>Payment:</strong> Cash on delivery (COD)
            </p>
            <p>
              <strong>Items:</strong>{" "}
              {order.items.reduce((sum, i) => sum + i.quantity, 0)}
            </p>
            <p className="mt-2 text-lg">
              <strong>Total to collect: {formatPrice(order.total)}</strong>
            </p>
          </div>
        </div>
        <table className="w-full text-sm border-t border-black">
          <thead>
            <tr className="border-b border-black text-start">
              <th className="py-2 text-start">Product</th>
              <th className="py-2 text-start">Variant</th>
              <th className="py-2 text-start">Qty</th>
              <th className="py-2 text-start">Unit</th>
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
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatPrice(order.discount_total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{formatPrice(order.delivery_price)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-black pt-1">
            <span>Total to collect</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
