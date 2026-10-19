import type { Section } from "@/lib/admin/landing-sections";
import { MAX_SECTIONS, parsePageContent } from "@/lib/landing/content";
import type { Theme } from "@/lib/landing/theme";

// Data path for the live editor preview. It reuses parsePageContent, the
// same forgiving reader the public page uses, so the preview shows exactly
// what a customer would see: broken or incomplete sections are dropped
// instead of crashing the panel.

export type PreviewContent = {
  theme: Theme;
  // Only the sections that would actually render for a customer.
  sections: Section[];
  // How many sections the caller handed us, before any were dropped.
  requestedCount: number;
  // Sections dropped because they are incomplete/invalid, duplicated or
  // beyond the page limit.
  droppedCount: number;
  // Valid sections the admin flagged as hidden.
  hiddenCount: number;
};

function requestedSections(input: unknown): unknown[] {
  if (typeof input !== "object" || input === null) return [];
  const sections = (input as { sections?: unknown }).sections;
  return Array.isArray(sections) ? sections : [];
}

export function buildPreviewContent(input: unknown): PreviewContent {
  const requested = requestedSections(input);
  const parsed = parsePageContent(input);

  return {
    theme: parsed.theme,
    sections: parsed.sections,
    requestedCount: requested.length,
    droppedCount: Math.max(0, requested.length - parsed.sections.length),
    hiddenCount: parsed.sections.filter((s) => s.hidden).length,
  };
}

export { MAX_SECTIONS };
