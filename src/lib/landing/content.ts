import { z } from "zod";
import { themeSchema, type Theme } from "./theme";
import { sectionSchema, type Section } from "./sections";

// Full landing page content: theme + ordered sections.
// pageContentSchema is the strict validator used on writes (admin
// actions, seed script). parsePageContent is the forgiving reader
// used when rendering: it never throws, drops whatever is broken and
// falls back to safe defaults.

export const MAX_SECTIONS = 30;
export const MAX_CONTENT_BYTES = 100_000;

// Zod 4 defaults must be full output values, so derive one from the
// theme schema itself (every field has a safe default).
function defaultTheme(): Theme {
  return themeSchema.parse({});
}

export const pageContentSchema = z
  .object({
    theme: themeSchema.default(defaultTheme),
    sections: z.array(sectionSchema).max(MAX_SECTIONS).default([]),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate section id "${section.id}"`,
          path: ["sections", index, "id"],
        });
      }
      seen.add(section.id);
    });

    const bytes = JSON.stringify(value).length;
    if (bytes > MAX_CONTENT_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: `content is too large (${bytes} bytes, max ${MAX_CONTENT_BYTES})`,
        path: [],
      });
    }
  });

export type PageContent = z.infer<typeof pageContentSchema>;

export function fallbackPageContent(): PageContent {
  return { theme: themeSchema.parse({}), sections: [] };
}

// Forgiving reader for rendering. Never throws.
export function parsePageContent(raw: unknown): PageContent {
  const strict = pageContentSchema.safeParse(raw);
  if (strict.success) return strict.data;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fallbackPageContent();
  }

  const record = raw as Record<string, unknown>;

  const theme = themeSchema.safeParse(record.theme);
  const rawSections = Array.isArray(record.sections) ? record.sections : [];
  const sections: Section[] = [];
  const seen = new Set<string>();
  for (const candidate of rawSections.slice(0, MAX_SECTIONS)) {
    const parsed = sectionSchema.safeParse(candidate);
    if (!parsed.success) continue;
    if (seen.has(parsed.data.id)) continue;
    seen.add(parsed.data.id);
    sections.push(parsed.data);
  }

  return {
    theme: theme.success ? theme.data : themeSchema.parse({}),
    sections,
  };
}

// Same rule as the slug CHECK in migration 0011.
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    slug.length >= 3 &&
    slug.length <= 80 &&
    SLUG_PATTERN.test(slug)
  );
}

// Digits only, same rule as the pixel CHECKs in migration 0011.
export function parsePixelId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  return /^[0-9]{5,20}$/.test(raw) ? raw : null;
}

export type { Theme };
