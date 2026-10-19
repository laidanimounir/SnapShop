import Image from "next/image";
import { beforeAfterSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function BeforeAfterSection({ section }: { section: unknown }) {
  const parsed = beforeAfterSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        {props.pairs.map((pair, i) => (
          <figure key={`pair-${i}`} className="rounded-xl border border-black/10 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="mb-1 block text-xs font-bold opacity-70">
                  قبل
                </span>
                <Image
                  src={pair.beforeUrl}
                  alt={pair.caption ? `قبل - ${pair.caption}` : "قبل"}
                  width={300}
                  height={375}
                  loading="lazy"
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="aspect-[4/5] w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <span className="mb-1 block text-xs font-bold opacity-70">
                  بعد
                </span>
                <Image
                  src={pair.afterUrl}
                  alt={pair.caption ? `بعد - ${pair.caption}` : "بعد"}
                  width={300}
                  height={375}
                  loading="lazy"
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="aspect-[4/5] w-full rounded-lg object-cover"
                />
              </div>
            </div>
            {pair.caption ? (
              <figcaption className="mt-2 text-sm opacity-75">
                {pair.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}
