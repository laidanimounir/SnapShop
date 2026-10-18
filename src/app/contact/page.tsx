import type { Metadata } from "next";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/config";
import { ar } from "@/lib/store/i18n-ar";

export const metadata: Metadata = {
  title: `${ar.legal.contactTitle} — ${BRAND_NAME}`,
};

export default function ContactPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">{ar.legal.contactTitle}</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>{ar.legal.contact.p1}</p>
        <p>
          <span className="font-medium text-black">{ar.legal.contact.phoneLabel} </span>
          <a href={`tel:${CONTACT_PHONE}`} className="underline underline-offset-2" dir="ltr">
            {CONTACT_PHONE}
          </a>
        </p>
        <p>
          <span className="font-medium text-black">{ar.legal.contact.emailLabel} </span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline underline-offset-2"
            dir="ltr"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}
