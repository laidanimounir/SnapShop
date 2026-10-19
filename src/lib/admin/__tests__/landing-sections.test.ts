import { describe, expect, it } from "vitest";

import {
  SECTION_TYPES,
  addSection,
  duplicateSection,
  isSectionValid,
  moveSection,
  moveSectionTo,
  newSection,
  nextSectionId,
  removeSection,
  sectionSummary,
  sectionTypeLabel,
  toggleSectionHidden,
  updateSectionProps,
} from "../landing-sections";

const IMAGE = "https://cdn.example.com/a.jpg";

describe("newSection", () => {
  it("builds a valid default section for every type", () => {
    for (const type of SECTION_TYPES) {
      const section = newSection(type, { imageUrl: IMAGE });
      expect(section.type).toBe(type);
      expect(section.id).toBe(`${type}-1`);
      expect(section.hidden).toBe(false);
      expect(isSectionValid(section)).toBe(true);
    }
  });

  it("generates a valid future countdown end date", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const section = newSection("countdown", { now });
    const props = section.props as { endAt: string };
    expect(Date.parse(props.endAt)).toBeGreaterThan(now.getTime());
    expect(isSectionValid(section)).toBe(true);
  });

  it("leaves image-bearing sections incomplete until an image is set", () => {
    expect(isSectionValid(newSection("gallery"))).toBe(false);
    expect(isSectionValid(newSection("gallery", { imageUrl: IMAGE }))).toBe(
      true
    );
    expect(isSectionValid(newSection("before_after"))).toBe(false);
    expect(
      isSectionValid(newSection("before_after", { imageUrl: IMAGE }))
    ).toBe(true);
  });
});

describe("nextSectionId / addSection", () => {
  it("increments ids per type", () => {
    expect(nextSectionId("hero", [])).toBe("hero-1");
    const one = addSection([], "hero");
    expect(one[0].id).toBe("hero-1");
    const two = addSection(one, "hero");
    expect(two[1].id).toBe("hero-2");
    expect(two).toHaveLength(2);
  });
});

describe("duplicateSection", () => {
  it("inserts a deep clone with a fresh id after the original", () => {
    const sections = addSection(addSection([], "hero"), "faq");
    const next = duplicateSection(sections, "hero-1");

    expect(next).toHaveLength(3);
    expect(next[0].id).toBe("hero-1");
    expect(next[1].id).toBe("hero-2");
    expect(next[2].id).toBe("faq-1");

    (next[1].props as { title: string }).title = "changed";
    expect((next[0].props as { title: string }).title).not.toBe("changed");
  });

  it("is a no-op for an unknown id", () => {
    const sections = addSection([], "hero");
    expect(duplicateSection(sections, "nope")).toBe(sections);
  });
});

describe("removeSection / moveSection / toggleSectionHidden", () => {
  const base = ["hero", "faq", "features"].reduce(
    (acc, type) => addSection(acc, type as never),
    [] as ReturnType<typeof newSection>[]
  );

  it("removes by id", () => {
    const next = removeSection(base, "faq-1");
    expect(next.map((s) => s.id)).toEqual(["hero-1", "features-1"]);
  });

  it("swaps neighbours and respects boundaries", () => {
    expect(moveSection(base, "faq-1", -1).map((s) => s.id)).toEqual([
      "faq-1",
      "hero-1",
      "features-1",
    ]);
    expect(moveSection(base, "hero-1", -1)).toBe(base);
    expect(moveSection(base, "features-1", 1)).toBe(base);
  });

  it("flips the hidden flag", () => {
    const next = toggleSectionHidden(base, "faq-1");
    expect(next[1].hidden).toBe(true);
    expect(next[0].hidden).toBe(false);
  });
});

describe("moveSectionTo (drag and drop)", () => {
  const base = ["hero", "faq", "features", "gallery"].reduce(
    (acc, type) => addSection(acc, type as never, { imageUrl: IMAGE }),
    [] as ReturnType<typeof newSection>[]
  );

  it("moves a section down to the target slot", () => {
    expect(moveSectionTo(base, "hero-1", "features-1").map((s) => s.id)).toEqual(
      ["faq-1", "features-1", "hero-1", "gallery-1"]
    );
  });

  it("moves a section up to the target slot", () => {
    expect(
      moveSectionTo(base, "gallery-1", "faq-1").map((s) => s.id)
    ).toEqual(["hero-1", "gallery-1", "faq-1", "features-1"]);
  });

  it("returns the same array for a no-op drop", () => {
    expect(moveSectionTo(base, "faq-1", "faq-1")).toBe(base);
  });

  it("returns the same array when an id is unknown", () => {
    expect(moveSectionTo(base, "nope", "faq-1")).toBe(base);
    expect(moveSectionTo(base, "faq-1", "nope")).toBe(base);
    expect(moveSectionTo([], "a", "b")).toEqual([]);
  });

  it("keeps every section exactly once", () => {
    const next = moveSectionTo(base, "hero-1", "gallery-1");
    expect(next).toHaveLength(base.length);
    expect([...next.map((s) => s.id)].sort()).toEqual(
      [...base.map((s) => s.id)].sort()
    );
  });
});

describe("updateSectionProps / sectionSummary", () => {
  it("shallow-merges a patch and replaces arrays wholesale", () => {
    const sections = addSection([], "faq");
    const next = updateSectionProps(sections, "faq-1", {
      title: "أسئلة",
      items: [{ question: "q", answer: "a" }],
    });
    const props = next[0].props as { title: string; items: unknown[] };
    expect(props.title).toBe("أسئلة");
    expect(props.items).toHaveLength(1);
    expect(isSectionValid(next[0])).toBe(true);
  });

  it("summarises using the best available text field", () => {
    const hero = newSection("hero");
    expect(sectionSummary(hero)).toBe("عنوان رئيسي");
    const faq = newSection("faq");
    expect(sectionSummary(faq)).toBe("سؤال؟");
  });

  it("labels the section type in arabic", () => {
    expect(sectionTypeLabel(newSection("hero"))).toBe("القسم الرئيسي");
    expect(sectionTypeLabel(newSection("sticky_cta"))).toBe("زر ثابت");
  });
});
