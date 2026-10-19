import Image from "next/image";
import { testimonialsSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function TestimonialsSection({ section }: { section: unknown }) {
  const parsed = testimonialsSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {props.items.map((item, i) => (
          <blockquote
            key={`${item.name}-${i}`}
            className="rounded-xl border border-black/10 p-4"
          >
            <div className="flex items-center gap-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={40}
                  height={40}
                  loading="lazy"
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : null}
              <div>
                <div className="font-bold">{item.name}</div>
                {item.rating ? (
                  <div className="text-sm text-[var(--lp-accent)]" aria-label={`${item.rating} من 5`}>
                    {"★".repeat(item.rating)}
                    {"☆".repeat(5 - item.rating)}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 opacity-80">{item.text}</p>
          </blockquote>
        ))}
      </div>
    </SectionShell>
  );
}
