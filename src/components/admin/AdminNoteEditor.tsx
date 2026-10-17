"use client";

import { useState } from "react";
import { updateAdminNote } from "@/app/admin/actions";
import { ar } from "@/lib/admin/i18n-ar";

export default function AdminNoteEditor({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string | null;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = await updateAdminNote(orderId, note);
    setSaving(false);
    setMessage(result.ok ? ar.orders.noteSaved : result.error);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={ar.orders.notePlaceholder}
        className="w-full px-3 py-2 border border-black/15 rounded-lg text-sm resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 disabled:opacity-50"
        >
          {saving ? ar.common.saving : ar.orders.saveNote}
        </button>
        {message && <span className="text-sm text-black/60">{message}</span>}
      </div>
    </div>
  );
}
