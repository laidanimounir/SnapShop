import Link from "next/link";
import { ar } from "@/lib/store/i18n-ar";

export default function OfferNotFound() {
  return (
    <main className="flex flex-col items-center justify-center py-40 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">{ar.meta.offerNotFoundTitle}</h1>
      <p className="text-black/60 mb-6">{ar.meta.offerNotFoundText}</p>
      <Link
        href="/shop"
        className="px-6 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-all"
      >
        {ar.meta.offerNotFoundCta}
      </Link>
    </main>
  );
}
