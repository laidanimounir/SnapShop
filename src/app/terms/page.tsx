import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${BRAND_NAME}`,
};

export default function TermsPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">Terms & Conditions</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          By placing an order with {BRAND_NAME}, you agree to the following
          terms. All orders are cash on delivery (COD): you pay the order
          total in cash when you receive your items.
        </p>
        <p>
          Prices are shown on each product page. Discounts, when available, are
          applied automatically at checkout. Product availability and stock
          levels may change; if an item becomes unavailable after you order, we
          will contact you to arrange a replacement or cancellation.
        </p>
        <p>
          After checkout you receive an order confirmation token. Keep it safe —
          it is the only way to look up your order on the tracking page.
        </p>
        <p>
          You may request cancellation of a pending order by contacting us as
          soon as possible with your order token.
        </p>
      </div>
      <LegalNote />
    </main>
  );
}
