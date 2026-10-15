import type { Metadata } from "next";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/config";

export const metadata: Metadata = {
  title: `Contact Us — ${BRAND_NAME}`,
};

export default function ContactPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">Contact Us</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          Questions about an order, a return, or a product? Reach out — please
          include your order token if your message is about an existing order.
        </p>
        <p>
          <span className="font-medium text-black">Phone / WhatsApp: </span>
          <a href={`tel:${CONTACT_PHONE}`} className="underline underline-offset-2">
            {CONTACT_PHONE}
          </a>
        </p>
        <p>
          <span className="font-medium text-black">Email: </span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}
