"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  facebookPixelScript,
  tiktokPixelScript,
} from "@/lib/landing/pixels";

/**
 * Base pixel code for the storefront, injected from the root layout.
 * Ids arrive already validated (they passed the existing regexes in
 * parsePixelId / parseTiktokPixelId) and only when the store setting is
 * enabled. Never rendered under /admin.
 */
export default function StorefrontPixels({
  facebookPixelId,
  tiktokPixelId,
}: {
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
}) {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (!facebookPixelId && !tiktokPixelId) return null;

  return (
    <>
      {facebookPixelId && (
        <Script
          id="storefront-meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: facebookPixelScript(facebookPixelId),
          }}
        />
      )}
      {tiktokPixelId && (
        <Script
          id="storefront-tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: tiktokPixelScript(tiktokPixelId),
          }}
        />
      )}
    </>
  );
}
