"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import {
  allowedTransitions,
  transitionRestoresStock,
  type OrderStatus,
} from "@/lib/admin/order-transitions";
import { ar, formatAr, statusLabelAr } from "@/lib/admin/i18n-ar";

export default function QuickStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = allowedTransitions(status);

  if (options.length === 0) {
    return <span className="text-xs text-black/40">{ar.orders.noActions}</span>;
  }

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as OrderStatus | "";
    event.target.value = "";
    if (!next) return;

    const label = statusLabelAr(next);
    let note: string | undefined;
    if (next === "cancelled" || next === "returned") {
      const reason = window.prompt(
        `${ar.orders.reasonPrompt} (${label})`
      );
      if (reason === null) return;
      note = reason.trim() || undefined;
    }

    const restores = transitionRestoresStock(status, next);
    if (
      !window.confirm(
        `${ar.orders.confirmChange} ${label}؟${
          restores ? `\n\n${ar.orders.stockWillRestore}` : ""
        }`
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await updateOrderStatus(orderId, next, note);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <select
        onChange={handleChange}
        disabled={busy}
        defaultValue=""
        aria-label={ar.orders.changeStatus}
        className="px-2 py-1 border border-black/15 rounded-lg text-xs bg-white disabled:opacity-50"
      >
        <option value="" disabled>
          {busy ? ar.common.saving : ar.orders.changeStatus}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabelAr(option)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
