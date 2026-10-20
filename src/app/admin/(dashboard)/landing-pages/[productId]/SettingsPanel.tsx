"use client";

import { useState } from "react";

import { ar } from "@/lib/admin/i18n-ar";
import { LANDING_FONTS, type Theme } from "@/lib/landing/theme";
import { ImageUploadButton } from "./ImageUploadButton";

const inputCls = "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";
const labelCls = "block text-sm font-medium mb-1";

export type SettingsFields = {
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  facebookPixelId: string;
  tiktokPixelId: string;
};

const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: "primaryColor", label: ar.landing.primaryColor },
  { key: "accentColor", label: ar.landing.accentColor },
  { key: "pageBgColor", label: ar.landing.pageBgColor },
  { key: "textColor", label: ar.landing.textColor },
  { key: "buttonBgColor", label: ar.landing.buttonBgColor },
  { key: "buttonTextColor", label: ar.landing.buttonTextColor },
];

const FONT_LABELS: Record<(typeof LANDING_FONTS)[number], string> = {
  cairo: "Cairo",
  tajawal: "Tajawal",
  almarai: "Almarai",
};

function CollapsibleGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-black/10 rounded-lg">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-start hover:bg-gray-50"
      >
        <span>{title}</span>
        <span aria-hidden="true" className="text-black/40">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="border-t border-black/10 p-3">{children}</div>}
    </div>
  );
}

export function ThemeFields({
  theme,
  onTheme,
}: {
  theme: Theme;
  onTheme: (patch: Partial<Theme>) => void;
}) {
  const colorValue = (value: string) =>
    /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div className="space-y-2">
      <CollapsibleGroup title={ar.landing.colors} defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map((field) => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorValue(String(theme[field.key]))}
                  onChange={(e) =>
                    onTheme({ [field.key]: e.target.value } as Partial<Theme>)
                  }
                  className="h-9 w-10 rounded border border-black/15"
                />
                <input
                  className={`${inputCls} font-mono`}
                  dir="ltr"
                  value={String(theme[field.key])}
                  onChange={(e) =>
                    onTheme({ [field.key]: e.target.value } as Partial<Theme>)
                  }
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup title={ar.landing.groupButtons}>
        <div>
          <label className={labelCls}>{ar.landing.buttonRadius}</label>
          <input
            type="number"
            min={0}
            max={40}
            className={inputCls}
            value={Number(theme.buttonRadius)}
            onChange={(e) =>
              onTheme({ buttonRadius: Number(e.target.value) })
            }
          />
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup title={ar.landing.groupTypography}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>{ar.landing.headingFont}</label>
            <select
              className={inputCls}
              value={theme.headingFont}
              onChange={(e) =>
                onTheme({ headingFont: e.target.value as Theme["headingFont"] })
              }
            >
              {LANDING_FONTS.map((font) => (
                <option key={font} value={font}>
                  {FONT_LABELS[font]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>{ar.landing.bodyFont}</label>
            <select
              className={inputCls}
              value={theme.bodyFont}
              onChange={(e) =>
                onTheme({ bodyFont: e.target.value as Theme["bodyFont"] })
              }
            >
              {LANDING_FONTS.map((font) => (
                <option key={font} value={font}>
                  {FONT_LABELS[font]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>{ar.landing.baseFontSize}</label>
          <input
            type="number"
            min={14}
            max={28}
            className={inputCls}
            value={Number(theme.baseFontSize)}
            onChange={(e) => onTheme({ baseFontSize: Number(e.target.value) })}
          />
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup title={ar.landing.groupSpacing}>
        <div>
          <label className={labelCls}>{ar.landing.sectionSpacing}</label>
          <input
            type="number"
            min={0}
            max={160}
            className={inputCls}
            value={Number(theme.sectionSpacing)}
            onChange={(e) =>
              onTheme({ sectionSpacing: Number(e.target.value) })
            }
          />
        </div>
      </CollapsibleGroup>
    </div>
  );
}

export function SeoFields({
  pageId,
  fields,
  onField,
}: {
  pageId: string;
  fields: SettingsFields;
  onField: (key: keyof SettingsFields, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>{ar.landing.seoTitle}</label>
          <input
            className={inputCls}
            value={fields.seoTitle}
            onChange={(e) => onField("seoTitle", e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelCls}>{ar.landing.seoDescription}</label>
          <textarea
            className={inputCls}
            rows={3}
            value={fields.seoDescription}
            onChange={(e) => onField("seoDescription", e.target.value)}
            maxLength={400}
          />
        </div>
        <div>
          <label className={labelCls}>{ar.landing.ogImage}</label>
          <input
            className={`${inputCls} font-mono`}
            dir="ltr"
            value={fields.ogImageUrl}
            onChange={(e) => onField("ogImageUrl", e.target.value)}
            maxLength={2048}
          />
          <ImageUploadButton
            pageId={pageId}
            onUploaded={(url) => onField("ogImageUrl", url)}
          />
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <h3 className="font-medium mb-1">{ar.landing.pixels}</h3>
        <p className="text-xs text-black/50 mb-3">{ar.landing.pixelsHelp}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>{ar.landing.facebookPixel}</label>
            <input
              className={`${inputCls} font-mono`}
              dir="ltr"
              inputMode="numeric"
              value={fields.facebookPixelId}
              onChange={(e) => onField("facebookPixelId", e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className={labelCls}>{ar.landing.tiktokPixel}</label>
            <input
              className={`${inputCls} font-mono`}
              dir="ltr"
              value={fields.tiktokPixelId}
              onChange={(e) => onField("tiktokPixelId", e.target.value)}
              maxLength={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
