// Landing page images live in the public "landing-assets" bucket. Object
// paths are always built here so neither the page id nor the file id can
// smuggle a "../" segment (or a different bucket) into storage.

import type { ImageKind } from "./product-validation";

export const LANDING_ASSET_BUCKET = "landing-assets";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** In-bucket path for one uploaded image, or null for unsafe identifiers. */
export function landingAssetPath(
  pageId: unknown,
  fileId: unknown,
  kind: ImageKind
): string | null {
  if (!isUuid(pageId) || !isUuid(fileId)) return null;
  if (kind !== "jpg" && kind !== "png" && kind !== "webp") return null;
  return `landing/${pageId}/${fileId}.${kind}`;
}
