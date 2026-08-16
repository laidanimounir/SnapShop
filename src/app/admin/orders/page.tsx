import Link from "next/link";
import { getOrders } from "@/lib/api/admin";
import { formatPrice } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <div className="bg-white border border-black/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-black/60">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-black/5 hover:bg-gray-50">
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
                <td className="px-4 py-3 capitalize">{order.status}</td>
                <td className="px-4 py-3">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-black/60">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-black/50">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
