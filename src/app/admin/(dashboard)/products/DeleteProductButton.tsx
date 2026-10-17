"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    const result = await deleteProductAction(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.deactivated) {
      alert(`"${name}" — ${ar.products.editor.productHasOrders}`);
    }
    router.refresh();
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
      >
        {ar.common.delete}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white disabled:opacity-50"
      >
        {busy ? "…" : ar.common.confirm}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        className="px-3 py-1 rounded-full text-xs font-medium border border-black/15"
      >
        {ar.common.cancel}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
