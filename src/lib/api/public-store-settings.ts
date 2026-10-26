// Public reader for the store tracking settings.
//
// Safe for anonymous visitors: read-only, server-side, and it only ever
// returns pixel ids that already passed the existing regexes
// (parsePixelId / parseTiktokPixelId). It never reads or returns delivery
// credentials or any other admin-only field - and it deliberately does NOT
// import the service-role module, so nothing admin can be bundled with it.
//
// Every failure path (table unreachable, RLS denying the read, bad shape)
// degrades silently to "disabled": the layout then injects nothing, which
// is exactly how the site behaves before migration 0019 is applied.

import { createServerSupabase } from "@/lib/supabase/server";
import { parsePixelId, parseTiktokPixelId } from "@/lib/landing/content";

/** Same key the admin settings form writes (see store-settings.ts). */
const PIXEL_SETTING_KEY = "tracking_pixel";

export type PublicPixelSettings = {
  enabled: boolean;
  /** Meta / Facebook pixel id (digits), null when missing or invalid. */
  facebookPixelId: string | null;
  /** TikTok pixel id (alphanumeric), null when missing or invalid. */
  tiktokPixelId: string | null;
};

export const DISABLED_PIXEL_SETTINGS: PublicPixelSettings = Object.freeze({
  enabled: false,
  facebookPixelId: null,
  tiktokPixelId: null,
});

/**
 * Pure parser for the stored `tracking_pixel` JSON value. Anything that is
 * not explicitly enabled (or not an object) reads as "disabled".
 * Only `enabled: true` with a valid id ever produces an injectable pixel.
 */
export function parseTrackingPixelSetting(
  raw: unknown
): PublicPixelSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DISABLED_PIXEL_SETTINGS;
  }
  const value = raw as Record<string, unknown>;
  if (value.enabled !== true) return DISABLED_PIXEL_SETTINGS;
  return {
    enabled: true,
    facebookPixelId: parsePixelId(value.pixel_id),
    // Optional: the admin form only saves the Meta id today; a TikTok id
    // stored alongside it (same JSON) is picked up when present.
    tiktokPixelId: parseTiktokPixelId(value.tiktok_pixel_id),
  };
}

/**
 * Reads the tracking pixel setting for the current request with the anon
 * key. Never throws: returns disabled settings when the row is not
 * readable (public read policy not applied yet, network error, ...).
 */
export async function getPublicPixelSettings(): Promise<PublicPixelSettings> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", PIXEL_SETTING_KEY)
      .maybeSingle();
    if (error || !data) return DISABLED_PIXEL_SETTINGS;
    return parseTrackingPixelSetting(data.value);
  } catch {
    return DISABLED_PIXEL_SETTINGS;
  }
}
