import { requireAdmin } from "@/lib/supabase/admin";
import { storagePathFromPublicUrl } from "@/lib/admin/product-validation";

export type AdminOrder = {
  id: string;
  guest_name: string;
  guest_phone: string;
  status: string;
  total: number;
  delivery_price: number;
  wilaya_code: number | null;
  delivery_type: string;
  created_at: string;
};

export type AdminOrderFilters = {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  wilaya?: number;
  page?: number;
  pageSize?: number;
};

export type AdminOrderListResult = {
  orders: AdminOrder[];
  total: number;
  counts: Record<string, number>;
};

const ORDER_STATUS_KEYS = [
  "pending",
  "confirmed",
  "no_answer",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

function applyOrderFilters(query: any, filters: AdminOrderFilters): any {
  let q = query;
  const search = filters.q?.trim();
  if (search) {
    const safe = search.replace(/[,()%\\]/g, "").slice(0, 60);
    if (safe) {
      q = q.or(`guest_name.ilike.%${safe}%,guest_phone.ilike.%${safe}%`);
    }
  }
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    q = q.gte("created_at", `${filters.from}T00:00:00`);
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    q = q.lte("created_at", `${filters.to}T23:59:59.999`);
  }
  if (
    typeof filters.wilaya === "number" &&
    filters.wilaya >= 1 &&
    filters.wilaya <= 58
  ) {
    q = q.eq("wilaya_code", filters.wilaya);
  }
  return q;
}

export async function getOrders(
  filters: AdminOrderFilters = {}
): Promise<AdminOrderListResult> {
  const { supabase } = await requireAdmin();
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * pageSize;

  let query: any = supabase
    .from("orders")
    .select(
      "id, guest_name, guest_phone, status, total, delivery_price, wilaya_code, delivery_type, created_at"
    );
  query = applyOrderFilters(query, filters);
  if (filters.status && ORDER_STATUS_KEYS.includes(filters.status as any)) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (error) throw new Error(error.message);

  const countFor = async (status?: string): Promise<number> => {
    let q: any = supabase
      .from("orders")
      .select("id", { count: "exact", head: true });
    q = applyOrderFilters(q, filters);
    if (status) q = q.eq("status", status);
    const { count, error: countError } = await q;
    if (countError) throw new Error(countError.message);
    return count ?? 0;
  };

  const [total, ...statusCounts] = await Promise.all([
    countFor(),
    ...ORDER_STATUS_KEYS.map((s) => countFor(s)),
  ]);

  const counts: Record<string, number> = {};
  ORDER_STATUS_KEYS.forEach((s, i) => {
    counts[s] = statusCounts[i];
  });

  return {
    orders: (data ?? []) as AdminOrder[],
    total,
    counts,
  };
}

export type AdminOrderItem = {
  id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price_at_purchase: number;
};

export type AdminOrderHistoryEntry = {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  note: string | null;
  changed_at: string;
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
  delivery_price: number;
  total: number;
  wilaya_code: number | null;
  delivery_type: string;
  wilaya_name_ar: string | null;
  wilaya_name_fr: string | null;
  admin_note: string | null;
  status_updated_at: string;
  confirmation_token: string;
  created_at: string;
  items: AdminOrderItem[];
  history: AdminOrderHistoryEntry[];
};

export async function getOrderById(id: string): Promise<AdminOrderDetail | null> {
  const { supabase } = await requireAdmin();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, guest_name, guest_phone, guest_email, guest_address, status, payment_method, subtotal, discount_total, delivery_price, total, wilaya_code, delivery_type, admin_note, status_updated_at, confirmation_token, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, product_name, color, size, quantity, unit_price_at_purchase")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_status_history")
      .select("id, old_status, new_status, changed_by, note, changed_at")
      .eq("order_id", id)
      .order("changed_at", { ascending: true }),
  ]);

  let wilaya_name_ar: string | null = null;
  let wilaya_name_fr: string | null = null;
  const wilayaCode = (order as { wilaya_code: number | null }).wilaya_code;
  if (wilayaCode != null) {
    const { data: zone } = await supabase
      .from("delivery_zones")
      .select("name_ar, name_fr")
      .eq("wilaya_code", wilayaCode)
      .maybeSingle();
    if (zone) {
      wilaya_name_ar = (zone as { name_ar: string }).name_ar;
      wilaya_name_fr = (zone as { name_fr: string }).name_fr;
    }
  }

  return {
    ...(order as Omit<AdminOrderDetail, "items" | "history" | "wilaya_name_ar" | "wilaya_name_fr">),
    wilaya_name_ar,
    wilaya_name_fr,
    items: (items ?? []) as AdminOrderItem[],
    history: (history ?? []) as AdminOrderHistoryEntry[],
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
  total_stock: number;
  thumbnail_url: string | null;
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { supabase } = await requireAdmin();
  const [{ data: products }, { data: variants }, { data: images }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, category, base_price, is_active, rating")
        .order("created_at", { ascending: false }),
      supabase.from("product_variants").select("product_id, stock_quantity"),
      supabase
        .from("product_images")
        .select("product_id, url, is_primary, position")
        .order("position", { ascending: true }),
    ]);

  const countMap = new Map<string, number>();
  const stockMap = new Map<string, number>();
  ((variants ?? []) as { product_id: string; stock_quantity: number }[]).forEach(
    (v) => {
      countMap.set(v.product_id, (countMap.get(v.product_id) ?? 0) + 1);
      stockMap.set(
        v.product_id,
        (stockMap.get(v.product_id) ?? 0) + (v.stock_quantity ?? 0)
      );
    }
  );

  const thumbMap = new Map<string, string>();
  ((images ?? []) as {
    product_id: string;
    url: string;
    is_primary: boolean;
  }[]).forEach((img) => {
    if (!thumbMap.has(img.product_id) || img.is_primary) {
      thumbMap.set(img.product_id, img.url);
    }
  });

  return ((products ?? []) as AdminProduct[]).map((p) => ({
    ...p,
    variant_count: countMap.get(p.id) ?? 0,
    total_stock: stockMap.get(p.id) ?? 0,
    thumbnail_url: thumbMap.get(p.id) ?? null,
  }));
}

export type AdminVariant = {
  id: string;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  stock_quantity: number;
  sku: string | null;
  price: number | null;
  is_active: boolean;
};

export type AdminImage = {
  id: string;
  url: string;
  position: number;
  is_primary: boolean;
  color: string | null;
};

export type SizeType = "none" | "clothing" | "shoes" | "custom";

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
  size_type: SizeType;
  variants: AdminVariant[];
  images: AdminImage[];
};

export async function getAdminProductById(
  id: string
): Promise<AdminProductDetail | null> {
  const { supabase } = await requireAdmin();
  const { data: product, error } = await supabase
    .from("products")
    .select(
      "id, name, description, category, brand, base_price, discount_percentage, discount_amount, rating, is_active, size_type"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!product) return null;

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, color, color_hex, size, stock_quantity, sku, price, is_active")
      .eq("product_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("product_images")
      .select("id, url, position, is_primary, color")
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

export type ProductWriteInput = {
  name: string;
  description: string;
  category?: string | null;
  brand?: string | null;
  base_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  is_active?: boolean;
  size_type?: SizeType;
};

export type VariantWriteRow = {
  color: string | null;
  color_hex: string | null;
  size: string | null;
  stock_quantity: number;
  price?: number | null;
  sku?: string | null;
  is_active?: boolean;
};

export type SaveVariantsResult = {
  created: number;
  deleted: number;
  deactivated: number;
  updated: number;
};

/** Create a product (draft-inactive unless is_active is passed). */
export async function createProduct(input: ProductWriteInput): Promise<{ id: string }> {
  const { supabase } = await requireAdmin();
  const {
    name,
    description,
    category = null,
    brand = null,
    base_price,
    discount_percentage = 0,
    discount_amount = 0,
    is_active = false,
    size_type = "none",
  } = input;
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      description,
      category,
      brand,
      base_price,
      discount_percentage,
      discount_amount,
      is_active,
      size_type,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function updateProduct(
  id: string,
  input: Partial<ProductWriteInput>
): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw error;
}

/**
 * Reconcile a product's variants with the desired matrix.
 * - Missing combinations are inserted.
 * - Removed combinations never ordered are deleted.
 * - Removed combinations referenced by order_items are deactivated
 *   (is_active = false) with stock zeroed — order history stays intact.
 * - Rows that still exist get stock/price/sku/is_active updated.
 */
export async function saveVariants(
  productId: string,
  rows: VariantWriteRow[]
): Promise<SaveVariantsResult> {
  const { supabase } = await requireAdmin();

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id, color, size")
    .eq("product_id", productId);

  const existingIds = ((existing ?? []) as { id: string }[]).map((v) => v.id);
  let orderedIds = new Set<string>();
  if (existingIds.length > 0) {
    const { data: refs } = await supabase
      .from("order_items")
      .select("product_variant_id")
      .in("product_variant_id", existingIds);
    orderedIds = new Set(
      ((refs ?? []) as { product_variant_id: string | null }[])
        .map((r) => r.product_variant_id)
        .filter((x): x is string => x != null)
    );
  }

  const keyOf = (c: string | null, s: string | null) => `${c ?? ""}\n${s ?? ""}`;
  const wanted = new Map(rows.map((r) => [keyOf(r.color, r.size), r]));

  const list = ((existing ?? []) as { id: string; color: string | null; size: string | null }[]);
  const toCreate = rows.filter(
    (r) => !list.some((e) => keyOf(e.color, e.size) === keyOf(r.color, r.size))
  );
  const toRemove = list.filter((e) => !wanted.has(keyOf(e.color, e.size)));

  let created = 0;
  let deleted = 0;
  let deactivated = 0;
  let updated = 0;

  for (const row of toCreate) {
    const { error } = await supabase.from("product_variants").insert({
      product_id: productId,
      color: row.color,
      color_hex: row.color_hex,
      size: row.size,
      stock_quantity: row.stock_quantity,
      price: row.price ?? null,
      sku: row.sku?.trim() ? row.sku.trim() : null,
      is_active: row.is_active ?? true,
    });
    if (error) throw error;
    created += 1;
  }

  for (const old of toRemove) {
    if (orderedIds.has(old.id)) {
      const { error } = await supabase
        .from("product_variants")
        .update({ is_active: false, stock_quantity: 0 })
        .eq("id", old.id);
      if (error) throw error;
      deactivated += 1;
    } else {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", old.id);
      if (error) throw error;
      deleted += 1;
    }
  }

  for (const row of rows) {
    const match = list.find(
      (e) => keyOf(e.color, e.size) === keyOf(row.color, row.size)
    );
    if (!match || toRemove.some((r) => r.id === match.id)) continue;
    const { error } = await supabase
      .from("product_variants")
      .update({
        stock_quantity: row.stock_quantity,
        price: row.price ?? null,
        sku: row.sku?.trim() ? row.sku.trim() : null,
        is_active: row.is_active ?? true,
        ...(row.color_hex !== undefined ? { color_hex: row.color_hex } : {}),
      })
      .eq("id", match.id);
    if (error) throw error;
    updated += 1;
  }

  return { created, deleted, deactivated, updated };
}

export type DeleteProductResult = { deleted: boolean; deactivated: boolean };

/**
 * Delete a product, or deactivate it when it has order history.
 * On hard delete, storage objects under products/<id>/ are removed too.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);
    if (error) throw error;
    return { deleted: false, deactivated: true };
  }

  const { data: objects } = await supabase.storage
    .from("product-images")
    .list(`products/${id}`);
  if (objects && objects.length > 0) {
    const paths = objects.map((o) => `products/${id}/${o.name}`);
    const { error } = await supabase.storage.from("product-images").remove(paths);
    if (error) throw error;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return { deleted: true, deactivated: false };
}

export async function deleteProductImage(imageId: string): Promise<{ productId: string }> {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("product_images")
    .select("id, product_id, url, position, is_primary")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) throw new Error("Image not found.");

  const path = storagePathFromPublicUrl((row as { url: string }).url);
  if (path) {
    const { error } = await supabase.storage.from("product-images").remove([path]);
    if (error) throw new Error(error.message);
  }

  const { error: delError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (delError) throw delError;

  if ((row as { is_primary: boolean }).is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", (row as { product_id: string }).product_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", (next as { id: string }).id);
    }
  }

  return { productId: (row as { product_id: string }).product_id };
}

export async function setPrimaryImage(imageId: string): Promise<void> {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("product_images")
    .select("id, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row) throw new Error("Image not found.");
  const productId = (row as { product_id: string }).product_id;

  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (error) throw error;
}

export async function reorderProductImages(
  productId: string,
  orderedIds: string[]
): Promise<void> {
  const { supabase } = await requireAdmin();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const { error } = await supabase
      .from("product_images")
      .update({ position: i })
      .eq("id", orderedIds[i])
      .eq("product_id", productId);
    if (error) throw error;
  }
}

export async function setImageColor(
  imageId: string,
  color: string | null
): Promise<void> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("product_images")
    .update({ color })
    .eq("id", imageId);
  if (error) throw error;
}

export type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  pendingReviews: number;
  statusCounts: Record<string, number>;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await requireAdmin();
  const statuses = [
    "pending",
    "confirmed",
    "no_answer",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ] as const;

  const [
    { count: totalOrders },
    { count: totalProducts },
    { count: pendingReviews },
    ...statusResults
  ] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
    ...statuses.map((s) =>
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", s)
    ),
  ]);

  const statusCounts: Record<string, number> = {};
  statuses.forEach((s, i) => {
    statusCounts[s] = statusResults[i].count ?? 0;
  });

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: statusCounts.pending ?? 0,
    totalProducts: totalProducts ?? 0,
    pendingReviews: pendingReviews ?? 0,
    statusCounts,
  };
}

// ------------------------------------------------------------
// Delivery zones (admin)
// ------------------------------------------------------------

export type AdminDeliveryZone = {
  wilaya_code: number;
  name_ar: string;
  name_fr: string;
  home_price: number;
  office_price: number;
  is_active: boolean;
};

export type DeliveryZoneUpdate = {
  wilaya_code: number;
  home_price: number;
  office_price: number;
  is_active: boolean;
};

export async function getDeliveryZonesAdmin(): Promise<AdminDeliveryZone[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("wilaya_code, name_ar, name_fr, home_price, office_price, is_active")
    .order("wilaya_code", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminDeliveryZone[];
}

export async function updateDeliveryZones(
  rows: DeliveryZoneUpdate[]
): Promise<void> {
  const { supabase } = await requireAdmin();
  const payload = rows.map((row) => ({
    ...row,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("delivery_zones")
    .upsert(payload, { onConflict: "wilaya_code" });
  if (error) throw error;
}
