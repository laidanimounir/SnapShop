"use client";

import { useMemo, useState } from "react";

import {
  applyTemplateAction,
  copyDraftFromProductAction,
  getDraftContentForProductAction,
  getTemplateContentAction,
  saveDraftAsTemplateAction,
} from "@/app/admin/landing-actions";
import { ar } from "@/lib/admin/i18n-ar";
import { isTemplateNameTaken } from "@/lib/admin/landing-validation";
import type { AdminTemplateSummary } from "@/lib/api/landing-admin";
import { parsePageContent, type PageContent } from "@/lib/landing/content";

type CopySource = {
  productId: string;
  productName: string;
  slug: string;
  updatedAt: string;
};

type Tab = "save" | "apply" | "copy";

export function TemplatesMenu({
  pageId,
  templates,
  templateNames,
  copySources,
  currentContent,
  onLoadContent,
}: {
  pageId: string;
  templates: AdminTemplateSummary[];
  templateNames: string[];
  copySources: CopySource[];
  currentContent: PageContent;
  onLoadContent: (content: PageContent) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("save");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  const [copyQuery, setCopyQuery] = useState("");

  const filteredSources = useMemo(() => {
    const q = copyQuery.trim().toLowerCase();
    if (q === "") return copySources;
    return copySources.filter((s) =>
      s.productName.toLowerCase().includes(q)
    );
  }, [copyQuery, copySources]);

  const showMsg = (text: string, error = false) => setMsg({ text, error });

  const onSaveAs = async () => {
    if (busy) return;
    if (isTemplateNameTaken(saveName, templateNames)) {
      showMsg(ar.messages.templateNameTaken, true);
      return;
    }
    setBusy(true);
    const result = await saveDraftAsTemplateAction({
      content: currentContent,
      name: saveName,
      description: saveDescription,
    });
    setBusy(false);
    if (!result.ok) {
      showMsg(result.error, true);
      return;
    }
    setSaveName("");
    setSaveDescription("");
    showMsg(ar.messages.templateSaved);
  };

  const onApply = async (templateId: string) => {
    if (busy) return;
    if (!window.confirm(ar.landing.templates.applyConfirm)) return;
    setBusy(true);
    const loaded = await getTemplateContentAction(templateId);
    if (!loaded.ok) {
      setBusy(false);
      showMsg(loaded.error, true);
      return;
    }
    const result = await applyTemplateAction({ pageId, templateId });
    setBusy(false);
    if (!result.ok) {
      showMsg(result.error, true);
      return;
    }
    onLoadContent(parsePageContent(loaded.content));
    showMsg(ar.messages.templateApplied);
  };

  const onCopy = async (sourceProductId: string) => {
    if (busy) return;
    if (!window.confirm(ar.landing.templates.copyConfirm)) return;
    setBusy(true);
    const result = await copyDraftFromProductAction({
      pageId,
      sourceProductId,
    });
    if (!result.ok) {
      setBusy(false);
      showMsg(result.error, true);
      return;
    }
    const loaded = await getDraftContentForProductAction(sourceProductId);
    setBusy(false);
    if (!loaded.ok) {
      showMsg(loaded.error, true);
      return;
    }
    onLoadContent(parsePageContent(loaded.content));
    showMsg(ar.messages.templateCopied);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 hover:bg-gray-100"
      >
        {ar.landing.templates.open}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 z-40 w-[22rem] max-w-[90vw] rounded-xl border border-black/10 bg-white shadow-xl p-3">
          <div className="flex gap-1 mb-3 flex-wrap">
            <TabButton active={tab === "save"} onClick={() => setTab("save")}>
              {ar.landing.templates.saveAs}
            </TabButton>
            <TabButton active={tab === "apply"} onClick={() => setTab("apply")}>
              {ar.landing.templates.apply}
            </TabButton>
            <TabButton active={tab === "copy"} onClick={() => setTab("copy")}>
              {ar.landing.templates.copy}
            </TabButton>
          </div>

          {tab === "save" && (
            <div className="space-y-2">
              <p className="text-xs text-black/50">
                {ar.landing.templates.saveAsHelp}
              </p>
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                maxLength={80}
                placeholder={ar.landing.templates.name}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
              <input
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                maxLength={300}
                placeholder={ar.landing.templates.description}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onSaveAs}
                disabled={busy || saveName.trim() === ""}
                className="w-full rounded-full bg-emerald-600 text-white text-sm font-medium py-2 hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? ar.landing.templates.saving : ar.landing.templates.save}
              </button>
            </div>
          )}

          {tab === "apply" && (
            <div className="space-y-2">
              <p className="text-xs text-black/50">
                {ar.landing.templates.applyHelp}
              </p>
              {templates.length === 0 ? (
                <p className="text-sm text-black/40 py-2">
                  {ar.landing.templates.applyEmpty}
                </p>
              ) : (
                <ul className="max-h-64 overflow-auto divide-y divide-black/5">
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {t.name}
                        </div>
                        <div className="text-xs text-black/40">
                          {new Date(t.updated_at).toLocaleDateString("en-GB")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onApply(t.id)}
                        disabled={busy}
                        className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border border-black/15 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {ar.landing.templates.applySection}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "copy" && (
            <div className="space-y-2">
              <p className="text-xs text-black/50">
                {ar.landing.templates.copyHelp}
              </p>
              <input
                value={copyQuery}
                onChange={(e) => setCopyQuery(e.target.value)}
                placeholder={ar.landing.templates.copySearch}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
              {filteredSources.length === 0 ? (
                <p className="text-sm text-black/40 py-2">
                  {copySources.length === 0
                    ? ar.landing.templates.copyEmpty
                    : ar.landing.templates.noResults}
                </p>
              ) : (
                <ul className="max-h-64 overflow-auto divide-y divide-black/5">
                  {filteredSources.map((s) => (
                    <li
                      key={s.productId}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.productName}
                        </div>
                        <div className="text-xs text-black/40" dir="ltr">
                          /p/{s.slug}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopy(s.productId)}
                        disabled={busy}
                        className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border border-black/15 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {ar.landing.templates.copySection}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {msg && (
            <p
              className={`mt-2 text-xs ${
                msg.error ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        active
          ? "bg-black text-white border-black"
          : "border-black/15 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}
