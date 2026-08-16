"use client";

import { useState } from "react";
import { getOrderByToken, type TrackedOrder } from "@/lib/api/orders";
import { formatPrice } from "@/lib/pricing";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function TrackOrderPage() {
  const [token, setToken] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const result = await getOrderByToken(token.trim());
      if (!result) setError("No order found with that token.");
      else setOrder(result);
    } catch {
      setError("Something went wrong looking up your order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-10">
        <h1 className={cn([integralCF.className, "text-2xl md:text-3xl text-center mb-6"])}>
          Track your order
        </h1>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex space-x-2">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your confirmation token"
            className="w-full px-4 py-3 rounded-full border border-black/10 outline-none focus:border-black/30"
          />
          <Button type="submit" disabled={loading} className="rounded-full bg-black">
            {loading ? "..." : "Track"}
          </Button>
        </form>

        {error && <p className="text-center text-red-600 text-sm mt-4">{error}</p>}

        {order && (
          <div className="max-w-2xl mx-auto mt-8 border border-black/10 rounded-[20px] p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-black/60">Status</span>
              <span className="font-bold capitalize">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Customer</span>
              <span>{order.guest_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Placed</span>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <hr className="border-t-black/10" />
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-black/70">
                  {item.product_name}
                  {item.color && item.size ? ` (${item.color} / ${item.size})` : ""} × {item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.unit_price_at_purchase)}</span>
              </div>
            ))}
            <hr className="border-t-black/10" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
