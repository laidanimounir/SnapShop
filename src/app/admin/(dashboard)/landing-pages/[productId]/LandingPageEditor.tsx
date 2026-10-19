"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  publishLandingPageAction,
  saveLandingDraftAction,
  unpublishLandingPageAction,
} from "@/app/admin/landing-actions";
import {
  addSection,
  duplicateSection,
  isSectionValid,
  moveSection,
  removeSection,
  toggleSectionHidden,
  updateSectionProps,
  type Section,
  type SectionType,
} from "@/lib/admin/landing-sections";
import { ar, formatAr } from "@/lib/admin/i18n-ar";
import type { AdminLandingPage, LandingPageStatus } from "@/lib/api/landing-admin";
import { MAX_SECTIONS, parsePageContent } from "@/lib/landing/content";
import type { Theme } from "@/lib/landing/theme";
import { SectionFields } from "./SectionFields";
import { SectionsPanel } from "./SectionsPanel";
import { SettingsPanel, type SettingsFields } from "./SettingsPanel";

const STATUS_STYLES: Record<LandingPageStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  unpublished: "bg-gray-200 text-gray-600",
};

function statusLabel(status: LandingPageStatus): string {
  if (status === "published") return ar.landing.published;
  if (status === "unpublished") return ar.landing.unpublished;
  return ar.landing.draft;
}

export function LandingPageEditor({
  page,
  productName,
  imageUrls,
}: {
  page: AdminLandingPage;
  productName: string;
  imageUrls: string[];
}) {
  const router = useRouter();

  const initial = parsePageContent(page.draft_content);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [sections, setSections] = useState<Section[]>(initial.sections);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.sections[0]?.id ?? null
  );
  const [fields, setFields] = useState<SettingsFields>({
    seoTitle: page.seo_title ?? "",
    seoDescription: page.seo_description ?? "",
    ogImageUrl: page.og_image_url ?? "",
    facebookPixelId: page.facebook_pixel_id ?? "",
    tiktokPixelId: page.tiktok_pixel_id ?? "",
  });

  const [status, setStatus] = useState<LandingPageStatus>(page.status);
  const [updatedAt, setUpdatedAt] = useState(page.updated_at);
  const [publishedAt, setPublishedAt] = useState(page.published_at);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(
    null
  );

  const hasInvalidSection = sections.some((s) => !isSectionValid(s));

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg: string, error = false) => setToast({ msg, error });

  const touch = () => setDirty(true);

  const updateTheme = (patch: Partial<Theme>) => {
    setTheme((prev) => ({ ...prev, ...patch }));
    touch();
  };

  const updateField = (key: keyof SettingsFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    touch();
  };

  const onAddSection = (type: SectionType) => {
    if (sections.length >= MAX_SECTIONS) {
      showToast(formatAr(ar.landing.maxSections, { n: MAX_SECTIONS }), true);
      return;
    }
    const next = addSection(sections, type, { imageUrl: imageUrls[0] });
    setSections(next);
    setSelectedId(next[next.length - 1].id);
    touch();
  };

  const onRemoveSection = (id: string) => {
    setSections((prev) => removeSection(prev, id));
    setSelectedId((prev) => (prev === id ? null : prev));
    touch();
  };

  const onDuplicateSection = (id: string) => {
    if (sections.length >= MAX_SECTIONS) {
      showToast(formatAr(ar.landing.maxSections, { n: MAX_SECTIONS }), true);
      return;
    }
    setSections((prev) => duplicateSection(prev, id));
    touch();
  };

  const persist = async (): Promise<boolean> => {
    if (hasInvalidSection) {
      showToast(ar.landing.invalidSection, true);
      return false;
    }
    setSaving(true);
    const result = await saveLandingDraftAction({
      pageId: page.id,
      content: { theme, sections },
      ...fields,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.error, true);
      return false;
    }
    setDirty(false);
    setUpdatedAt(result.updatedAt);
    return true;
  };

  const onSave = async () => {
    if (await persist()) showToast(ar.landing.savedDraft);
  };

  const onPublish = async () => {
    setPublishing(true);
    if (dirty || hasInvalidSection) {
      const saved = await persist();
      if (!saved) {
        setPublishing(false);
        return;
      }
    }
    const result = await publishLandingPageAction(page.id);
    setPublishing(false);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setStatus("published");
    setPublishedAt(new Date().toISOString());
    showToast(ar.landing.publishedMsg);
    router.refresh();
  };

  const onUnpublish = async () => {
    setPublishing(true);
    const result = await unpublishLandingPageAction(page.id);
    setPublishing(false);
    if (!result.ok) {
      showToast(result.error, true);
      return;
    }
    setStatus("unpublished");
    showToast(ar.landing.unpublishedMsg);
    router.refresh();
  };

  const goBack = (e: React.MouseEvent) => {
    if (dirty && !window.confirm(ar.landing.unsavedWarning)) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <Link
        href="/admin/landing-pages"
        onClick={goBack}
        className="text-sm text-black/60 hover:underline"
      >
        ← {ar.landing.backToList}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mt-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{productName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
            >
              {statusLabel(status)}
            </span>
            <span
              dir="ltr"
              className="text-xs text-black/50 font-mono"
            >
              /p/{page.slug}
            </span>
            {dirty && (
              <span className="text-xs text-amber-700 font-medium">
                {ar.landing.unsaved}
              </span>
            )}
          </div>
          <div className="text-xs text-black/50 mt-1">
            {ar.landing.lastSaved}:{" "}
            {new Date(updatedAt).toLocaleDateString("en-GB")}
            {publishedAt &&
              ` • ${ar.landing.publishedAt}: ${new Date(
                publishedAt
              ).toLocaleDateString("en-GB")}`}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {status === "published" ? (
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 hover:bg-gray-100"
            >
              {ar.landing.view}
            </a>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 hover:bg-gray-100 disabled:opacity-50"
          >
            {saving ? ar.landing.saving : ar.landing.saveDraft}
          </button>
          {status === "published" ? (
            <button
              type="button"
              onClick={onUnpublish}
              disabled={publishing}
              className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {publishing ? ar.landing.unpublishing : ar.landing.unpublish}
            </button>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {publishing ? ar.landing.publishing : ar.landing.publish}
            </button>
          )}
        </div>
      </div>

      {status !== "published" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
          {ar.landing.notPublishedYet}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionsPanel
          sections={sections}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={onAddSection}
          onRemove={onRemoveSection}
          onDuplicate={onDuplicateSection}
          onMove={(id, dir) => {
            setSections((prev) => moveSection(prev, id, dir));
            touch();
          }}
          onToggleHidden={(id) => {
            setSections((prev) => toggleSectionHidden(prev, id));
            touch();
          }}
          renderEditor={(section) => (
            <SectionFields
              section={section}
              onChange={(props) => {
                setSections((prev) =>
                  updateSectionProps(prev, section.id, props)
                );
                touch();
              }}
            />
          )}
        />
        <div>
          <SettingsPanel
            theme={theme}
            onTheme={updateTheme}
            fields={fields}
            onField={updateField}
          />
          <p className="text-xs text-black/50">{ar.landing.previewNote}</p>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 start-5 z-50 px-4 py-2 rounded-lg text-sm text-white shadow-lg ${
            toast.error ? "bg-red-600" : "bg-black"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
