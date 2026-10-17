import { requireAdmin } from "@/lib/supabase/admin";

export type TrackingPixelSettings = {
  pixel_id: string;
  enabled: boolean;
};

export type DeliveryProviderSettings = {
  api_key: string;
  base_url: string;
  enabled: boolean;
};

export const TRACKING_PIXEL_KEY = "tracking_pixel";
export const DELIVERY_PROVIDER_KEY = "delivery_provider_ecotrack";

export const DEFAULT_TRACKING_PIXEL: TrackingPixelSettings = {
  pixel_id: "",
  enabled: false,
};

export const DEFAULT_DELIVERY_PROVIDER: DeliveryProviderSettings = {
  api_key: "",
  base_url: "",
  enabled: false,
};

export type StoreSettingsBundle = {
  tracking: TrackingPixelSettings;
  provider: DeliveryProviderSettings;
};

/** Server-only: reads settings with the service role after requireAdmin(). */
export async function getStoreSettings(): Promise<StoreSettingsBundle> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", [TRACKING_PIXEL_KEY, DELIVERY_PROVIDER_KEY]);
  if (error) throw new Error(error.message);

  const map = new Map(
    ((data ?? []) as { key: string; value: unknown }[]).map((row) => [
      row.key,
      row.value,
    ])
  );

  const tracking = (map.get(TRACKING_PIXEL_KEY) ?? {}) as Partial<TrackingPixelSettings>;
  const provider = (map.get(DELIVERY_PROVIDER_KEY) ?? {}) as Partial<DeliveryProviderSettings>;

  return {
    tracking: {
      pixel_id:
        typeof tracking.pixel_id === "string" ? tracking.pixel_id : "",
      enabled: tracking.enabled === true,
    },
    provider: {
      api_key: typeof provider.api_key === "string" ? provider.api_key : "",
      base_url:
        typeof provider.base_url === "string" ? provider.base_url : "",
      enabled: provider.enabled === true,
    },
  };
}

export async function upsertStoreSetting(
  key: string,
  value: unknown,
  userId: string
): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("store_settings").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);
}
