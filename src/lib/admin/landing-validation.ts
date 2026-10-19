// Pure validation + payload builders for the landing-page admin actions.
// Kept free of Supabase/React so the server actions stay thin and every
// rule here is unit-tested (slug, content, SEO, pixels, publish payload).

import { ar } from "./i18n-ar";
import {
  isValidSlug,
  pageContentSchema,
  parsePixelId,
  type PageContent,
} from "@/lib/landing/content";

export const SEO_TITLE_MAX = 200;
export const SEO_DESCRIPTION_MAX = 400;
export const OG_IMAGE_MAX = 2048;
const HTTPS_URL = /^https:\/\/\S+$/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// ------------------------------------------------------------
// Slug
// ------------------------------------------------------------

// Best-effort readable slug from a (possibly Arabic) product name. Latin
// letters/digits survive; everything else collapses to dashes. When the
// result is too short (e.g. an all-Arabic name) a neutral fallback is
// used, so the caller always gets a value the DB CHECK accepts.
export function suggestSlug(name: unknown, fallback = "offer"): string {
  const cleaned = (typeof name === "string" ? name : "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  const candidate = cleaned.length >= 3 ? cleaned : fallback;
  return candidate.length >= 3 ? candidate : "offer";
}

// Appends -2, -3, … until the slug is unused. Pure: the caller passes the
// already-taken slugs (e.g. read from the DB).
export function ensureUniqueSlug(
  base: string,
  taken: Iterable<string>
): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  let candidate = `${base}-${n}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate.slice(0, 80).replace(/-+$/g, "");
}

export function validateSlugInput(raw: unknown): ValidationResult<string> {
  const slug = asString(raw).toLowerCase();
  if (!isValidSlug(slug)) return { ok: false, error: ar.validation.landingSlug };
  return { ok: true, value: slug };
}

// ------------------------------------------------------------
// Content
// ------------------------------------------------------------

export function validateContentInput(
  raw: unknown
): ValidationResult<PageContent> {
  const parsed = pageContentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: ar.validation.landingContent };
  }
  return { ok: true, value: parsed.data };
}

// ------------------------------------------------------------
// SEO
// ------------------------------------------------------------

export type SeoInput = {
  seoTitle?: unknown;
  seoDescription?: unknown;
  ogImageUrl?: unknown;
};

export type SeoColumns = {
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
};

export function validateSeoInput(input: SeoInput): ValidationResult<SeoColumns> {
  const title = asString(input?.seoTitle);
  if (title.length > SEO_TITLE_MAX) {
    return { ok: false, error: ar.validation.seoTitle };
  }

  const description = asString(input?.seoDescription);
  if (description.length > SEO_DESCRIPTION_MAX) {
    return { ok: false, error: ar.validation.seoDescription };
  }

  const ogImage = asString(input?.ogImageUrl);
  if (ogImage !== "" && !HTTPS_URL.test(ogImage)) {
    return { ok: false, error: ar.validation.ogImage };
  }
  if (ogImage.length > OG_IMAGE_MAX) {
    return { ok: false, error: ar.validation.ogImage };
  }

  return {
    ok: true,
    value: {
      seo_title: title === "" ? null : title,
      seo_description: description === "" ? null : description,
      og_image_url: ogImage === "" ? null : ogImage,
    },
  };
}

// ------------------------------------------------------------
// Tracking pixels
// ------------------------------------------------------------

export type PixelInput = {
  facebookPixelId?: unknown;
  tiktokPixelId?: unknown;
};

export type PixelColumns = {
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
};

export function validatePixelsInput(
  input: PixelInput
): ValidationResult<PixelColumns> {
  const facebook = asString(input?.facebookPixelId);
  const tiktok = asString(input?.tiktokPixelId);

  if (facebook !== "" && parsePixelId(facebook) === null) {
    return { ok: false, error: ar.validation.pixelId };
  }
  if (tiktok !== "" && parsePixelId(tiktok) === null) {
    return { ok: false, error: ar.validation.pixelId };
  }

  return {
    ok: true,
    value: {
      facebook_pixel_id: facebook === "" ? null : facebook,
      tiktok_pixel_id: tiktok === "" ? null : tiktok,
    },
  };
}

// ------------------------------------------------------------
// Publish / unpublish
// ------------------------------------------------------------

export type PublishUpdate = {
  status: "published";
  published_content: PageContent;
  published_at: string;
};

// Publishing copies the validated draft into published_content. `now` is
// injectable so the timestamp is deterministic in tests.
export function buildPublishUpdate(
  draftContent: unknown,
  now: Date = new Date()
): ValidationResult<PublishUpdate> {
  const content = validateContentInput(draftContent);
  if (!content.ok) return content;
  return {
    ok: true,
    value: {
      status: "published",
      published_content: content.value,
      published_at: now.toISOString(),
    },
  };
}

export type UnpublishUpdate = { status: "unpublished" };

export function buildUnpublishUpdate(): UnpublishUpdate {
  return { status: "unpublished" };
}
