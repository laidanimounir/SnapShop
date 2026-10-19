import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SectionRenderer from "../SectionRenderer";

const render = (sections: unknown) =>
  renderToStaticMarkup(createElement(SectionRenderer, { sections }));

describe("SectionRenderer", () => {
  it("renders valid sections in order", () => {
    const html = render([
      { id: "h1", type: "hero", props: { title: "عرض خاص" } },
      {
        id: "f1",
        type: "faq",
        props: { items: [{ question: "الشحن؟", answer: "مجاني" }] },
      },
    ]);
    expect(html).toContain("عرض خاص");
    expect(html).toContain("الشحن؟");
    expect(html.indexOf("عرض خاص")).toBeLessThan(html.indexOf("الشحن؟"));
  });

  it("skips hidden sections", () => {
    const html = render([
      { id: "h1", type: "hero", props: { title: "مرئي" }, hidden: false },
      { id: "h2", type: "hero", props: { title: "مخفي" }, hidden: true },
    ]);
    expect(html).toContain("مرئي");
    expect(html).not.toContain("مخفي");
  });

  it("skips unknown section types and invalid payloads", () => {
    const html = render([
      { id: "x1", type: "banner", props: {} },
      { id: "x2", type: "hero", props: { title: "" } },
      { id: "x3", type: "hero" },
      "garbage",
      null,
      42,
      { id: "ok", type: "rich_text", props: { text: "نص سليم" } },
    ]);
    expect(html).toContain("نص سليم");
    expect(html).not.toContain("banner");
  });

  it("renders duplicate ids only once", () => {
    const html = render([
      { id: "same", type: "rich_text", props: { text: "مرة واحدة" } },
      { id: "same", type: "rich_text", props: { text: "مرة أخرى" } },
    ]);
    expect(html).toContain("مرة واحدة");
    expect(html).not.toContain("مرة أخرى");
  });

  it("handles non-array input without throwing", () => {
    expect(render(undefined)).toBe("");
    expect(render(null)).toBe("");
    expect(render("junk")).toBe("");
    expect(render({})).toBe("");
  });

  it("renders nothing when every section is skipped", () => {
    expect(render([{ id: "x", type: "unknown" }])).toBe("");
    expect(render([])).toBe("");
  });
});
