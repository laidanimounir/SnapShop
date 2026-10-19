import { describe, expect, it } from "vitest";
import { buildSampleContent } from "../../../../scripts/sample-content.mjs";
import { parsePageContent } from "../content";
import { SECTION_TYPES } from "../sections";

const product = { name: "قميص قطني", price: 3500 };
const images = [
  { url: "https://example.com/one.jpg", alt: "الصورة الأولى" },
  { url: "https://example.com/two.jpg" },
];

describe("seed sample content", () => {
  it("keeps every section when validated by the real schemas (with images)", () => {
    const built = buildSampleContent({ ...product, images });
    const parsed = parsePageContent(built);

    expect(parsed.sections).toHaveLength(built.sections.length);
    built.sections.forEach((section, index) => {
      const out = parsed.sections[index];
      expect(out.id).toBe(section.id);
      expect(out.type).toBe(section.type);
      expect(out.hidden).toBe(false);
      expect(out.props).toEqual(section.props);
    });
    expect(parsed.theme).toEqual(built.theme);
  });

  it("works without product images (image sections omitted)", () => {
    const built = buildSampleContent({ ...product, images: [] });
    const parsed = parsePageContent(built);

    expect(parsed.sections).toHaveLength(built.sections.length);
    expect(built.sections.some((s) => s.type === "gallery")).toBe(false);
    expect(built.sections.some((s) => s.type === "before_after")).toBe(false);
    expect(built.sections.some((s) => s.type === "hero")).toBe(true);
  });

  it("covers every section type the renderer supports", () => {
    const built = buildSampleContent({ ...product, images });
    const types = new Set(built.sections.map((s) => s.type));
    for (const type of SECTION_TYPES) {
      expect(types.has(type)).toBe(true);
    }
  });

  it("uses unique section ids and a valid slug default", () => {
    const built = buildSampleContent({ ...product, images });
    const ids = built.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
