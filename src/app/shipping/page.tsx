import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Shipping Info — ${BRAND_NAME}`,
};

export default function ShippingPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">Shipping Info</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          {BRAND_NAME} delivers cash-on-delivery orders to the address you
          provide at checkout. Please make sure your phone number is correct —
          our delivery team calls to confirm before arriving.
        </p>
        <p>
          Delivery price depends on your wilaya and on the method you choose:
          home delivery or office pickup. The exact price for your wilaya is
          shown at checkout before you confirm the order — there is no
          free-delivery threshold.
        </p>
        <p>
          Delivery times depend on your area and are confirmed by phone when
          your order is processed. You can follow your order status anytime
          with your confirmation token on the tracking page.
        </p>
      </div>
      <LegalNote />
    </main>
  );
}
