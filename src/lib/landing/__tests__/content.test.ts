import { describe, expect, it } from "vitest";
import {
  MAX_SECTIONS,
  fallbackPageContent,
  isValidSlug,
  pageContentSchema,
  parsePageContent,
  parsePixelId,
} from "../content";

const heroSection = {
  id: "hero-1",
  type: "hero",
  props: { title: "عرض خاص" },
};

describe("pageContentSchema", () => {
  it("accepts a valid theme plus ordered sections", () => {
    const parsed = pageContentSchema.parse({
      theme: { primaryColor: "#123456", headingFont: "tajawal" },
      sections: [heroSection, { id: "faq-1", type: "faq", props: { items: [{ question: "س", answer: "ج" }] } }],
    });
    expect(parsed.theme.primaryColor).toBe("#123456");
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0].id).toBe("hero-1");
  });

  it("accepts an empty object with defaults", () => {
    const parsed = pageContentSchema.parse({});
    expect(parsed.sections).toEqual([]);
    expect(parsed.theme.headingFont).toBe("cairo");
  });

  it("rejects duplicate section ids", () => {
    const result = pageContentSchema.safeParse({
      sections: [heroSection, { ...heroSection }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many sections", () => {
    const sections = Array.from({ length: MAX_SECTIONS + 1 }, (_, i) => ({
      ...heroSection,
      id: `hero-${i}`,
    }));
    expect(pageContentSchema.safeParse({ sections }).success).toBe(false);
  });

  it("rejects oversized content", () => {
    const bigFaq = (id: string) => ({
      id,
      type: "faq",
      props: {
        items: Array.from({ length: 15 }, (_, i) => ({
          question: `q${i}`.padEnd(200, "?"),
          answer: "a".repeat(1000),
        })),
      },
    });
    const result = pageContentSchema.safeParse({
      sections: Array.from({ length: 6 }, (_, i) => bigFaq(`f${i}`)),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid theme or section inside strict validation", () => {
    expect(pageContentSchema.safeParse({ theme: { primaryColor: "red" } }).success).toBe(false);
    expect(pageContentSchema.safeParse({ sections: [{ id: "s", type: "banner" }] }).success).toBe(false);
  });
});

describe("parsePageContent", () => {
  it("parses valid content as-is", () => {
    const content = parsePageContent({ theme: {}, sections: [heroSection] });
    expect(content.sections).toHaveLength(1);
  });

  it("returns the fallback for non-object input without throwing", () => {
    expect(parsePageContent(null)).toEqual(fallbackPageContent());
    expect(parsePageContent(undefined)).toEqual(fallbackPageContent());
    expect(parsePageContent("junk")).toEqual(fallbackPageContent());
    expect(parsePageContent(42)).toEqual(fallbackPageContent());
    expect(parsePageContent([1, 2, 3])).toEqual(fallbackPageContent());
  });

  it("falls back to default theme when the theme is broken", () => {
    const content = parsePageContent({
      theme: { primaryColor: "not-a-color" },
      sections: [],
    });
    expect(content.theme.primaryColor).toBe("#1A1A1A");
  });

  it("keeps valid sections and drops broken or duplicate ones", () => {
    const content = parsePageContent({
      theme: {},
      sections: [
        heroSection,
        { id: "broken", type: "banner" },
        heroSection,
        { id: "faq-bad", type: "faq", props: { items: "nope" } },
      ],
    });
    expect(content.sections.map((s) => s.id)).toEqual(["hero-1"]);
  });

  it("never throws even when sections is not an array", () => {
    const content = parsePageContent({ theme: {}, sections: "oops" });
    expect(content.sections).toEqual([]);
  });
});

describe("isValidSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidSlug("blue-shirt-offer")).toBe(true);
    expect(isValidSlug("abc123")).toBe(true);
    expect(isValidSlug("a-b-c")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("Blue-Shirt")).toBe(false);
    expect(isValidSlug("-blue")).toBe(false);
    expect(isValidSlug("blue-shirt-")).toBe(false);
    expect(isValidSlug("blue shirt")).toBe(false);
    expect(isValidSlug("x".repeat(81))).toBe(false);
    expect(isValidSlug(123)).toBe(false);
    expect(isValidSlug(null)).toBe(false);
  });
});

describe("parsePixelId", () => {
  it("accepts digits-only ids in range", () => {
    expect(parsePixelId("12345")).toBe("12345");
    expect(parsePixelId("9876543210123456")).toBe("9876543210123456");
  });

  it("rejects anything else", () => {
    expect(parsePixelId("1234")).toBe(null);
    expect(parsePixelId("1234a")).toBe(null);
    expect(parsePixelId("123456789012345678901")).toBe(null);
    expect(parsePixelId("")).toBe(null);
    expect(parsePixelId(null)).toBe(null);
    expect(parsePixelId(12345)).toBe(null);
  });
});
