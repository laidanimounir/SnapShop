import type { ReactNode } from "react";

export default function SectionShell({
  children,
  background,
  className = "",
  id,
  wide = false,
}: {
  children: ReactNode;
  background?: string;
  className?: string;
  id?: string;
  wide?: boolean;
}) {
  return (
    <section
      id={id}
      className={`px-4 py-[var(--lp-section-spacing)] sm:px-6 ${className}`}
      style={background ? { background } : undefined}
    >
      <div
        className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"}`}
      >
        {children}
      </div>
    </section>
  );
}
