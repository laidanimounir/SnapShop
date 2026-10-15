import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `About Us — ${BRAND_NAME}`,
};

export default function AboutPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">About Us</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          {BRAND_NAME} is an online clothing store with simple cash-on-delivery
          ordering: browse the shop, pick your color and size, check out as a
          guest, and pay when your order arrives.
        </p>
        <p>
          We focus on everyday styles at fair prices, with stock levels shown
          honestly on every product page.
        </p>
      </div>
    </main>
  );
}
