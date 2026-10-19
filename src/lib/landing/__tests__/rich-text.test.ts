import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseInline, parseRichText } from "../rich-text";
import RichText from "../../../components/landing/RichText";

const render = (text: string) =>
  renderToStaticMarkup(createElement(RichText, { text }));

describe("parseInline", () => {
  it("parses bold, italic and safe links", () => {
    const nodes = parseInline("سـ **عريض** و *مائل* و [موقع](https://x.co/a)");
    expect(nodes).toEqual([
      { kind: "text", value: "سـ " },
      { kind: "bold", text: "عريض" },
      { kind: "text", value: " و " },
      { kind: "italic", text: "مائل" },
      { kind: "text", value: " و " },
      { kind: "link", href: "https://x.co/a", text: "موقع" },
    ]);
  });

  it("allows http and tel links", () => {
    expect(parseInline("[a](http://x.co)")).toEqual([
      { kind: "link", href: "http://x.co", text: "a" },
    ]);
    expect(parseInline("[اتصل](tel:+213555000000)")).toEqual([
      { kind: "link", href: "tel:+213555000000", text: "اتصل" },
    ]);
  });

  it("neutralizes unsafe link schemes back to plain text", () => {
    expect(parseInline("[x](javascript:alert)")).toEqual([
      { kind: "text", value: "[x](javascript:alert)" },
    ]);
    expect(parseInline("[x](data:text/html)")).toEqual([
      { kind: "text", value: "[x](data:text/html)" },
    ]);
    expect(parseInline("[x](vbscript:msgbox)")).toEqual([
      { kind: "text", value: "[x](vbscript:msgbox)" },
    ]);
    // Nested parens never produce a link either, only text nodes.
    const nested = parseInline("[x](javascript:alert(1))");
    expect(nested.every((node) => node.kind === "text")).toBe(true);
  });

  it("keeps unclosed markers and html-looking text as literal text", () => {
    expect(parseInline("**not closed")).toEqual([
      { kind: "text", value: "**not closed" },
    ]);
    expect(parseInline("<script>alert(1)</script>")).toEqual([
      { kind: "text", value: "<script>alert(1)</script>" },
    ]);
  });
});

describe("parseRichText", () => {
  it("splits paragraphs and bullet lists", () => {
    const blocks = parseRichText("فقرة أولى\n\n- نقطة 1\n- نقطة 2\n\nفقرة ثانية");
    expect(blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "list",
      "paragraph",
    ]);
    if (blocks[1].kind === "list") {
      expect(blocks[1].items).toHaveLength(2);
    }
  });

  it("normalizes windows line endings", () => {
    expect(parseRichText("a\r\nb")).toHaveLength(2);
  });
});

describe("RichText component", () => {
  it("renders markup without ever emitting raw html", () => {
    const html = render("**عريض** وم *مائل*\n<script>alert(1)</script>");
    expect(html).toContain("<strong>عريض</strong>");
    expect(html).toContain("<em>مائل</em>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)</script>");
  });

  it("drops unsafe links but keeps safe ones", () => {
    const unsafe = render("[انقر](javascript:alert(1))");
    expect(unsafe).not.toContain("<a");
    expect(unsafe).not.toContain('href="javascript:');
    expect(unsafe).toContain("انقر");

    const safe = render("[انقر](https://example.com/x)");
    expect(safe).toContain('href="https://example.com/x"');
    expect(safe).toContain('rel="nofollow noopener noreferrer"');
  });

  it("renders lists", () => {
    const html = render("- أول\n- ثاني");
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html.match(/<li/g)).toHaveLength(2);
  });
});
