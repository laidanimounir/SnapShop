import { orderFormSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function OrderFormSection({ section }: { section: unknown }) {
  const parsed = orderFormSectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell id="order-form">
      <div className="rounded-xl border-2 border-dashed border-black/20 p-6 text-center">
        {props.title ? (
          <h2 className="text-xl font-bold sm:text-2xl">{props.title}</h2>
        ) : (
          <h2 className="text-xl font-bold sm:text-2xl">اطلب الآن</h2>
        )}
        <p className="mt-2 text-sm opacity-70">نموذج الطلب قريباً</p>
        <div
          className="mt-4 inline-block rounded-[var(--lp-btn-radius)] bg-[var(--lp-btn-bg)] px-6 py-3 font-bold text-[var(--lp-btn-text)] opacity-50"
          aria-hidden="true"
        >
          {props.ctaText}
        </div>
      </div>
    </SectionShell>
  );
}
