import { supabase } from "@/lib/supabase/client";
import { ar } from "@/lib/store/i18n-ar";
import { ENABLE_OFFERS } from "@/lib/config";

export type OrderItemPayload = {
  variant_id: string;
  quantity: number;
};

export type PlaceOrderResult = {
  order_id: string;
  confirmation_token: string;
  subtotal: number;
  discount_total: number;
  delivery_price: number;
  total: number;
};

export type TrackedOrderItem = {
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price_at_purchase: number;
};

export type TrackedOrder = {
  order_id: string;
  status: string;
  subtotal: number;
  discount_total: number;
  delivery_price: number;
  total: number;
  created_at: string;
  guest_name: string;
  wilaya_code: number | null;
  wilaya_name_ar: string | null;
  wilaya_name_fr: string | null;
  delivery_type: string | null;
  items: TrackedOrderItem[];
};

export async function placeGuestOrder(input: {
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  guest_address: string;
  guest_note?: string;
  payment_method?: string;
  items: OrderItemPayload[];
  idempotency_key?: string;
  wilaya_code: number;
  delivery_type: "home" | "office";
  /** Selected quantity tier. ONLY its id is ever sent - never a price:
      the server reads the tier price from the database. */
  offer_id?: string | null;
}): Promise<PlaceOrderResult> {
  const params: Record<string, unknown> = {
    p_guest_name: input.guest_name,
    p_guest_phone: input.guest_phone,
    p_guest_address: input.guest_address,
    p_guest_email: input.guest_email ?? null,
    p_guest_note: input.guest_note ?? null,
    p_payment_method: input.payment_method ?? "cod",
    p_items: input.items,
    p_idempotency_key: input.idempotency_key ?? null,
    p_wilaya_code: input.wilaya_code,
    p_delivery_type: input.delivery_type,
  };

  // The RPC only knows p_offer_id after migrations 16-18 are applied, so the
  // parameter is sent ONLY when the flag is on and a tier was selected.
  // With the flag off the live site keeps ordering exactly as before.
  if (ENABLE_OFFERS && input.offer_id) {
    params.p_offer_id = input.offer_id;
  }

  const { data, error } = await supabase.rpc("place_guest_order", params);

  if (error) throw new Error(toUserFacingOrderError(error.message));
  return data as PlaceOrderResult;
}

// Maps raw Postgres/RPC errors to text that is safe to show shoppers.
// The regexes deliberately match the English server messages; only the
// returned text is Arabic. Raw error.message is never surfaced to users.
export function toUserFacingOrderError(message: string): string {
  if (/is not available|not found|invalid product variant id/i.test(message)) {
    return ar.errors.itemUnavailable;
  }
  if (/insufficient stock/i.test(message)) {
    return ar.errors.insufficientStock;
  }
  if (/invalid quantity|too many units|too many distinct items/i.test(message)) {
    return ar.errors.invalidQuantity;
  }
  if (/invalid phone number/i.test(message)) {
    return ar.errors.invalidPhone;
  }
  if (/invalid email address/i.test(message)) {
    return ar.errors.invalidEmail;
  }
  if (/unsupported payment method/i.test(message)) {
    return ar.errors.unsupportedPayment;
  }
  if (/wilaya is required|delivery is not available|invalid delivery type/i.test(message)) {
    return ar.errors.invalidWilaya;
  }
  if (/guest name|guest phone|guest address|at least one item/i.test(message)) {
    return ar.errors.missingFields;
  }
  return ar.errors.orderGeneric;
}

export async function getOrderByToken(
  token: string
): Promise<TrackedOrder | null> {
  const { data, error } = await supabase.rpc("get_order_by_token", {
    p_token: token,
  });

  if (error) throw new Error(ar.errors.generic);
  return data as TrackedOrder | null;
}
