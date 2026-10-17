import { supabase } from "@/lib/supabase/client";
import type { DeliveryZone } from "@/lib/delivery";

/**
 * Active delivery zones from the anon-readable view. RLS already
 * restricts rows to is_active = true; the filter is explicit anyway.
 */
export async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("wilaya_code, name_ar, name_fr, home_price, office_price")
    .eq("is_active", true)
    .order("wilaya_code", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    wilaya_code: Number(row.wilaya_code),
    name_ar: String(row.name_ar),
    name_fr: String(row.name_fr),
    home_price: Number(row.home_price),
    office_price: Number(row.office_price),
  }));
}
