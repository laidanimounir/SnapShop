import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
};

export default function PrivacyPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>
          {BRAND_NAME} collects only the information needed to fulfil your
          order: your name, phone number, shipping address, and email address
          (if you provide one). There are no customer accounts — you check out
          as a guest.
        </p>
        <p>
          Your details are stored securely in our database and used solely to
          process, deliver, and support your order (including contacting you
          about delivery). We do not sell your personal information.
        </p>
        <p>
          To request a copy or deletion of your data, contact us through the
          details on the contact page and include the phone number you ordered
          with.
        </p>
      </div>
      <LegalNote />
    </main>
  );
}
