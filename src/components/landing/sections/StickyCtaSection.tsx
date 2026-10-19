"use client";

import { useEffect, useState } from "react";
import { stickyCtaSectionSchema } from "@/lib/landing/sections";

// Fixed mobile bar that jumps to the order form. It stays hidden while the
// form itself is on screen (the shopper can already see the submit button)
// and reappears when the form scrolls away. Rendered only after the observer
// reports state so the first paint never flashes the bar over the form.
export default function StickyCtaSection({ section }: { section: unknown }) {
  const parsed = stickyCtaSectionSchema.safeParse(section);
  const active = parsed.success && !parsed.data.hidden;
  const text = parsed.success ? parsed.data.props.text : null;

  const [ready, setReady] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [formOnScreen, setFormOnScreen] = useState(false);

  useEffect(() => {
    const target = document.getElementById("order-form");
    if (!target || typeof IntersectionObserver === "undefined") {
      // No form to point at (or no observer support): never show a dead CTA.
      setHasTarget(false);
      setReady(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFormOnScreen(entry.isIntersecting);
        setReady(true);
      },
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!active || !text || !ready || !hasTarget || formOnScreen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.08)] md:hidden">
      <a
        href="#order-form"
        className="mx-auto block max-w-md rounded-[var(--lp-btn-radius)] bg-[var(--lp-btn-bg)] px-6 py-3 text-center font-bold text-[var(--lp-btn-text)]"
      >
        {text}
      </a>
    </div>
  );
}
