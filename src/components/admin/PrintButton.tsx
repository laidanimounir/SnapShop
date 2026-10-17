"use client";

import { ar } from "@/lib/admin/i18n-ar";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg border border-black/15 text-sm font-medium hover:bg-gray-100 print:hidden"
    >
      {ar.orders.printSlip}
    </button>
  );
}
