import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isValidSlug, parsePageContent, type PageContent } from "./content";

export type PublishedLandingPage = {
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  productName: string | null;
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
  published_content: unknown;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
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
          "slug, published_content, seo_title, seo_description, og_image_url, products(name)"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) return null;
      const row = data as unknown as LandingPageRow;
      return {
        slug: row.slug,
        seoTitle: row.seo_title ?? null,
        seoDescription: row.seo_description ?? null,
        ogImageUrl: row.og_image_url ?? null,
        productName: row.products?.name ?? null,
        content: parsePageContent(row.published_content),
      };
    } catch {
      return null;
    }
  }
);
