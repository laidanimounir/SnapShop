import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { cairo } from "@/styles/fonts";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import HolyLoader from "holy-loader";
import Providers from "./providers";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        {/* TODO(tracking): if/when tracking is deliberately enabled, read
            store_settings.tracking_pixel on the server and inject the script
            here. Intentionally NOT implemented: no tracking is injected. */}
        <HolyLoader color="#C9A24B" />
        <Providers>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
