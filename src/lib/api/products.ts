import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/search";
import { isValidUuid } from "@/lib/uuid";
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

export type ProductFacetColor = { name: string; hex: string };

export type ProductFacet = {
  categories: string[];
  colors: ProductFacetColor[];
  sizes: string[];
  maxPrice: number;
};

const DEFAULT_MAX_PRICE = 500;

function sortSizeValues(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const aNum = a.trim() !== "" && !Number.isNaN(Number(a));
    const bNum = b.trim() !== "" && !Number.isNaN(Number(b));
    if (aNum && bNum) return Number(a) - Number(b);
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Distinct filter values for the storefront, derived from active products and
 * their active variants. Values are returned exactly as stored (never
 * translated or normalized). Uses explicit column lists — never select("*").
 */
export async function getProductFacets(): Promise<ProductFacet> {
  const supabase = createServerSupabase();

  const [{ data: products }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("category, base_price")
      .eq("is_active", true),
    supabase
      .from("product_variants")
      .select("color, color_hex, size, products!inner(is_active)")
      .eq("is_active", true)
      .eq("products.is_active", true),
  ]);

  const productRows = (products ?? []) as Array<{
    category?: string | null;
    base_price?: number | null;
  }>;
  const variantRows = (variants ?? []) as Array<{
    color?: string | null;
    color_hex?: string | null;
    size?: string | null;
  }>;

  const categories = Array.from(
    new Set(
      productRows
        .map((p) => p.category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  ).sort((a, b) => a.localeCompare(b, "ar"));

  const colorMap = new Map<string, string>();
  for (const v of variantRows) {
    const name = v.color?.trim();
    if (!name) continue;
    if (!colorMap.has(name)) colorMap.set(name, v.color_hex?.trim() || "");
  }
  const colors = Array.from(colorMap.entries())
    .map(([name, hex]) => ({ name, hex }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const sizes = sortSizeValues(
    Array.from(
      new Set(
        variantRows
          .map((v) => v.size?.trim())
          .filter((s): s is string => Boolean(s))
      )
    )
  );

  const maxBase = productRows.reduce(
    (max, p) => Math.max(max, Number(p.base_price) || 0),
    0
  );
  const maxPrice = maxBase > 0 ? Math.ceil(maxBase / 5) * 5 : DEFAULT_MAX_PRICE;

  return { categories, colors, sizes, maxPrice };
}

async function attachVariantsAndImages(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return [];

  const supabase = createServerSupabase();
  const ids = products.map((p) => p.id);

  const [{ data: variants }, { data: images }] = await Promise.all([
    supabase
      .from("product_variants")
      .select(
        "id, product_id, color, color_hex, size, price, stock_quantity, sku, is_active"
      )
      .in("product_id", ids)
      .eq("is_active", true),
    supabase
      .from("product_images")
      .select("id, product_id, url, alt_text, position, is_primary, color")
      .in("product_id", ids)
      .order("position", { ascending: true }),
  ]);

  return products.map((p) => ({
    ...p,
    images: ((images ?? []) as ProductImage[]).filter((i) => i.product_id === p.id),
    // Storefront only ever sees active variants.
    variants: ((variants ?? []) as ProductVariant[]).filter(
      (v) => v.product_id === p.id && v.is_active
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
      "id, name, description, category, brand, base_price, discount_percentage, discount_amount, rating, is_active, size_type, created_at",
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
    // Only active variants of active products count for filtering.
    let vq: any = supabase
      .from("product_variants")
      .select("product_id, products!inner(is_active)")
      .eq("is_active", true)
      .eq("products.is_active", true);
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
  if (error) throw new Error(error.message);

  const products = await attachVariantsAndImages((data ?? []) as Product[]);
  return { products, total: count ?? 0 };
}

// cache(): generateMetadata and the page both ask for the same product in
// one request, so the query (plus its variant/image queries) runs once.
export const getProductById = cache(
  async (id: string): Promise<Product | null> => {
    // A non-uuid id makes Postgres throw a cast error (HTTP 500 on the page).
    // Treat it as "not found" instead.
    if (!isValidUuid(id)) return null;
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, description, category, brand, base_price, discount_percentage, discount_amount, rating, is_active, size_type, created_at"
      )
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const [product] = await attachVariantsAndImages([data as Product]);
    return product ?? null;
  }
);

export async function getApprovedReviews(productId: string): Promise<Review[]> {
  if (!isValidUuid(productId)) return [];
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, product_id, reviewer_name, rating, comment, is_approved, created_at"
    )
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
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

  if (error) throw new Error(error.message);
  return (data ?? []) as Review[];
}
