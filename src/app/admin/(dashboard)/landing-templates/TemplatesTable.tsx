"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  deleteTemplateAction,
  renameTemplateAction,
} from "@/app/admin/landing-actions";
import { ar } from "@/lib/admin/i18n-ar";
import { isTemplateNameTaken } from "@/lib/admin/landing-validation";
import type { AdminTemplateDetail } from "@/lib/api/landing-admin";

export function TemplatesTable({
  templates,
}: {
  templates: AdminTemplateDetail[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(templates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(
    null
  );

  const showToast = (msg: string, error = false) => setToast({ msg, error });

  const takenNames = (exceptId: string) =>
    rows.filter((r) => r.id !== exceptId).map((r) => r.name);

  const startRename = (row: AdminTemplateDetail) => {
    setEditingId(row.id);
    setNameDraft(row.name);
  };

  const saveRename = async (row: AdminTemplateDetail) => {
    if (busy) return;
    if (isTemplateNameTaken(nameDraft, takenNames(row.id))) {
      showToast(ar.messages.templateNameTaken, true);
      return;
    }
    setBusy(true);
    const result = await renameTemplateAction({ id: row.id, name: nameDraft });
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, name: result.name, updated_at: result.updatedAt }
          : r
      )
    );
    setEditingId(null);
    showToast(ar.messages.templateRenamed);
    router.refresh();
  };

  const remove = async (row: AdminTemplateDetail) => {
    if (busy) return;
    if (!window.confirm(ar.landing.templatesPage.deleteConfirm)) return;
    setBusy(true);
    const result = await deleteTemplateAction(row.id);
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    showToast(ar.messages.templateDeleted);
    router.refresh();
  };

  if (rows.length === 0) {
    return (
      <p className="text-sm text-admin-muted-foreground bg-admin-card border border-admin-border rounded-lg px-4 py-6 text-center">
        {ar.landing.templatesPage.empty}
      </p>
    );
  }

  return (
    <>
      <div className="bg-admin-card border border-admin-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr className="border-b border-admin-border text-admin-muted-foreground">
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.templatesPage.name}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.templatesPage.description}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.templatesPage.sections}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.landing.templatesPage.updatedAt}
              </th>
              <th className="px-4 py-3 font-medium text-start">
                {ar.common.actions}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-admin-border/60">
                <td className="px-4 py-3">
                  {editingId === row.id ? (
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      maxLength={80}
                      className="w-full rounded-lg border border-admin-border px-2 py-1 text-sm"
                    />
                  ) : (
                    <div className="font-medium">{row.name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-admin-foreground/80">
                  {row.description ?? ar.landing.templatesPage.noDescription}
                </td>
                <td className="px-4 py-3 text-admin-foreground/80">{row.sectionCount}</td>
                <td className="px-4 py-3 text-admin-foreground/80">
                  {new Date(row.updated_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === row.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveRename(row)}
                          disabled={busy}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90 disabled:opacity-50"
                        >
                          {ar.landing.templatesPage.renameSave}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-full text-xs font-medium border border-admin-border hover:bg-admin-muted"
                        >
                          {ar.common.cancel}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRename(row)}
                        className="px-3 py-1 rounded-full text-xs font-medium border border-admin-border hover:bg-admin-muted"
                      >
                        {ar.landing.templatesPage.rename}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={busy}
                      className="px-3 py-1 rounded-full text-xs font-medium border border-admin-border text-admin-destructive hover:bg-admin-destructive/10 disabled:opacity-50"
                    >
                      {ar.common.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 start-5 z-50 px-4 py-2 rounded-lg text-sm shadow-lg ${
            toast.error
              ? "bg-admin-destructive text-admin-destructive-foreground"
              : "bg-admin-primary text-admin-primary-foreground"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
