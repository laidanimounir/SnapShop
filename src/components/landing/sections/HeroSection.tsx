import Image from "next/image";
import { heroSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function HeroSection({ section }: { section: unknown }) {
  const parsed = heroSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell background="var(--lp-primary)" className="text-white" wide>
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div>
          <h1 className="text-2xl font-bold leading-9 sm:text-4xl">
            {props.title}
          </h1>
          {props.subtitle ? (
            <p className="mt-3 text-base leading-7 text-white/80">
              {props.subtitle}
            </p>
          ) : null}
          <a
            href="#order-form"
            className="mt-5 inline-block rounded-[var(--lp-btn-radius)] bg-[var(--lp-accent)] px-6 py-3 text-base font-bold text-[#111111] transition-opacity hover:opacity-90"
          >
            {props.ctaText}
          </a>
        </div>
        {props.imageUrl ? (
          <Image
            src={props.imageUrl}
            alt={props.title}
            width={640}
            height={480}
            loading="lazy"
            sizes="(min-width: 640px) 50vw, 100vw"
            className="h-auto w-full rounded-xl object-cover"
          />
        ) : null}
      </div>
    </SectionShell>
  );
}
