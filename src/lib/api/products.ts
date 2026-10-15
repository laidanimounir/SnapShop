import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/search";
import type { Product, ProductImage, ProductVariant } from "@/types/product.types";
import type { Review } from "@/types/review.types";

export type ProductFilters = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "most-popular" | "low-price" | "high-price" | "newest";
  page?: number;
  pageSize?: number;
};

export type ProductPage = {
  products: Product[];
  total: number;
};

async function attachVariantsAndImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return [];

  const supabase = createServerSupabase();
  const ids = products.map((p) => p.id);

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, product_id, color, color_hex, size, price, stock_quantity, sku")
      .in("product_id", ids),
    supabase
      .from("product_images")
      .select("id, product_id, url, alt_text, position, is_primary")
      .in("product_id", ids)
      .order("position", { ascending: true }),
  ]);

  return products.map((p) => ({
    ...p,
    images: ((images ?? []) as ProductImage[]).filter((i) => i.product_id === p.id),
    variants: ((variants ?? []) as ProductVariant[]).filter(
      (v) => v.product_id === p.id
    ),
  }));
}

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductPage> {
  const supabase = createServerSupabase();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 9;

  let query: any = supabase
    .from("products")
    .select(
      "id, name, description, category, brand, base_price, discount_percentage, discount_amount, rating, is_active, created_at",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.brand) query = query.eq("brand", filters.brand);
  if (filters.minPrice != null) query = query.gte("base_price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("base_price", filters.maxPrice);

  if (filters.search) {
    const q = sanitizeSearchTerm(filters.search);
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (filters.color || filters.size) {
    let vq: any = supabase.from("product_variants").select("product_id");
    if (filters.color) vq = vq.eq("color", filters.color);
    if (filters.size) vq = vq.eq("size", filters.size);
    const { data: matching } = await vq;
    const ids = Array.from(
      new Set((matching ?? []).map((m: any) => m.product_id))
    ) as string[];
    if (ids.length === 0) return { products: [], total: 0 };
    query = query.in("id", ids);
  }

  switch (filters.sort) {
    case "low-price":
      query = query.order("base_price", { ascending: true });
      break;
    case "high-price":
      query = query.order("base_price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "most-popular":
    default:
      query = query.order("rating", { ascending: false });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const products = await attachVariantsAndImages((data ?? []) as Product[]);
  return { products, total: count ?? 0 };
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, description, category, brand, base_price, discount_percentage, discount_amount, rating, is_active, created_at"
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [product] = await attachVariantsAndImages([data as Product]);
  return product ?? null;
}

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, product_id, reviewer_name, rating, comment, is_approved, created_at"
    )
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, product_id, reviewer_name, rating, comment, is_approved, created_at"
    )
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Review[];
}
