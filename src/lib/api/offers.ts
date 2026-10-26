import { createServerSupabase } from "@/lib/supabase/server";
import type { QuantityOffer } from "@/types/offer.types";

const OFFER_COLUMNS =
  "id, product_id, quantity, total_price, label, badge, is_default, position, is_active";

/**
 * Public read of the active quantity tiers of a product (anon, RLS).
 * Migration 0016 not applied yet (or any read problem) => [] so the live
 * product page keeps rendering exactly as it does today.
 */
export async function getActiveQuantityOffers(
  productId: string
): Promise<QuantityOffer[]> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("product_quantity_offers")
      .select(OFFER_COLUMNS)
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("quantity", { ascending: true });
    if (error) return [];
    return (data ?? []) as QuantityOffer[];
  } catch {
    return [];
  }
}
