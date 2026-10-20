"use server";

import { revalidatePath } from "next/cache";

import { ar } from "@/lib/admin/i18n-ar";
import { normalizeActionError } from "@/lib/admin/action-errors";
import {
  buildApplyTemplateUpdate,
  buildPublishUpdate,
  buildUnpublishUpdate,
  isTemplateNameTaken,
  templateNameKey,
  validateContentInput,
  validatePixelsInput,
  validateSeoInput,
  validateSlugInput,
  validateTemplateInput,
  validateTemplateName,
} from "@/lib/admin/landing-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { fallbackPageContent } from "@/lib/landing/content";
import { starterSections } from "@/lib/admin/landing-sections";
import { requireAdmin } from "@/lib/supabase/admin";

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function actionError(error: unknown): { ok: false; error: string } {
  console.error("[landing action]", error);
  return { ok: false, error: normalizeActionError(error) };
}

function enforceAdminRateLimit(userId: string, action: string) {
  if (!checkRateLimit(`admin:${action}:${userId}`, 30)) {
    throw new Error(ar.messages.tooManyRequests);
  }
}

// A published page affects the public landing route and the catalog
// entries that link to it, so all of them are revalidated.
function revalidateLandingPaths(slug: string) {
  revalidatePath("/admin/landing-pages");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
}

export async function createLandingPageAction(input: {
  productId: string;
  slug: string;
}): Promise<ActionResult<{ pageId: string; slug: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "createLandingPage");

    const productId =
      typeof input?.productId === "string" ? input.productId : "";
    if (productId === "") {
      return { ok: false, error: ar.messages.landingNotCreated };
    }

    const slug = validateSlugInput(input?.slug);
    if (!slug.ok) return { ok: false, error: slug.error };

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product) return { ok: false, error: ar.messages.productNotFound };

    // Idempotent: if a page already exists for this product, return it
    // instead of failing on the UNIQUE(product_id) constraint.
    const { data: existing, error: existingError } = await supabase
      .from("product_landing_pages")
      .select("id, slug")
      .eq("product_id", productId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) {
      const row = existing as { id: string; slug: string };
      return { ok: true, pageId: row.id, slug: row.slug };
    }

    const { data: clash, error: clashError } = await supabase
      .from("product_landing_pages")
      .select("id")
      .eq("slug", slug.value)
      .maybeSingle();
    if (clashError) throw new Error(clashError.message);
    if (clash) return { ok: false, error: ar.messages.slugTaken };

    const { data: imageRows, error: imageError } = await supabase
      .from("product_images")
      .select("url, position")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(1);
    if (imageError) throw new Error(imageError.message);
    const imageUrl = ((imageRows ?? []) as { url: string }[])[0]?.url;

    const starter = starterSections({ imageUrl });
    const content = {
      ...fallbackPageContent(),
      sections: starter,
    };

    const { data: created, error } = await supabase
      .from("product_landing_pages")
      .insert({
        product_id: productId,
        slug: slug.value,
        status: "draft",
        draft_content: content,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/admin/landing-pages");
    const row = created as { id: string; slug: string };
    return { ok: true, pageId: row.id, slug: row.slug };
  } catch (error) {
    return actionError(error);
  }
}

export type LandingDraftInput = {
  pageId: string;
  content: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  ogImageUrl?: unknown;
  facebookPixelId?: unknown;
  tiktokPixelId?: unknown;
};

export async function saveLandingDraftAction(
  input: LandingDraftInput
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveLandingDraft");

    const pageId = typeof input?.pageId === "string" ? input.pageId : "";
    if (pageId === "") {
      return { ok: false, error: ar.messages.landingNotFound };
    }

    const content = validateContentInput(input?.content);
    if (!content.ok) return { ok: false, error: content.error };

    const seo = validateSeoInput(input ?? {});
    if (!seo.ok) return { ok: false, error: seo.error };

    const pixels = validatePixelsInput(input ?? {});
    if (!pixels.ok) return { ok: false, error: pixels.error };

    const updatedAt = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("product_landing_pages")
      .update({
        draft_content: content.value,
        ...seo.value,
        ...pixels.value,
        updated_at: updatedAt,
      })
      .eq("id", pageId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) return { ok: false, error: ar.messages.landingNotFound };

    revalidatePath("/admin/landing-pages");
    return { ok: true, updatedAt };
  } catch (error) {
    return actionError(error);
  }
}

const LANDING_ASSET_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Saves one hero/gallery/OG image to the public landing-assets bucket.
// Only a small, decoded-header-verified image is accepted; the returned
// public URL is stored in the draft content by the editor.
export async function uploadLandingAssetAction(
  pageId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "uploadLandingAsset");

    const { MAX_IMAGE_BYTES, detectImageType } = await import(
      "@/lib/admin/product-validation"
    );
    const { landingAssetPath, isUuid, LANDING_ASSET_BUCKET } = await import(
      "@/lib/admin/landing-asset"
    );

    if (!isUuid(pageId)) return { ok: false, error: ar.messages.landingNotFound };
    const { data: page, error: pageError } = await supabase
      .from("product_landing_pages")
      .select("id")
      .eq("id", pageId)
      .maybeSingle();
    if (pageError) throw new Error(pageError.message);
    if (!page) return { ok: false, error: ar.messages.landingNotFound };

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: ar.messages.chooseImage };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: ar.messages.imageSize };
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { ok: false, error: ar.messages.imageType };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = detectImageType(bytes);
    if (!kind) return { ok: false, error: ar.messages.imageReal };

    // Header-read dimensions guard against decompression bombs before the
    // file reaches storage or the Next image optimizer.
    const { readImageDimensions, withinDimensionLimit } = await import(
      "@/lib/admin/image-dimensions"
    );
    if (!withinDimensionLimit(readImageDimensions(bytes))) {
      return { ok: false, error: ar.messages.imageDimensions };
    }

    const { randomUUID } = await import("crypto");
    const path = landingAssetPath(pageId, randomUUID(), kind);
    if (!path) return { ok: false, error: ar.messages.generic };

    const { error: uploadError } = await supabase.storage
      .from(LANDING_ASSET_BUCKET)
      .upload(path, Buffer.from(bytes), {
        contentType: LANDING_ASSET_MIME[kind],
        upsert: false,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from(LANDING_ASSET_BUCKET).getPublicUrl(path);
    return { ok: true, url: publicUrl };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishLandingPageAction(
  pageId: string
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "publishLandingPage");

    const { data: current, error: fetchError } = await supabase
      .from("product_landing_pages")
      .select("slug, draft_content")
      .eq("id", pageId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) return { ok: false, error: ar.messages.landingNotFound };

    const draft = current as { slug: string; draft_content: unknown };
    const update = buildPublishUpdate(draft.draft_content);
    if (!update.ok) return { ok: false, error: update.error };

    const { error } = await supabase
      .from("product_landing_pages")
      .update({ ...update.value, updated_at: new Date().toISOString() })
      .eq("id", pageId);
    if (error) throw new Error(error.message);

    revalidateLandingPaths(draft.slug);
    return { ok: true, slug: draft.slug };
  } catch (error) {
    return actionError(error);
  }
}

export async function unpublishLandingPageAction(
  pageId: string
): Promise<ActionResult<{ slug: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "unpublishLandingPage");

    const { data: current, error: fetchError } = await supabase
      .from("product_landing_pages")
      .select("slug")
      .eq("id", pageId)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) return { ok: false, error: ar.messages.landingNotFound };

    const slug = (current as { slug: string }).slug;
    const { error } = await supabase
      .from("product_landing_pages")
      .update({
        ...buildUnpublishUpdate(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId);
    if (error) throw new Error(error.message);

    revalidateLandingPaths(slug);
    return { ok: true, slug };
  } catch (error) {
    return actionError(error);
  }
}

// ------------------------------------------------------------
// Templates
// ------------------------------------------------------------

// The unique index on the trimmed, lower-cased name raises a 23505 when a
// template name collides; surface that as a friendly Arabic message.
function isDuplicateNameError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23505" ||
    (typeof error.message === "string" &&
      error.message.includes("uq_landing_template_name"))
  );
}

// Saves the editor's current draft as a reusable template. The content is
// validated with the same strict page schema as normal writes, so a
// template can never hold broken sections.
export async function saveDraftAsTemplateAction(input: {
  content: unknown;
  name?: unknown;
  description?: unknown;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "saveDraftAsTemplate");

    const validated = validateTemplateInput(input ?? {});
    if (!validated.ok) return { ok: false, error: validated.error };

    const { data, error } = await supabase
      .from("landing_page_templates")
      .insert({
        name: validated.value.name,
        description: validated.value.description,
        content: validated.value.content,
      })
      .select("id")
      .single();
    if (error) {
      if (isDuplicateNameError(error)) {
        return { ok: false, error: ar.messages.templateNameTaken };
      }
      throw new Error(error.message);
    }

    revalidatePath("/admin/landing-templates");
    return { ok: true, id: (data as { id: string }).id };
  } catch (error) {
    return actionError(error);
  }
}

export async function renameTemplateAction(input: {
  id: unknown;
  name: unknown;
}): Promise<ActionResult<{ id: string; name: string; updatedAt: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "renameTemplate");

    const id = typeof input?.id === "string" ? input.id : "";
    if (id === "") return { ok: false, error: ar.messages.templateNotFound };

    const name = validateTemplateName(input?.name);
    if (!name.ok) return { ok: false, error: name.error };

    const { data: existing, error: existingError } = await supabase
      .from("landing_page_templates")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) return { ok: false, error: ar.messages.templateNotFound };

    if (isTemplateNameTaken(name.value, [(existing as { name: string }).name])) {
      return { ok: false, error: ar.messages.templateNameTaken };
    }
    if (templateNameKey(name.value) === templateNameKey((existing as { name: string }).name)) {
      // Same name (ignoring case/spaces): nothing to change.
      const { data: same, error: sameError } = await supabase
        .from("landing_page_templates")
        .select("name, updated_at")
        .eq("id", id)
        .single();
      if (sameError) throw new Error(sameError.message);
      const row = same as { name: string; updated_at: string };
      return { ok: true, id, name: row.name, updatedAt: row.updated_at };
    }

    const { data, error } = await supabase
      .from("landing_page_templates")
      .update({ name: name.value })
      .eq("id", id)
      .select("id, name, updated_at")
      .single();
    if (error) {
      if (isDuplicateNameError(error)) {
        return { ok: false, error: ar.messages.templateNameTaken };
      }
      throw new Error(error.message);
    }

    revalidatePath("/admin/landing-templates");
    const row = data as { id: string; name: string; updated_at: string };
    return { ok: true, id: row.id, name: row.name, updatedAt: row.updated_at };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteTemplateAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "deleteTemplate");

    if (typeof id !== "string" || id === "") {
      return { ok: false, error: ar.messages.templateNotFound };
    }

    const { data, error } = await supabase
      .from("landing_page_templates")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { ok: false, error: ar.messages.templateNotFound };

    revalidatePath("/admin/landing-templates");
    return { ok: true, id: (data as { id: string }).id };
  } catch (error) {
    return actionError(error);
  }
}

// Returns a template's content so the editor can load it into local state.
// The editor replaces its draft only after this call succeeds; the DB is
// not touched until the admin presses Save.
export async function getTemplateContentAction(
  id: string
): Promise<ActionResult<{ content: unknown }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "getTemplateContent");

    if (typeof id !== "string" || id === "") {
      return { ok: false, error: ar.messages.templateNotFound };
    }

    const { data, error } = await supabase
      .from("landing_page_templates")
      .select("content")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { ok: false, error: ar.messages.templateNotFound };

    return { ok: true, content: (data as { content: unknown }).content };
  } catch (error) {
    return actionError(error);
  }
}

// Returns a source product's current draft content so the editor can load
// it after a copy. Read-only; never writes.
export async function getDraftContentForProductAction(
  productId: string
): Promise<ActionResult<{ content: unknown }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "getDraftContentForProduct");

    if (typeof productId !== "string" || productId === "") {
      return { ok: false, error: ar.messages.landingNotFound };
    }

    const { data, error } = await supabase
      .from("product_landing_pages")
      .select("draft_content")
      .eq("product_id", productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { ok: false, error: ar.messages.landingNotFound };

    return {
      ok: true,
      content: (data as { draft_content: unknown }).draft_content,
    };
  } catch (error) {
    return actionError(error);
  }
}

// Replaces the target page's draft_content with a template's content. The
// published snapshot is never touched. The template content is re-validated
// before the write, so a bad stored template cannot corrupt the draft.
export async function applyTemplateAction(input: {
  pageId: unknown;
  templateId: unknown;
}): Promise<ActionResult<{ sections: number }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "applyTemplate");

    const pageId = typeof input?.pageId === "string" ? input.pageId : "";
    const templateId =
      typeof input?.templateId === "string" ? input.templateId : "";
    if (pageId === "") return { ok: false, error: ar.messages.landingNotFound };
    if (templateId === "") {
      return { ok: false, error: ar.messages.templateNotFound };
    }

    const { data: page, error: pageError } = await supabase
      .from("product_landing_pages")
      .select("id")
      .eq("id", pageId)
      .maybeSingle();
    if (pageError) throw new Error(pageError.message);
    if (!page) return { ok: false, error: ar.messages.landingNotFound };

    const { data: template, error: templateError } = await supabase
      .from("landing_page_templates")
      .select("content")
      .eq("id", templateId)
      .maybeSingle();
    if (templateError) throw new Error(templateError.message);
    if (!template) return { ok: false, error: ar.messages.templateNotFound };

    const update = buildApplyTemplateUpdate(
      (template as { content: unknown }).content
    );
    if (!update.ok) return { ok: false, error: update.error };

    const { error } = await supabase
      .from("product_landing_pages")
      .update(update.value)
      .eq("id", pageId);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/landing-pages");
    return { ok: true, sections: update.value.draft_content.sections.length };
  } catch (error) {
    return actionError(error);
  }
}

// Copies another product's current draft content into the target page's
// draft. Only draft_content is written — published_content is never
// touched, and the copied content is re-validated first.
export async function copyDraftFromProductAction(input: {
  pageId: unknown;
  sourceProductId: unknown;
}): Promise<ActionResult<{ sections: number }>> {
  try {
    const { userId, supabase } = await requireAdmin();
    enforceAdminRateLimit(userId, "copyDraftFromProduct");

    const pageId = typeof input?.pageId === "string" ? input.pageId : "";
    const sourceProductId =
      typeof input?.sourceProductId === "string" ? input.sourceProductId : "";
    if (pageId === "") return { ok: false, error: ar.messages.landingNotFound };
    if (sourceProductId === "") {
      return { ok: false, error: ar.messages.productNotFound };
    }

    const { data: target, error: targetError } = await supabase
      .from("product_landing_pages")
      .select("id")
      .eq("id", pageId)
      .maybeSingle();
    if (targetError) throw new Error(targetError.message);
    if (!target) return { ok: false, error: ar.messages.landingNotFound };

    const { data: source, error: sourceError } = await supabase
      .from("product_landing_pages")
      .select("draft_content")
      .eq("product_id", sourceProductId)
      .maybeSingle();
    if (sourceError) throw new Error(sourceError.message);
    if (!source) return { ok: false, error: ar.messages.landingNotFound };

    const update = buildApplyTemplateUpdate(
      (source as { draft_content: unknown }).draft_content
    );
    if (!update.ok) return { ok: false, error: update.error };

    const { error } = await supabase
      .from("product_landing_pages")
      .update(update.value)
      .eq("id", pageId);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/landing-pages");
    return { ok: true, sections: update.value.draft_content.sections.length };
  } catch (error) {
    return actionError(error);
  }
}
