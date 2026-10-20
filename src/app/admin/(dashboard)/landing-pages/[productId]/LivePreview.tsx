"use client";

import { useEffect, useRef, useState } from "react";

import SectionRenderer from "@/components/landing/SectionRenderer";
import { buildPreviewContent } from "@/lib/admin/landing-preview";
import type { Section } from "@/lib/admin/landing-sections";
import type { LandingOrderData } from "@/lib/landing/order-data";
import { ar, formatAr } from "@/lib/admin/i18n-ar";
import {
  LANDING_HEADING_FONT_CSS,
  safeThemeToCssVariables,
} from "@/lib/landing/theme-css";
import type { Theme } from "@/lib/landing/theme";
import { almarai, cairo, tajawal } from "@/styles/fonts";

type Device = "mobile" | "desktop";

// Logical device widths. The frame always renders at these widths and is
// scaled down with a CSS transform so the real layout stays intact even
// though the admin column is much narrower.
const DEVICE_WIDTH: Record<Device, number> = {
  mobile: 390,
  desktop: 1100,
};

// Live preview of the unsaved draft, rendered with the real section
// components and theme variables. Incomplete sections are filtered out by
// buildPreviewContent, so a half-typed section can never break the panel.
export function LivePreview({
  theme,
  sections,
  order,
}: {
  theme: Theme;
  sections: Section[];
  order?: LandingOrderData | null;
}) {
  const [device, setDevice] = useState<Device>("mobile");
  const preview = buildPreviewContent({ theme, sections });

  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setAvailableWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setContentHeight(el.scrollHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [device]);

  const frameWidth = DEVICE_WIDTH[device];
  // Never scale up: only shrink until the logical frame fits the column.
  const scale =
    availableWidth > 0 ? Math.min(1, availableWidth / frameWidth) : 1;

  const frameStyle = {
    ...safeThemeToCssVariables(preview.theme),
    fontFamily: "var(--font-body)",
    width: frameWidth,
    transform: `scale(${scale})`,
    transformOrigin: "top center",
    // Makes the frame a containing block so position:fixed bits (like the
    // sticky order button) stay inside the preview instead of the window.
  } as React.CSSProperties;

  return (
    <div className="bg-white border border-black/10 rounded-lg p-4 flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <h2 className="font-bold">{ar.landing.preview}</h2>
        <div className="flex items-center gap-1">
          {(["mobile", "desktop"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={device === value}
              onClick={() => setDevice(value)}
              className={`px-3 py-1 rounded-full text-xs border ${
                device === value
                  ? "bg-black text-white border-black"
                  : "border-black/15 hover:bg-gray-100"
              }`}
            >
              {value === "mobile"
                ? ar.landing.previewMobile
                : ar.landing.previewDesktop}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-black/50 mb-3">{ar.landing.previewNote}</p>

      {preview.droppedCount > 0 || preview.hiddenCount > 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
          {[
            preview.droppedCount > 0
              ? formatAr(ar.landing.previewDropped, { n: preview.droppedCount })
              : null,
            preview.hiddenCount > 0
              ? formatAr(ar.landing.previewHidden, { n: preview.hiddenCount })
              : null,
          ]
            .filter(Boolean)
            .join(" • ")}
        </p>
      ) : null}

      <div
        ref={viewportRef}
        className="bg-gray-100 rounded-lg p-3 flex-1 min-h-0 overflow-y-auto"
      >
        {/* Reserves the scaled footprint: the transform below doesn't
            affect layout, so the wrapper carries the visible size. */}
        <div
          style={{
            width: frameWidth * scale,
            height: contentHeight * scale,
            marginInline: "auto",
          }}
        >
          <div
            ref={frameRef}
            dir="rtl"
            style={frameStyle}
            className="overflow-hidden rounded-lg border border-black/10 bg-[var(--lp-bg)] text-[var(--lp-text)] shadow-sm"
          >
            <div
              data-landing-page
              className={`${cairo.variable} ${tajawal.variable} ${almarai.variable}`}
            >
              <style
                dangerouslySetInnerHTML={{ __html: LANDING_HEADING_FONT_CSS }}
              />
              {preview.sections.length === 0 ? (
                <p className="p-6 text-center text-sm text-black/40">
                  {ar.landing.previewEmpty}
                </p>
              ) : (
                <SectionRenderer
                  sections={preview.sections}
                  order={order}
                  preview
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-black/40 mt-2">
        {ar.landing.previewBreakpoints}
      </p>
    </div>
  );
}
