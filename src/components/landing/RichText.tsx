import { Fragment, type ReactNode } from "react";
import {
  parseRichText,
  type InlineNode,
  type RichTextBlock,
} from "@/lib/landing/rich-text";

function InlineNodes({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.kind === "text") {
          return <Fragment key={i}>{node.value}</Fragment>;
        }
        if (node.kind === "bold") {
          return <strong key={i}>{node.text}</strong>;
        }
        if (node.kind === "italic") {
          return <em key={i}>{node.text}</em>;
        }
        return (
          <a
            key={i}
            href={node.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="underline"
          >
            {node.text}
          </a>
        );
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: RichTextBlock[] }) {
  return (
    <>
      {blocks.map((block, i) =>
        block.kind === "paragraph" ? (
          <p key={i} className="mb-3 leading-7 last:mb-0">
            <InlineNodes nodes={block.nodes} />
          </p>
        ) : (
          <ul key={i} className="mb-3 list-disc space-y-1 ps-5 last:mb-0">
            {block.items.map((item, j) => (
              <li key={j} className="leading-7">
                <InlineNodes nodes={item} />
              </li>
            ))}
          </ul>
        )
      )}
    </>
  );
}

export default function RichText({ text }: { text: string }): ReactNode {
  return <Blocks blocks={parseRichText(text ?? "")} />;
}
