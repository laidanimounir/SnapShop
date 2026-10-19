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

  // Reserve room for the fixed mobile CTA so it never covers the end of the
  // page (the order form's submit button sits right above it). The bar only
  // renders when both the CTA and its order-form target are on the page.
  const hasStickyCta =
    page.content.sections.some(
      (section) => section.type === "sticky_cta" && !section.hidden
    ) &&
    page.content.sections.some(
      (section) => section.type === "order_form" && !section.hidden
    );

  return (
    <main
      data-landing-page
      className={`${cairo.variable} ${tajawal.variable} ${almarai.variable}${
        hasStickyCta
          ? " pb-[calc(6rem_+_env(safe-area-inset-bottom))] md:pb-0"
          : ""
      }`}
      style={style}
    >
      {/* Static server-generated rule (no user input) so headings use the
          theme's heading font instead of the body font. */}
      <style dangerouslySetInnerHTML={{ __html: LANDING_HEADING_FONT_CSS }} />
      <SectionRenderer sections={page.content.sections} order={order} />
    </main>
  );
}
