"use client";

import { useEffect, useState } from "react";
import { countdownSectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

function remainingMs(endAt: string): number {
  const end = Date.parse(endAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - Date.now());
}

function format(ms: number) {
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function CountdownSection({ section }: { section: unknown }) {
  const parsed = countdownSectionSchema.safeParse(section);
  const endAt =
    parsed.success && !parsed.data.hidden ? parsed.data.props.endAt : null;
  const [left, setLeft] = useState(() => (endAt ? remainingMs(endAt) : 0));

  useEffect(() => {
    if (!endAt) return;
    const timer = setInterval(() => {
      setLeft(remainingMs(endAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  if (!endAt || !parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;
  const time = format(left);
  const expired = left <= 0;

  return (
    <SectionShell background="var(--lp-accent)" className="text-[#111111]">
      <div className="text-center">
        <h2 className="text-xl font-bold sm:text-2xl">{props.title}</h2>
        {expired ? (
          <p className="mt-2 font-bold">انتهى العرض</p>
        ) : (
          <div
            className="mt-4 grid max-w-xs grid-cols-4 gap-2 mx-auto"
            dir="ltr"
          >
            {[
              { value: time.days, label: "يوم" },
              { value: time.hours, label: "ساعة" },
              { value: time.minutes, label: "دقيقة" },
              { value: time.seconds, label: "ثانية" },
            ].map((unit) => (
              <div
                key={unit.label}
                className="rounded-lg bg-black/10 px-1 py-2 text-center"
              >
                <div className="text-lg font-bold tabular-nums sm:text-xl">
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="text-[11px]">{unit.label}</div>
              </div>
            ))}
          </div>
        )}
        {props.note ? (
          <p className="mt-3 text-sm opacity-80">{props.note}</p>
        ) : null}
      </div>
    </SectionShell>
  );
}
