import { supabase } from "@/lib/supabase/client";

export type OrderItemPayload = {
  variant_id: string;
  quantity: number;
};

export type PlaceOrderResult = {
  order_id: string;
  confirmation_token: string;
  subtotal: number;
  discount_total: number;
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
  total: number;
  created_at: string;
  guest_name: string;
  items: TrackedOrderItem[];
};

export async function placeGuestOrder(input: {
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  guest_address: string;
  payment_method?: string;
  items: OrderItemPayload[];
  idempotency_key?: string;
}): Promise<PlaceOrderResult> {
  const { data, error } = await supabase.rpc("place_guest_order", {
    p_guest_name: input.guest_name,
    p_guest_phone: input.guest_phone,
    p_guest_address: input.guest_address,
    p_guest_email: input.guest_email ?? null,
    p_payment_method: input.payment_method ?? "cod",
    p_items: input.items,
    p_idempotency_key: input.idempotency_key ?? null,
  });

  if (error) throw new Error(toUserFacingOrderError(error.message));
  return data as PlaceOrderResult;
}

// Maps raw Postgres/RPC errors to text that is safe to show shoppers.
export function toUserFacingOrderError(message: string): string {
  if (/is not available|not found/i.test(message)) {
    return "Sorry, one of the items in your order is no longer available. Please review your cart and try again.";
  }
  if (/insufficient stock/i.test(message)) {
    return "Sorry, there is not enough stock for one of your items. Please adjust the quantities and try again.";
  }
  if (/invalid quantity|too many units|too many distinct items/i.test(message)) {
    return "Please check your quantities (max 10 per item, max 100 units per order) and try again.";
  }
  if (/invalid phone number/i.test(message)) {
    return "Please enter a valid phone number (6-15 digits).";
  }
  if (/invalid email address/i.test(message)) {
    return "Please enter a valid email address.";
  }
  if (/unsupported payment method/i.test(message)) {
    return "Cash on delivery is the only payment method available right now.";
  }
  if (/guest name|guest phone|guest address|at least one item/i.test(message)) {
    return "Please fill in your name, phone number, and address before placing the order.";
  }
  return "Something went wrong placing your order. Please try again.";
}

export async function getOrderByToken(
  token: string
): Promise<TrackedOrder | null> {
  const { data, error } = await supabase.rpc("get_order_by_token", {
    p_token: token,
  });

  if (error) throw new Error(error.message);
  return data as TrackedOrder | null;
}
