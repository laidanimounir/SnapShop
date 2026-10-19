import { describe, expect, it } from "vitest";

import { buildPreviewContent } from "../landing-preview";
import { newSection } from "../landing-sections";
import { MAX_SECTIONS, fallbackPageContent } from "../../landing/content";

const IMAGE = "https://cdn.example.com/a.jpg";

function hero(id = "hero-1") {
  return newSection("hero", { id, imageUrl: IMAGE });
}

describe("buildPreviewContent (bad data never crashes the preview)", () => {
  it("falls back to an empty page for junk input", () => {
    const expected = fallbackPageContent();
    for (const input of [null, undefined, 42, "nope", [], true]) {
      const preview = buildPreviewContent(input);
      expect(preview.sections).toEqual([]);
      expect(preview.theme).toEqual(expected.theme);
      expect(preview.requestedCount).toBe(0);
      expect(preview.droppedCount).toBe(0);
      expect(preview.hiddenCount).toBe(0);
    }
  });

  it("treats a non-array sections value as empty", () => {
    const preview = buildPreviewContent({ sections: "not an array" });
    expect(preview.sections).toEqual([]);
    expect(preview.requestedCount).toBe(0);
  });

  it("keeps valid sections and drops broken ones", () => {
    const preview = buildPreviewContent({
      sections: [hero(), { type: "hero" }, null, { id: "x" }],
    });
    expect(preview.sections.map((s) => s.id)).toEqual(["hero-1"]);
    expect(preview.requestedCount).toBe(4);
    expect(preview.droppedCount).toBe(3);
  });

  it("drops duplicate ids", () => {
    const preview = buildPreviewContent({
      sections: [hero("hero-1"), hero("hero-1")],
    });
    expect(preview.sections).toHaveLength(1);
    expect(preview.droppedCount).toBe(1);
  });

  it("keeps hidden sections but counts them separately", () => {
    const hidden = newSection("faq", { id: "faq-1", imageUrl: IMAGE });
    hidden.hidden = true;
    const preview = buildPreviewContent({ sections: [hero(), hidden] });
    expect(preview.sections).toHaveLength(2);
    expect(preview.droppedCount).toBe(0);
    expect(preview.hiddenCount).toBe(1);
  });

  it("still returns sections when the theme is invalid", () => {
    const preview = buildPreviewContent({
      theme: { primaryColor: "not-a-colour" },
      sections: [hero()],
    });
    expect(preview.theme).toEqual(fallbackPageContent().theme);
    expect(preview.sections).toHaveLength(1);
  });

  it("caps the page at the section limit and reports the rest as dropped", () => {
    const sections = Array.from({ length: MAX_SECTIONS + 3 }, (_, i) =>
      hero(`hero-${i + 1}`)
    );
    const preview = buildPreviewContent({ sections });
    expect(preview.sections).toHaveLength(MAX_SECTIONS);
    expect(preview.requestedCount).toBe(MAX_SECTIONS + 3);
    expect(preview.droppedCount).toBe(3);
  });

  it("never mutates the input it was given", () => {
    const input = {
      theme: { primaryColor: "#123456" },
      sections: [hero(), { type: "nope" }],
    };
    const before = JSON.stringify(input);
    buildPreviewContent(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
