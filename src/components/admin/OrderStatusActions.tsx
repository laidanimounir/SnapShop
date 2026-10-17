"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/admin/actions";
import {
  allowedTransitions,
  transitionRestoresStock,
  type OrderStatus,
} from "@/lib/admin/order-transitions";
import { ar, statusLabelAr } from "@/lib/admin/i18n-ar";
import { cn } from "@/lib/utils";

export default function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const options = allowedTransitions(status);

  const run = async (next: OrderStatus) => {
    const label = statusLabelAr(next);
    let note: string | undefined;
    if (next === "cancelled" || next === "returned") {
      const reason = window.prompt(`${ar.orders.reasonPrompt} (${label})`);
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

    setBusy(next);
    setError(null);
    setMessage(null);
    const result = await updateOrderStatus(orderId, next, note);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(
      restores
        ? `${ar.orders.statusUpdatedStock} ${label}.`
        : `${ar.orders.statusUpdated} ${label}.`
    );
    router.refresh();
  };

  if (options.length === 0) {
    return <p className="text-sm text-black/50">{ar.orders.terminal}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const danger = option === "cancelled" || option === "returned";
          return (
            <button
              key={option}
              type="button"
              onClick={() => run(option)}
              disabled={busy !== null}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50",
                danger
                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                  : "bg-black text-white hover:bg-black/80"
              )}
            >
              {busy === option
                ? ar.common.saving
                : `${ar.orders.markStatus} ${statusLabelAr(option)}`}
            </button>
          );
        })}
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-black/50">{ar.orders.transitionsValidated}</p>
    </div>
  );
}
