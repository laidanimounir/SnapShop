import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ar } from "@/lib/store/i18n-ar";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">{ar.meta.notFoundTitle}</h1>
      <p className="text-black/60 mb-6">{ar.meta.notFoundText}</p>
      <Button asChild className="rounded-full">
        <Link href="/">{ar.meta.notFoundCta}</Link>
      </Button>
    </div>
  );
}
