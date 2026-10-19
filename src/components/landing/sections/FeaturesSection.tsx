import Image from "next/image";
import { featuresSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function FeaturesSection({ section }: { section: unknown }) {
  const parsed = featuresSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.title ? (
        <h2 className="mb-5 text-xl font-bold sm:text-2xl">{props.title}</h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item, i) => (
          <div
            key={`${item.title}-${i}`}
            className="rounded-xl border border-black/10 p-4"
          >
            {item.iconUrl ? (
              <Image
                src={item.iconUrl}
                alt={item.title}
                width={48}
                height={48}
                loading="lazy"
                className="mb-3 h-12 w-12 object-contain"
              />
            ) : null}
            <h3 className="font-bold">{item.title}</h3>
            {item.text ? (
              <p className="mt-1 text-sm leading-6 opacity-75">{item.text}</p>
            ) : null}
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
