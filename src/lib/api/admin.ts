import { requireAdmin } from "@/lib/supabase/admin";

export type AdminOrder = {
  id: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  total: number;
  created_at: string;
};

export async function getOrders(): Promise<AdminOrder[]> {
  const { supabase } = await requireAdmin();
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
  const { supabase } = await requireAdmin();
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
  const { supabase } = await requireAdmin();
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

export type AdminVariant = {
  id: string;
  color: string;
  size: string;
  stock_quantity: number;
  sku: string | null;
  price: number | null;
};

export type AdminImage = {
  id: string;
  url: string;
  position: number;
  is_primary: boolean;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  brand: string | null;
  base_price: number;
  discount_percentage: number;
  discount_amount: number;
  rating: number;
  is_active: boolean;
  variants: AdminVariant[];
  images: AdminImage[];
};

export async function getAdminProductById(
  id: string
): Promise<AdminProductDetail | null> {
  const { supabase } = await requireAdmin();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, color, size, stock_quantity, sku, price")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("product_images")
      .select("id, url, position, is_primary")
      .eq("product_id", id)
      .order("position", { ascending: true }),
  ]);

  return {
    ...(product as AdminProductDetail),
    variants: (variants ?? []) as AdminVariant[],
    images: (images ?? []) as AdminImage[],
  };
}

export type AdminReview = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  product_name: string;
};

export async function getAdminReviews(
  filter?: "pending" | "approved"
): Promise<AdminReview[]> {
  const { supabase } = await requireAdmin();
  let query: any = supabase
    .from("reviews")
    .select("id, product_id, reviewer_name, rating, comment, is_approved, created_at, products(name)")
    .order("created_at", { ascending: false });

  if (filter === "pending") query = query.eq("is_approved", false);
  if (filter === "approved") query = query.eq("is_approved", true);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    product_id: r.product_id,
    reviewer_name: r.reviewer_name,
    rating: r.rating,
    comment: r.comment,
    is_approved: r.is_approved,
    created_at: r.created_at,
    product_name: r.products?.name ?? "-",
  }));
}

export type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  pendingReviews: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await requireAdmin();
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalProducts },
    { count: pendingReviews },
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
  ]);

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalProducts: totalProducts ?? 0,
    pendingReviews: pendingReviews ?? 0,
  };
}
