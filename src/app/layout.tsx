import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { satoshi } from "@/styles/fonts";
import StorefrontChrome from "@/components/layout/StorefrontChrome";
import HolyLoader from "holy-loader";
import Providers from "./providers";
import { BRAND_NAME, TAGLINE } from "@/lib/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${BRAND_NAME} - Modern E-Commerce`,
  description: TAGLINE,
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
    <html lang="en">
      <body className={satoshi.className}>
        <HolyLoader color="#C9A24B" />
        <Providers>
          <StorefrontChrome>{children}</StorefrontChrome>
        </Providers>
      </body>
    </html>
  );
}
