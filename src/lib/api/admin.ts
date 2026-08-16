import { createAdminClient } from "@/lib/supabase/admin";

export type AdminOrder = {
  id: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  total: number;
  created_at: string;
};

export async function getOrders(): Promise<AdminOrder[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, guest_name, guest_phone, status, total, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AdminOrder[];
}

export type AdminOrderItem = {
  id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price_at_purchase: number;
};

export type AdminOrderDetail = {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  guest_address: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount_total: number;
  total: number;
  confirmation_token: string;
  created_at: string;
  items: AdminOrderItem[];
};

export async function getOrderById(id: string): Promise<AdminOrderDetail | null> {
  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, color, size, quantity, unit_price_at_purchase")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  return {
    ...(order as AdminOrderDetail),
    items: (items ?? []) as AdminOrderItem[],
  };
}

export type AdminProduct = {
  id: string;
  name: string;
  category: string | null;
  base_price: number;
  is_active: boolean;
  rating: number;
  variant_count: number;
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = createAdminClient();
  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, base_price, is_active, rating")
      .order("created_at", { ascending: false }),
    supabase.from("product_variants").select("product_id"),
  ]);

  const countMap = new Map<string, number>();
  (variants ?? []).forEach((v: { product_id: string }) =>
    countMap.set(v.product_id, (countMap.get(v.product_id) ?? 0) + 1)
  );

  return ((products ?? []) as AdminProduct[]).map((p) => ({
    ...p,
    variant_count: countMap.get(p.id) ?? 0,
  }));
}
