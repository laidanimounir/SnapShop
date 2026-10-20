import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isValidSlug, parsePageContent, type PageContent } from "./content";
import { shapeLandingOrderData, type LandingOrderData } from "./order-data";

export type PublishedLandingPage = {
  slug: string;
  productId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  productName: string | null;
  facebookPixelId: string | null;
  tiktokPixelId: string | null;
  content: PageContent;
};

// Cookie-free anon client: using the cookie-aware client would call
// cookies() and force the landing page route to be dynamic, which would
// disable ISR. RLS still guarantees only published rows are readable.
let anonClient: SupabaseClient | null = null;
function publicSupabase(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return anonClient;
}

type LandingPageRow = {
  slug: string;
  product_id: string | null;
  published_content: unknown;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  products: { name?: string | null } | null;
};

// Fetches a landing page by slug, selecting published_content ONLY —
// draft_content never leaves the database on this path. The explicit
// status filter is defence-in-depth on top of the anon RLS policy.
export const getPublishedLandingPage = cache(
  async (slug: unknown): Promise<PublishedLandingPage | null> => {
    if (!isValidSlug(slug)) return null;
    try {
      const { data, error } = await publicSupabase()
        .from("product_landing_pages")
        .select(
          "slug, product_id, published_content, seo_title, seo_description, og_image_url, facebook_pixel_id, tiktok_pixel_id, products(name)"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) return null;
      const row = data as unknown as LandingPageRow;
      return {
        slug: row.slug,
        productId: row.product_id ?? null,
        seoTitle: row.seo_title ?? null,
        seoDescription: row.seo_description ?? null,
        ogImageUrl: row.og_image_url ?? null,
        productName: row.products?.name ?? null,
        facebookPixelId: row.facebook_pixel_id ?? null,
        tiktokPixelId: row.tiktok_pixel_id ?? null,
        content: parsePageContent(row.published_content),
      };
    } catch {
      return null;
    }
  }
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Slug for one product's published landing page (used by the product page
// to redirect). Returns null for non-uuid input so the lookup can never
// throw a Postgres cast error.
export const getPublishedLandingSlugForProduct = cache(
  async (productId: unknown): Promise<string | null> => {
    if (typeof productId !== "string" || !UUID_RE.test(productId)) return null;
    try {
      const { data, error } = await publicSupabase()
        .from("product_landing_pages")
        .select("slug")
        .eq("product_id", productId)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) return null;
      return (data as { slug: string }).slug;
    } catch {
      return null;
    }
  }
);

// Single query returning every published product_id -> slug pair, so
// catalog pages can link cards to landing pages without an N+1 lookup.
export const getPublishedLandingSlugMap = cache(
  async (): Promise<Record<string, string>> => {
    try {
      const { data, error } = await publicSupabase()
        .from("product_landing_pages")
        .select("product_id, slug")
        .eq("status", "published");
      if (error || !data) return {};
      const map: Record<string, string> = {};
      for (const row of data as Array<{ product_id: string; slug: string }>) {
        map[row.product_id] = row.slug;
      }
      return map;
    } catch {
      return {};
    }
  }
);

/**
 * Active variants (color, hex, size, price override, stock), base price,
 * discounts and the active delivery zones for one product — everything
 * the public landing page order form needs, fetched with the same
 * cookie-free anon client so ISR keeps working. Returns null when the
 * product is missing/inactive or any query fails.
 */
export const getLandingOrderData = cache(
  async (productId: unknown): Promise<LandingOrderData | null> => {
    if (typeof productId !== "string" || !UUID_RE.test(productId)) return null;
    try {
      const supabase = publicSupabase();
      const [
        { data: product, error: productError },
        { data: variants, error: variantsError },
        { data: zones, error: zonesError },
      ] = await Promise.all([
          supabase
            .from("products")
            .select(
              "id, name, base_price, discount_percentage, discount_amount, size_type"
            )
            .eq("id", productId)
            .eq("is_active", true)
            .maybeSingle(),
          supabase
            .from("product_variants")
            .select("id, color, color_hex, size, price, stock_quantity, is_active")
            .eq("product_id", productId)
            .eq("is_active", true),
          supabase
            .from("delivery_zones")
            .select(
              "wilaya_code, name_ar, name_fr, home_price, office_price, is_active"
            )
            .eq("is_active", true)
            .order("wilaya_code", { ascending: true }),
        ]);
      if (productError || variantsError || zonesError) return null;
      return shapeLandingOrderData(
        product as Record<string, unknown> | null,
        (variants ?? []) as Array<Record<string, unknown>>,
        (zones ?? []) as Array<Record<string, unknown>>
      );
    } catch {
      return null;
    }
  }
);
