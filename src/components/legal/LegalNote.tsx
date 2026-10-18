import React from "react";
import { ar } from "@/lib/store/i18n-ar";

export default function LegalNote() {
  return (
    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
      {ar.legal.note}
    </div>
  );
}
