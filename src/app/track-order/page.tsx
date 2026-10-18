"use client";

import { useState } from "react";
import { getOrderByToken, type TrackedOrder } from "@/lib/api/orders";
import Price from "@/components/common/Price";
import { cairo } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ar, statusLabelAr, deliveryTypeLabelAr } from "@/lib/store/i18n-ar";

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
      if (!result) setError(ar.order.noOrder);
      else setOrder(result);
    } catch {
      setError(ar.order.lookupError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-10">
        <h1 className={cn([cairo.className, "text-2xl md:text-3xl text-center mb-6"])}>
          {ar.order.trackTitle}
        </h1>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            dir="ltr"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={ar.order.tokenPlaceholder}
            className="w-full px-4 py-3 rounded-full border border-black/10 outline-none focus:border-black/30"
          />
          <Button type="submit" disabled={loading} className="rounded-full bg-black">
            {loading ? ar.order.trackLoading : ar.order.track}
          </Button>
        </form>

        {error && <p className="text-center text-red-600 text-sm mt-4">{error}</p>}

        {order && (
          <div className="max-w-2xl mx-auto mt-8 border border-black/10 rounded-[20px] p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-black/60">{ar.order.status}</span>
              <span className="font-bold">{statusLabelAr(order.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">{ar.order.customer}</span>
              <span>{order.guest_name}</span>
            </div>
            {order.wilaya_name_ar && (
              <div className="flex justify-between">
                <span className="text-black/60">{ar.order.wilaya}</span>
                <span>{order.wilaya_name_ar}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-black/60">{ar.order.delivery}</span>
              <span>{deliveryTypeLabelAr(order.delivery_type ?? "home")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">{ar.order.placed}</span>
              <span>
                {new Date(order.created_at).toLocaleString("ar-DZ-u-nu-latn")}
              </span>
            </div>
            <hr className="border-t-black/10" />
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-black/70">
                  {item.product_name}
                  {[item.color, item.size].filter(Boolean).length > 0
                    ? ` (${[item.color, item.size].filter(Boolean).join(" / ")})`
                    : ""}{" "}
                  <bdi dir="ltr">× {item.quantity}</bdi>
                </span>
                <span className="font-medium">
                  <Price value={item.unit_price_at_purchase} />
                </span>
              </div>
            ))}
            <hr className="border-t-black/10" />
            <div className="flex justify-between text-sm">
              <span className="text-black/60">{ar.order.subtotal}</span>
              <span><Price value={order.subtotal} /></span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-black/60">{ar.order.discount}</span>
                <span className="text-red-600">-<Price value={order.discount_total} /></span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-black/60">{ar.order.deliveryFee}</span>
              <span><Price value={order.delivery_price ?? 0} /></span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>{ar.order.total}</span>
              <span><Price value={order.total} /></span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
