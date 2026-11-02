"use client";

import { ar } from "@/lib/admin/i18n-ar";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg border border-admin-border text-sm font-medium hover:bg-admin-muted print:hidden"
    >
      {ar.orders.printSlip}
    </button>
  );
}
