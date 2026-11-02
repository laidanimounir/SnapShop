"use client";

import { ar } from "@/lib/admin/i18n-ar";
import type { Section } from "@/lib/admin/landing-sections";
import { isSectionValid } from "@/lib/admin/landing-sections";
import type { Theme } from "@/lib/landing/theme";
import { SectionFields } from "./SectionFields";
import { SeoFields, ThemeFields, type SettingsFields } from "./SettingsPanel";

export type InspectorTab = "section" | "theme" | "seo";

const TABS: { key: InspectorTab; label: string }[] = [
  { key: "section", label: ar.landing.tabSection },
  { key: "theme", label: ar.landing.tabTheme },
  { key: "seo", label: ar.landing.tabSeo },
];

export function InspectorPanel({
  pageId,
  tab,
  onTab,
  section,
  onSectionChange,
  theme,
  onTheme,
  fields,
  onField,
}: {
  pageId: string;
  tab: InspectorTab;
  onTab: (tab: InspectorTab) => void;
  section: Section | null;
  onSectionChange: (props: Section["props"]) => void;
  theme: Theme;
  onTheme: (patch: Partial<Theme>) => void;
  fields: SettingsFields;
  onField: (key: keyof SettingsFields, value: string) => void;
}) {
  return (
    <section className="bg-admin-card border border-admin-border rounded-lg p-5">
      <div
        role="tablist"
        className="flex flex-wrap gap-2 border-b border-admin-border pb-3 mb-4"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                active
                  ? "bg-admin-primary text-admin-primary-foreground"
                  : "border border-admin-border hover:bg-admin-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "section" ? (
        section ? (
          <div className="space-y-3">
            {!isSectionValid(section) && (
              <p className="text-sm text-admin-destructive">
                {ar.landing.invalidSection}
              </p>
            )}
            <SectionFields
              pageId={pageId}
              section={section}
              onChange={onSectionChange}
            />
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm font-medium mb-1">
              {ar.landing.noSectionSelected}
            </p>
            <p className="text-xs text-admin-muted-foreground">
              {ar.landing.noSectionSelectedHelp}
            </p>
          </div>
        )
      ) : tab === "theme" ? (
        <ThemeFields theme={theme} onTheme={onTheme} />
      ) : (
        <SeoFields pageId={pageId} fields={fields} onField={onField} />
      )}
    </section>
  );
}
