import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import SectionRenderer from "@/components/landing/SectionRenderer";
import { getLandingPageForProduct } from "@/lib/api/landing-admin";
import { getLandingOrderData } from "@/lib/landing/api";
import { parsePageContent } from "@/lib/landing/content";
import {
  LANDING_HEADING_FONT_CSS,
  themeToCssVariables,
} from "@/lib/landing/theme-css";
import { cairo, tajawal, almarai } from "@/styles/fonts";
import { ar } from "@/lib/admin/i18n-ar";

export const dynamic = "force-dynamic";

// Admin-only preview of the current DRAFT (published or not). Pixels are
// intentionally not rendered here so preview clicks never fire real
// conversion events.
export default async function AdminLandingDraftPreviewPage({
  params,
}: {
  params: { productId: string };
}) {
  const data = await getLandingPageForProduct(params.productId);
  if (!data || !data.page) notFound();

  const content = parsePageContent(data.page.draft_content);
  const order = await getLandingOrderData(data.product.id);

  const style = {
    ...themeToCssVariables(content.theme),
    fontFamily: "var(--font-body)",
  } as CSSProperties;

  return (
    <div>
      <p className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
        {ar.landing.previewDraftNote}
      </p>
      <div className="border border-black/10 rounded-lg overflow-hidden">
        <main
          data-landing-page
          className={`${cairo.variable} ${tajawal.variable} ${almarai.variable}`}
          style={style}
        >
          <style
            dangerouslySetInnerHTML={{ __html: LANDING_HEADING_FONT_CSS }}
          />
          <SectionRenderer sections={content.sections} order={order} />
        </main>
      </div>
    </div>
  );
}
