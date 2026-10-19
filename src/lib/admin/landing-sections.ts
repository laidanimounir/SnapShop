// Pure section list helpers for the landing-page editor: creating a
// section of any of the 11 types with sensible defaults, plus
// duplicate / remove / move / hide / update. No React, no Supabase —
// the editor keeps a plain `Section[]` in state and calls these.

import {
  SECTION_TYPES,
  sectionSchema,
  type Section,
  type SectionType,
} from "@/lib/landing/sections";
import { ar } from "./i18n-ar";

const DAY_MS = 24 * 60 * 60 * 1000;
export const COUNTDOWN_DEFAULT_DAYS = 3;

export type NewSectionOptions = {
  id?: string;
  now?: Date;
  // Used to prefill the first image slot of image-bearing sections
  // (galleries, before/after) with the product's own photo, if any.
  imageUrl?: string;
};

function make(
  id: string,
  type: SectionType,
  props: Record<string, unknown>
): Section {
  return { id, type, hidden: false, props } as unknown as Section;
}

export function defaultSectionProps(
  type: SectionType,
  opts: NewSectionOptions = {}
): Record<string, unknown> {
  const { imageUrl } = opts;
  switch (type) {
    case "hero":
      return {
        title: "عنوان رئيسي",
        subtitle: "",
        ctaText: "اطلب الآن",
        ...(imageUrl ? { imageUrl } : {}),
      };
    case "gallery":
      return {
        images: imageUrl ? [{ imageUrl, alt: "" }] : [],
        colorName: "",
      };
    case "features":
      return { title: "", items: [{ title: "ميزة", text: "" }] };
    case "size_guide":
      return {
        title: "",
        columns: ["المقاس", "القياس"],
        rows: [["", ""]],
      };
    case "before_after":
      return {
        title: "",
        pairs: imageUrl
          ? [{ beforeUrl: imageUrl, afterUrl: imageUrl, caption: "" }]
          : [],
      };
    case "testimonials":
      return {
        title: "",
        items: [{ name: "زبون", text: "رأي الزبون", rating: 5 }],
      };
    case "faq":
      return {
        title: "",
        items: [{ question: "سؤال؟", answer: "جواب." }],
      };
    case "countdown":
      return {
        title: "ينتهي العرض خلال",
        endAt: new Date(
          (opts.now ?? new Date()).getTime() + COUNTDOWN_DEFAULT_DAYS * DAY_MS
        ).toISOString(),
        note: "",
      };
    case "rich_text":
      return { title: "", text: "نص توضيحي" };
    case "order_form":
      return {
        title: "",
        showStock: true,
        showShipping: true,
        ctaText: "اطلب الآن",
      };
    case "sticky_cta":
      return { text: "اطلب الآن" };
    default: {
      // Exhaustiveness guard: unknown types fall back to rich_text so a
      // bad caller can never inject an invalid section type.
      const never: never = type;
      void never;
      return { title: "", text: "" };
    }
  }
}

// A section is only persisted (and shown to customers) when it passes
// the strict schema; the editor flags the rest as "incomplete".
export function isSectionValid(section: Section): boolean {
  return sectionSchema.safeParse(section).success;
}

export function nextSectionId(type: SectionType, sections: Section[]): string {
  const used = new Set(sections.map((s) => s.id));
  let n = 1;
  while (used.has(`${type}-${n}`)) n += 1;
  return `${type}-${n}`;
}

export function newSection(
  type: SectionType,
  opts: NewSectionOptions = {}
): Section {
  return make(
    opts.id ?? `${type}-1`,
    type,
    defaultSectionProps(type, opts)
  );
}

export function addSection(
  sections: Section[],
  type: SectionType,
  opts: NewSectionOptions = {}
): Section[] {
  const id = opts.id ?? nextSectionId(type, sections);
  return [...sections, newSection(type, { ...opts, id })];
}

export function duplicateSection(sections: Section[], id: string): Section[] {
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return sections;

  const source = sections[index];
  const clone = JSON.parse(JSON.stringify(source)) as Section;
  clone.id = nextSectionId(source.type, sections);

  const next = sections.slice();
  next.splice(index + 1, 0, clone);
  return next;
}

export function removeSection(sections: Section[], id: string): Section[] {
  return sections.filter((s) => s.id !== id);
}

// dir: -1 moves up (towards the top of the page), +1 moves down.
export function moveSection(
  sections: Section[],
  id: string,
  dir: -1 | 1
): Section[] {
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return sections;
  const target = index + dir;
  if (target < 0 || target >= sections.length) return sections;

  const next = sections.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function toggleSectionHidden(
  sections: Section[],
  id: string
): Section[] {
  return sections.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s));
}

// Shallow-merges a patch into a section's props (nested arrays are
// replaced wholesale, which is how the side panel edits them).
export function updateSectionProps(
  sections: Section[],
  id: string,
  patch: Record<string, unknown>
): Section[] {
  return sections.map((s) =>
    s.id === id
      ? ({
          ...s,
          props: { ...(s.props as Record<string, unknown>), ...patch },
        } as unknown as Section)
      : s
  );
}

// Short human label for the editor list (best available text field).
export function sectionSummary(section: Section): string {
  const props = section.props as Record<string, unknown>;
  for (const key of ["title", "text", "colorName"]) {
    const value = props[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  const items = props.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0] as Record<string, unknown>;
    for (const key of ["title", "question", "name"]) {
      const value = first[key];
      if (typeof value === "string" && value.trim() !== "") return value;
    }
  }
  return "";
}

// Arabic display label for a section's type (used by the editor).
export function sectionTypeLabel(section: Section): string {
  return ar.landing.sectionTypes[section.type];
}

export { SECTION_TYPES };
export type { Section, SectionType };
