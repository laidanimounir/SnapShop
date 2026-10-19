"use server";

import { revalidatePath } from "next/cache";

import { ar } from "@/lib/admin/i18n-ar";
import { normalizeActionError } from "@/lib/admin/action-errors";
import {
  buildPublishUpdate,
  buildUnpublishUpdate,
  validateContentInput,
  validatePixelsInput,
  validateSeoInput,
  validateSlugInput,
} from "@/lib/admin/landing-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { fallbackPageContent } from "@/lib/landing/content";
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
      .select("id")
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

    const { data: created, error } = await supabase
      .from("product_landing_pages")
      .insert({
        product_id: productId,
        slug: slug.value,
        status: "draft",
        draft_content: fallbackPageContent(),
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
