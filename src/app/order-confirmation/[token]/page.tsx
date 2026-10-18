"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getOrderByToken, type TrackedOrder } from "@/lib/api/orders";
import Price from "@/components/common/Price";
import { cairo } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ar, statusLabelAr, deliveryTypeLabelAr } from "@/lib/store/i18n-ar";

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
          <div className="py-20 text-center text-black/60">{ar.order.loadingOrder}</div>
        ) : notFound || !order ? (
          <div className="py-20 text-center">
            <p className="text-black/60 mb-4">{ar.order.couldNotFind}</p>
            <Button asChild className="rounded-full">
              <Link href="/track-order">{ar.order.trackAnOrder}</Link>
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
                {ar.order.orderPlaced}
              </h1>
              <p className="text-black/60 mt-2 text-sm">
                {ar.order.contactSoon}
              </p>
              <div
                dir="ltr"
                className="mt-3 inline-block px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm break-all max-w-full"
              >
                {token}
              </div>
            </div>

            <div className="border border-black/10 rounded-[20px] p-6 space-y-4">
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
              <div className="flex justify-between">
                <span className="text-black/60">{ar.order.subtotal}</span>
                <span><Price value={order.subtotal} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">{ar.order.discount}</span>
                <span className="text-red-600">-<Price value={order.discount_total} /></span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/60">{ar.order.deliveryFee}</span>
                <span><Price value={order.delivery_price ?? 0} /></span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{ar.order.total}</span>
                <span><Price value={order.total} /></span>
              </div>
            </div>

            <div className="text-center mt-6 gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/shop">{ar.order.continueShopping}</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/track-order">{ar.order.trackOrder}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
