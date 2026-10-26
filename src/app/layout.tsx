import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { cairo } from "@/styles/fonts";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import StorefrontPixels from "@/components/tracking/StorefrontPixels";
import { getPublicPixelSettings } from "@/lib/api/public-store-settings";
import HolyLoader from "holy-loader";
import { BRAND_NAME, TAGLINE } from "@/lib/config";
import { ar } from "@/lib/store/i18n-ar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND_NAME} — ${ar.meta.titleSuffix}`,
  description: TAGLINE,
  openGraph: {
    locale: ar.meta.ogLocale,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Public, read-only pixel settings; silently "disabled" until the
  // public read policy (migration 0019) is applied.
  const pixel = await getPublicPixelSettings();

  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <StorefrontPixels
          facebookPixelId={pixel.enabled ? pixel.facebookPixelId : null}
          tiktokPixelId={pixel.enabled ? pixel.tiktokPixelId : null}
        />
        <HolyLoader color="#C9A24B" />
        <StorefrontChrome>{children}</StorefrontChrome>
      </body>
    </html>
  );
}
