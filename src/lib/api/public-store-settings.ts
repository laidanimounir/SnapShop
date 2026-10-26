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

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parsePixelId, parseTiktokPixelId } from "@/lib/landing/content";

/** Same key the admin settings form writes (see store-settings.ts). */
const PIXEL_SETTING_KEY = "tracking_pixel";

// Cookie-free anon client: using the cookie-aware client would call
// cookies() and force every storefront route to be dynamic. RLS plus the
// row-limited policy (migration 0019) are what make this read public.
let anonClient: SupabaseClient | null = null;
function publicSupabase(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

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
 * Reads the tracking pixel setting with the anon key. Never throws:
 * returns disabled settings when the row is not readable (public read
 * policy not applied yet, network error, ...).
 */
export async function getPublicPixelSettings(): Promise<PublicPixelSettings> {
  // Hard 3s budget: this runs in the root layout, so a hung request must
  // never stall the whole page.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const { data, error } = await publicSupabase()
      .from("store_settings")
      .select("value")
      .eq("key", PIXEL_SETTING_KEY)
      .abortSignal(controller.signal)
      .maybeSingle();
    if (error || !data) return DISABLED_PIXEL_SETTINGS;
    return parseTrackingPixelSetting(data.value);
  } catch {
    return DISABLED_PIXEL_SETTINGS;
  } finally {
    clearTimeout(timer);
  }
}
