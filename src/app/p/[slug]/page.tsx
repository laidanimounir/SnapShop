import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/landing/SectionRenderer";
import { getPublishedLandingPage, getLandingOrderData } from "@/lib/landing/api";
import {
  LANDING_HEADING_FONT_CSS,
  themeToCssVariables,
} from "@/lib/landing/theme-css";
import { cairo, tajawal, almarai } from "@/styles/fonts";
import { ar } from "@/lib/store/i18n-ar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await getPublishedLandingPage(params.slug);
  if (!page) return { title: ar.meta.notFoundTitle };
  const title = page.seoTitle ?? page.productName ?? page.slug;
  const description = page.seoDescription ?? undefined;
  const canonical = `${SITE_URL.replace(/\/$/, "")}/p/${page.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      locale: ar.meta.ogLocale,
      ...(page.ogImageUrl ? { images: [{ url: page.ogImageUrl }] } : {}),
    },
  };
}

export default async function ProductLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPublishedLandingPage(params.slug);
  if (!page) notFound();

  // Real prices, variants and delivery zones for the order form section.
  // Fetched with the cookie-free anon client so the page stays ISR-cached.
  const order = await getLandingOrderData(page.productId);

  const style = {
    ...themeToCssVariables(page.content.theme),
    fontFamily: "var(--font-body)",
  } as CSSProperties;

  return (
    <main
      data-landing-page
      className={`${cairo.variable} ${tajawal.variable} ${almarai.variable}`}
      style={style}
    >
      {/* Static server-generated rule (no user input) so headings use the
          theme's heading font instead of the body font. */}
      <style dangerouslySetInnerHTML={{ __html: LANDING_HEADING_FONT_CSS }} />
      <SectionRenderer sections={page.content.sections} order={order} />
    </main>
  );
}
