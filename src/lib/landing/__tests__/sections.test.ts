import { describe, expect, it } from "vitest";
import { sectionSchema, SECTION_TYPES } from "../sections";

const good: Record<string, Record<string, unknown>> = {
  hero: {
    id: "s1",
    type: "hero",
    props: { title: "عرض خاص", subtitle: "خصم 30%", imageUrl: "https://x.co/a.jpg" },
  },
  gallery: {
    id: "s1",
    type: "gallery",
    props: { images: [{ imageUrl: "https://x.co/1.jpg", alt: "صورة" }] },
  },
  features: {
    id: "s1",
    type: "features",
    props: { items: [{ title: "جودة عالية", text: "خامة ممتازة" }] },
  },
  size_guide: {
    id: "s1",
    type: "size_guide",
    props: { columns: ["المقاس", "الطول"], rows: [["M", "70"]] },
  },
  before_after: {
    id: "s1",
    type: "before_after",
    props: {
      pairs: [{ beforeUrl: "https://x.co/b.jpg", afterUrl: "https://x.co/a.jpg" }],
    },
  },
  testimonials: {
    id: "s1",
    type: "testimonials",
    props: { items: [{ name: "أحمد", text: "منتج رائع", rating: 5 }] },
  },
  faq: {
    id: "s1",
    type: "faq",
    props: { items: [{ question: "الشحن؟", answer: "مجاني لكل الولايات" }] },
  },
  countdown: {
    id: "s1",
    type: "countdown",
    props: { title: "ينتهي العرض", endAt: "2030-01-01T00:00:00Z" },
  },
  rich_text: {
    id: "s1",
    type: "rich_text",
    props: { text: "نص **عريض** ورابط [موقع](https://x.co)" },
  },
  order_form: {
    id: "s1",
    type: "order_form",
    props: {},
  },
  sticky_cta: {
    id: "s1",
    type: "sticky_cta",
    props: {},
  },
};

describe("sectionSchema", () => {
  it("accepts a valid example of every section type", () => {
    for (const type of SECTION_TYPES) {
      const parsed = sectionSchema.safeParse(good[type]);
      expect(parsed.success, `type ${type} should parse`).toBe(true);
    }
  });

  it("applies section defaults", () => {
    const parsed = sectionSchema.parse(good.hero);
    expect(parsed.hidden).toBe(false);
    if (parsed.type === "hero") {
      expect(parsed.props.ctaText).toBe("اطلب الآن");
    }
  });

  it("rejects unknown section types", () => {
    expect(
      sectionSchema.safeParse({ id: "s1", type: "banner", props: {} }).success
    ).toBe(false);
    expect(
      sectionSchema.safeParse({ id: "s1", type: "HERO", props: {} }).success
    ).toBe(false);
    expect(sectionSchema.safeParse({ id: "s1" }).success).toBe(false);
  });

  it("rejects non-https image urls", () => {
    expect(
      sectionSchema.safeParse({
        ...good.gallery,
        props: { images: [{ imageUrl: "http://x.co/1.jpg" }] },
      }).success
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...good.hero,
        props: { title: "عرض", imageUrl: "javascript:alert(1)" },
      }).success
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...good.hero,
        props: { title: "عرض", imageUrl: "/local/path.jpg" },
      }).success
    ).toBe(false);
  });

  it("rejects oversized payloads", () => {
    expect(
      sectionSchema.safeParse({
        ...good.faq,
        props: {
          items: Array.from({ length: 16 }, (_, i) => ({
            question: `س${i}`,
            answer: "جواب",
          })),
        },
      }).success
    ).toBe(false);

    expect(
      sectionSchema.safeParse({
        ...good.hero,
        props: { title: "x".repeat(121) },
      }).success
    ).toBe(false);

    expect(
      sectionSchema.safeParse({
        ...good.rich_text,
        props: { text: "x".repeat(4001) },
      }).success
    ).toBe(false);

    expect(
      sectionSchema.safeParse({
        ...good.gallery,
        props: {
          images: Array.from({ length: 13 }, () => ({
            imageUrl: "https://x.co/1.jpg",
          })),
        },
      }).success
    ).toBe(false);
  });

  it("rejects bad required fields", () => {
    expect(
      sectionSchema.safeParse({ ...good.hero, props: { title: "" } }).success
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...good.countdown,
        props: { title: "ينتهي", endAt: "not-a-date" },
      }).success
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...good.testimonials,
        props: {
          items: [{ name: "أحمد", text: "رائع", rating: 6 }],
        },
      }).success
    ).toBe(false);
  });
});
