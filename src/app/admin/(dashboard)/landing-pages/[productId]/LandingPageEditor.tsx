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
  moveSectionTo,
  removeSection,
  toggleSectionHidden,
  updateSectionProps,
  type Section,
  type SectionType,
} from "@/lib/admin/landing-sections";
import { ar, formatAr } from "@/lib/admin/i18n-ar";
import type { AdminLandingPage, AdminTemplateSummary, LandingPageStatus } from "@/lib/api/landing-admin";
import { MAX_SECTIONS, parsePageContent, type PageContent } from "@/lib/landing/content";
import type { LandingOrderData } from "@/lib/landing/order-data";
import type { Theme } from "@/lib/landing/theme";
import { LivePreview } from "./LivePreview";
import { SectionFields } from "./SectionFields";
import { SectionsPanel } from "./SectionsPanel";
import { SettingsPanel, type SettingsFields } from "./SettingsPanel";
import { TemplatesMenu } from "./TemplatesMenu";

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
  order,
  templates,
  templateNames,
  copySources,
}: {
  page: AdminLandingPage;
  productName: string;
  imageUrls: string[];
  order?: LandingOrderData | null;
  templates: AdminTemplateSummary[];
  templateNames: string[];
  copySources: {
    productId: string;
    productName: string;
    slug: string;
    updatedAt: string;
  }[];
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

  const loadContent = (content: PageContent) => {
    setTheme(content.theme);
    setSections(content.sections);
    setSelectedId(content.sections[0]?.id ?? null);
    setDirty(true);
  };

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

  const onReorderSections = (activeId: string, overId: string) => {
    const next = moveSectionTo(sections, activeId, overId);
    if (next === sections) return;
    setSections(next);
    setSelectedId(activeId);
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
    setUpdatedAt(new Date().toISOString());
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
      <header className="sticky top-0 z-30 -mx-6 -mt-6 mb-4 border-b border-black/10 bg-gray-50/95 px-6 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/landing-pages"
              onClick={goBack}
              className="shrink-0 text-sm text-black/60 hover:underline"
            >
              ← {ar.landing.backToList}
            </Link>
            <h1 className="truncate text-lg font-bold">{productName}</h1>
            <span
              className={`shrink-0 inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
            >
              {statusLabel(status)}
            </span>
            <span dir="ltr" className="shrink-0 text-xs text-black/50 font-mono">
              /p/{page.slug}
            </span>
            <span className="shrink-0 text-xs text-black/50">
              {ar.landing.lastSaved}:{" "}
              {new Date(updatedAt).toLocaleDateString("en-GB")}
            </span>
            {dirty && (
              <span className="shrink-0 text-xs text-amber-700 font-medium">
                {ar.landing.unsaved}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded-full text-sm font-medium bg-black text-white hover:bg-black/80 disabled:opacity-50"
            >
              {saving ? ar.landing.saving : ar.landing.saveDraft}
            </button>
            {status === "published" ? (
              <a
                href={`/p/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 bg-white hover:bg-gray-100"
              >
                {ar.landing.view}
              </a>
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
            <HeaderMoreMenu
              published={status === "published"}
              pageId={page.id}
              productId={page.product_id}
              templates={templates}
              templateNames={templateNames}
              copySources={copySources}
              currentContent={{ theme, sections }}
              onLoadContent={loadContent}
              onUnpublish={onUnpublish}
              unpublishing={publishing}
            />
          </div>
        </div>
      </header>

      {status !== "published" && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
          {ar.landing.notPublishedYet}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
          onReorder={onReorderSections}
          onToggleHidden={(id) => {
            setSections((prev) => toggleSectionHidden(prev, id));
            touch();
          }}
          renderEditor={(section) => (
            <SectionFields
              pageId={page.id}
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
            pageId={page.id}
            theme={theme}
            onTheme={updateTheme}
            fields={fields}
            onField={updateField}
          />
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <LivePreview theme={theme} sections={sections} order={order} />
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

// The "⋯" menu in the top bar: templates (save / apply / copy), a link to
// the draft preview when the page isn't published, and unpublish for a
// published page. Kept separate so the top bar stays uncluttered.
function HeaderMoreMenu({
  published,
  pageId,
  productId,
  templates,
  templateNames,
  copySources,
  currentContent,
  onLoadContent,
  onUnpublish,
  unpublishing,
}: {
  published: boolean;
  pageId: string;
  productId: string;
  templates: AdminTemplateSummary[];
  templateNames: string[];
  copySources: {
    productId: string;
    productName: string;
    slug: string;
    updatedAt: string;
  }[];
  currentContent: PageContent;
  onLoadContent: (content: PageContent) => void;
  onUnpublish: () => void;
  unpublishing: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={ar.landing.moreActions}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 rounded-full text-sm font-medium border border-black/15 bg-white hover:bg-gray-100"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute end-0 mt-2 z-40 flex w-64 flex-col gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-xl">
          <TemplatesMenu
            pageId={pageId}
            templates={templates}
            templateNames={templateNames}
            copySources={copySources}
            currentContent={currentContent}
            onLoadContent={onLoadContent}
          />
          <Link
            href={`/admin/landing-pages/${productId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 text-center hover:bg-gray-100"
          >
            {ar.landing.viewDraft}
          </Link>
          {published ? (
            <button
              type="button"
              onClick={() => {
                if (!window.confirm(ar.landing.unpublishConfirm)) return;
                setOpen(false);
                onUnpublish();
              }}
              disabled={unpublishing}
              className="px-4 py-2 rounded-full text-sm font-medium border border-black/15 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {unpublishing ? ar.landing.unpublishing : ar.landing.unpublish}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
