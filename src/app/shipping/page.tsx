import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";
import { ar, formatAr } from "@/lib/store/i18n-ar";

export const metadata: Metadata = {
  title: `${ar.legal.shippingTitle} — ${BRAND_NAME}`,
};

export default function ShippingPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">{ar.legal.shippingTitle}</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>{formatAr(ar.legal.shipping.p1, { brand: BRAND_NAME })}</p>
        <p>{ar.legal.shipping.p2}</p>
        <p>{ar.legal.shipping.p3}</p>
      </div>
      <LegalNote />
    </main>
  );
}
