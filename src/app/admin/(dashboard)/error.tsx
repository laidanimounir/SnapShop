"use client";

import { ar } from "@/lib/admin/i18n-ar";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <p className="text-black/60 mb-4">{ar.messages.pageError}</p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-full bg-black text-white hover:bg-black/80 transition-all"
      >
        {ar.messages.tryAgain}
      </button>
    </div>
  );
}
