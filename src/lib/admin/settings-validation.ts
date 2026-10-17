// Validators and masking helpers for /admin/settings. Pure functions,
// shared by the client form and the server actions.

import { ar } from "./i18n-ar";

export const PIXEL_ID_MIN_LENGTH = 5;
export const PIXEL_ID_MAX_LENGTH = 20;

/** Pixel ID: digits only, 5-20 characters. Empty is allowed (unset). */
export function validatePixelId(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (
    !new RegExp(
      `^\\d{${PIXEL_ID_MIN_LENGTH},${PIXEL_ID_MAX_LENGTH}}$`
    ).test(trimmed)
  ) {
    return ar.validation.pixelId;
  }
  return null;
}

/** Optional Base URL; when provided it must be a valid https URL. */
export function validateHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return ar.validation.urlValid;
  }
  if (parsed.protocol !== "https:") {
    return ar.validation.httpsUrl;
  }
  return null;
}

/**
 * Never return a full secret to the browser: only the last 4 characters
 * are shown, prefixed by a mask. Empty values render as "Not set".
 */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return "Not set";
  const visible = value.slice(-4);
  return `••••••${visible}`;
}
