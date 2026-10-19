// Constrained rich text for landing pages. Input is treated as plain
// text: a tiny markup for **bold**, *italic*, [label](url) and "- "
// bullet lists. Nothing is ever parsed as HTML — raw tags like
// <script> stay literal text and are escaped by React when rendered.
// Link targets are limited to http, https and tel; anything else
// (javascript:, data:, ...) is neutralized back to plain text.

export type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "link"; href: string; text: string };

export type RichTextBlock =
  | { kind: "paragraph"; nodes: InlineNode[] }
  | { kind: "list"; items: InlineNode[][] };

const SAFE_HREF = /^(?:https?:\/\/|tel:)/i;

const INLINE_TOKEN =
  /(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE_TOKEN.lastIndex = 0;
  while ((match = INLINE_TOKEN.exec(input)) !== null) {
    if (match.index > last) {
      nodes.push({ kind: "text", value: input.slice(last, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push({ kind: "bold", text: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      nodes.push({ kind: "italic", text: token.slice(1, -1) });
    } else {
      const label = match[3];
      const href = match[4];
      if (SAFE_HREF.test(href)) {
        nodes.push({ kind: "link", href, text: label });
      } else {
        // Unsafe scheme: keep the raw markdown as plain text.
        nodes.push({ kind: "text", value: token });
      }
    }
    last = match.index + token.length;
  }
  if (last < input.length) {
    nodes.push({ kind: "text", value: input.slice(last) });
  }
  return nodes;
}

export function parseRichText(input: string): RichTextBlock[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: RichTextBlock[] = [];
  let list: InlineNode[][] | null = null;

  const flushList = () => {
    if (list && list.length > 0) blocks.push({ kind: "list", items: list });
    list = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      flushList();
      continue;
    }
    if (trimmed.startsWith("- ")) {
      if (!list) list = [];
      list.push(parseInline(trimmed.slice(2)));
      continue;
    }
    flushList();
    blocks.push({ kind: "paragraph", nodes: parseInline(trimmed) });
  }
  flushList();

  return blocks;
}
