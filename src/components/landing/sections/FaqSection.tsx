import { faqSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function FaqSection({ section }: { section: unknown }) {
  const parsed = faqSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-4 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="space-y-3">
        {props.items.map((item, i) => (
          <details
            key={`faq-${i}`}
            className="rounded-xl border border-black/10 px-4 py-3"
          >
            <summary className="cursor-pointer font-bold">
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-6 opacity-80">{item.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
