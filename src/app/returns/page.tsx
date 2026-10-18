import type { Metadata } from "next";
import LegalNote from "@/components/legal/LegalNote";
import { BRAND_NAME } from "@/lib/config";
import { ar } from "@/lib/store/i18n-ar";

export const metadata: Metadata = {
  title: `${ar.legal.returnsTitle} — ${BRAND_NAME}`,
};

export default function ReturnsPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">{ar.legal.returnsTitle}</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>{ar.legal.returns.p1}</p>
        <p>{ar.legal.returns.p2}</p>
        <p>{ar.legal.returns.p3}</p>
      </div>
      <LegalNote />
    </main>
  );
}
