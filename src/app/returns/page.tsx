import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Returns & Exchanges — ${BRAND_NAME}`,
};

export default function ReturnsPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">Returns & Exchanges</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          If something is wrong with your order (wrong item, damaged item, or
          sizing issue), contact us within 7 days of delivery with your order
          token and we will arrange a return or exchange.
        </p>
        <p>
          Returned items must be unworn, unwashed, and in their original
          condition. Because all orders are cash on delivery, approved refunds
          are handled in cash on collection or on your next delivery.
        </p>
        <p>
          To start a return, reach out via the contact page with your order
          token and a short description of the issue.
        </p>
      </div>
      <LegalNote />
    </main>
  );
}
