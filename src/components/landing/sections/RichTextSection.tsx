import { richTextSectionSchema } from "@/lib/landing/sections";
import RichText from "@/components/landing/RichText";
import SectionShell from "./SectionShell";

export default function RichTextSection({ section }: { section: unknown }) {
  const parsed = richTextSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="text-sm sm:text-base">
        <RichText text={props.text} />
      </div>
    </SectionShell>
  );
}
