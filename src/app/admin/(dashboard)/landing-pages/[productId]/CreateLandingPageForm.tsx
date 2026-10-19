"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createLandingPageAction } from "@/app/admin/landing-actions";
import { ar } from "@/lib/admin/i18n-ar";

const inputCls = "w-full px-3 py-2 border border-black/15 rounded-lg text-sm";

export function CreateLandingPageForm({
  productId,
  productName,
  initialSlug,
}: {
  productId: string;
  productName: string;
  initialSlug: string;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialSlug);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createLandingPageAction({ productId, slug });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <Link
        href="/admin/landing-pages"
        className="text-sm text-black/60 hover:underline"
      >
        ← {ar.landing.backToList}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{ar.landing.create}</h1>
      <p className="text-sm text-black/60 mb-4">{productName}</p>

      <form
        onSubmit={submit}
        className="bg-white border border-black/10 rounded-lg p-5 space-y-4 max-w-xl"
      >
        <p className="text-sm text-black/60">{ar.landing.createHelp}</p>
        <div>
          <label className="block text-sm font-medium mb-1">
            {ar.landing.slug}
          </label>
          <input
            className={`${inputCls} font-mono`}
            dir="ltr"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            maxLength={80}
            required
          />
          <p className="text-xs text-black/50 mt-1">{ar.landing.slugHelp}</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
        >
          {busy ? ar.landing.creating : ar.landing.createButton}
        </button>
      </form>
    </div>
  );
}
