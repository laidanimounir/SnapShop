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
}): Promise<PlaceOrderResult> {
  const { data, error } = await supabase.rpc("place_guest_order", {
    p_guest_name: input.guest_name,
    p_guest_phone: input.guest_phone,
    p_guest_address: input.guest_address,
    p_guest_email: input.guest_email ?? null,
    p_payment_method: input.payment_method ?? "cod",
    p_items: input.items,
  });

  if (error) throw new Error(error.message);
  return data as PlaceOrderResult;
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
