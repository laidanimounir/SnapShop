"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrderByToken, type TrackedOrder } from "@/lib/api/orders";
import { formatPrice } from "@/lib/pricing";
import { cairo } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function OrderConfirmationPage() {
  const params = useParams();
  const token = (params.token as string) ?? "";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getOrderByToken(token)
      .then((o) => {
        if (!o) setNotFound(true);
        else setOrder(o);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0 py-10">
        {loading ? (
          <div className="py-20 text-center text-black/60">Loading order...</div>
        ) : notFound || !order ? (
          <div className="py-20 text-center">
            <p className="text-black/60 mb-4">Could not find that order.</p>
            <Button asChild className="rounded-full">
              <Link href="/track-order">Track an order</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className={cn([cairo.className, "text-2xl md:text-3xl"])}>
                Order placed successfully!
              </h1>
              <p className="text-black/60 mt-2 text-sm">
                We will contact you shortly. Save this token to track your order:
              </p>
              <div className="mt-3 inline-block px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm break-all max-w-full">
                {token}
              </div>
            </div>

            <div className="border border-black/10 rounded-[20px] p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-black/60">Status</span>
                <span className="font-bold capitalize">
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Customer</span>
                <span>{order.guest_name}</span>
              </div>
              {(order.wilaya_name_fr || order.wilaya_name_ar) && (
                <div className="flex justify-between">
                  <span className="text-black/60">Wilaya</span>
                  <span>
                    {[order.wilaya_name_fr, order.wilaya_name_ar]
                      .filter(Boolean)
                      .join(" — ")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-black/60">Delivery</span>
                <span className="capitalize">
                  {order.delivery_type === "office"
                    ? "Office pickup"
                    : "Home delivery"}
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
                    × {item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.unit_price_at_purchase)}</span>
                </div>
              ))}
              <hr className="border-t-black/10" />
              <div className="flex justify-between">
                <span className="text-black/60">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Discount</span>
                <span className="text-red-600">-{formatPrice(order.discount_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">Delivery</span>
                <span>{formatPrice(order.delivery_price ?? 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="text-center mt-6 space-x-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/track-order">Track Order</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
