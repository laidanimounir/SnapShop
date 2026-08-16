import Link from "next/link";
import { getOrderById } from "@/lib/api/admin";
import { updateOrderStatus } from "@/app/admin/actions";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

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

  const updateAction = updateOrderStatus.bind(null, order.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Order {order.id.slice(0, 8)}</h1>
        <Link href="/admin/orders" className="text-sm underline underline-offset-2">
          Back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold">Guest</h2>
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
            <span className="text-black/60">Address:</span> {order.guest_address}
          </p>
          <p>
            <span className="text-black/60">Payment:</span> {order.payment_method}
          </p>
          <p>
            <span className="text-black/60">Created:</span>{" "}
            {new Date(order.created_at).toLocaleString()}
          </p>
          <div>
            <span className="text-black/60">Confirmation token:</span>
            <p className="font-mono text-xs break-all mt-1">{order.confirmation_token}</p>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold">Status</h2>
          <form action={updateAction} className="flex items-center space-x-2">
            <select
              name="status"
              defaultValue={order.status}
              className="px-3 py-2 border border-black/10 rounded-lg text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-black/80"
            >
              Save
            </button>
          </form>
          <p className="text-sm text-black/60">
            Current status: <span className="capitalize font-medium text-black">{order.status}</span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-lg p-5 mt-4">
        <h2 className="font-semibold mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/60">
              <th className="py-2 font-medium">Product</th>
              <th className="py-2 font-medium">Variant</th>
              <th className="py-2 font-medium">Qty</th>
              <th className="py-2 font-medium">Unit price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2 text-black/60">
                  {[item.color, item.size].filter(Boolean).join(" / ") || "-"}
                </td>
                <td className="py-2">{item.quantity}</td>
                <td className="py-2">{formatPrice(item.unit_price_at_purchase)}</td>
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
            <span className="text-red-600">-{formatPrice(order.discount_total)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
