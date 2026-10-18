import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/config";
import { ar, formatAr } from "@/lib/store/i18n-ar";

export const metadata: Metadata = {
  title: `${ar.legal.aboutTitle} — ${BRAND_NAME}`,
};

export default function AboutPage() {
  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="text-2xl font-semibold mb-6">{ar.legal.aboutTitle}</h1>
      <div className="space-y-4 text-sm text-black/70 leading-relaxed">
        <p>{formatAr(ar.legal.about.p1, { brand: BRAND_NAME })}</p>
        <p>{ar.legal.about.p2}</p>
      </div>
    </main>
  );
}
