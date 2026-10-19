import { stickyCtaSectionSchema } from "@/lib/landing/sections";

export default function StickyCtaSection({ section }: { section: unknown }) {
  const parsed = stickyCtaSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] md:hidden">
      <a
        href="#order-form"
        className="mx-auto block max-w-md rounded-[var(--lp-btn-radius)] bg-[var(--lp-btn-bg)] px-6 py-3 text-center font-bold text-[var(--lp-btn-text)]"
      >
        {props.text}
      </a>
    </div>
  );
}
