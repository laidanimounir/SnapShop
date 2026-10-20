// Admin data access for product landing pages. Every read goes through
// requireAdmin() (service role) because drafts and unpublished rows are
// invisible to anon via RLS; writes live in the server actions.

import { requireAdmin } from "@/lib/supabase/admin";

export type LandingPageStatus = "draft" | "published" | "unpublished";

export type AdminLandingPage = {
  id: string;
  product_id: string;
  slug: string;
  status: LandingPageStatus;
  draft_content: unknown;
  published_content: unknown;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminLandingProduct = {
  id: string;
  name: string;
  category: string | null;
  base_price: number;
  is_active: boolean;
};

// One row per product, with its landing page (if any) attached, so the
// list can show "none / draft / published" for every product at once.
export type AdminLandingRow = {
  product: AdminLandingProduct;
  page: {
    id: string;
    slug: string;
    status: LandingPageStatus;
    published_at: string | null;
    updated_at: string;
  } | null;
};

export type AdminLandingEditorData = {
  product: AdminLandingProduct;
  imageUrls: string[];
  page: AdminLandingPage | null;
};

const PAGE_COLUMNS =
  "id, product_id, slug, status, draft_content, published_content, seo_title, seo_description, og_image_url, facebook_pixel_id, tiktok_pixel_id, published_at, created_at, updated_at";

export async function getAdminLandingPages(): Promise<AdminLandingRow[]> {
  const { supabase } = await requireAdmin();

  const [productsResult, pagesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, base_price, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("product_landing_pages")
      .select("id, product_id, slug, status, published_at, updated_at"),
  ]);

  if (productsResult.error) throw new Error(productsResult.error.message);
  if (pagesResult.error) throw new Error(pagesResult.error.message);

  const pageMap = new Map<string, AdminLandingRow["page"]>();
  (
    (pagesResult.data ?? []) as {
      id: string;
      product_id: string;
      slug: string;
      status: LandingPageStatus;
      published_at: string | null;
      updated_at: string;
    }[]
  ).forEach((row) => {
    pageMap.set(row.product_id, {
      id: row.id,
      slug: row.slug,
      status: row.status,
      published_at: row.published_at,
      updated_at: row.updated_at,
    });
  });

  return (
    (productsResult.data ?? []) as (AdminLandingProduct & {
      created_at: string;
    })[]
  ).map((row) => ({
    product: {
      id: row.id,
      name: row.name,
      category: row.category,
      base_price: row.base_price,
      is_active: row.is_active,
    },
    page: pageMap.get(row.id) ?? null,
  }));
}

// Everything the editor needs for one product: the product itself, its
// existing image URLs (used to prefill new image sections) and the
// landing page row, or null when the page has not been created yet.
export async function getLandingPageForProduct(
  productId: string
): Promise<AdminLandingEditorData | null> {
  const { supabase } = await requireAdmin();

  const [productResult, pageResult, imagesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, base_price, is_active")
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("product_landing_pages")
      .select(PAGE_COLUMNS)
      .eq("product_id", productId)
      .maybeSingle(),
    supabase
      .from("product_images")
      .select("url, position")
      .eq("product_id", productId)
      .order("position", { ascending: true }),
  ]);

  if (productResult.error) throw new Error(productResult.error.message);
  if (pageResult.error) throw new Error(pageResult.error.message);
  if (imagesResult.error) throw new Error(imagesResult.error.message);
  if (!productResult.data) return null;

  const imageUrls = ((imagesResult.data ?? []) as { url: string }[]).map(
    (row) => row.url
  );

  return {
    product: productResult.data as AdminLandingProduct,
    imageUrls,
    page: (pageResult.data as AdminLandingPage | null) ?? null,
  };
}

// Slugs currently in use, for the "suggest a free slug" flow. Small table
// (one row per product), so a single select is fine.
export async function listTakenSlugs(): Promise<string[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("product_landing_pages")
    .select("slug");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { slug: string }[]).map((row) => row.slug);
}

// ------------------------------------------------------------
// Templates
// ------------------------------------------------------------

export type AdminTemplate = {
  id: string;
  name: string;
  description: string | null;
  content: unknown;
  created_at: string;
  updated_at: string;
};

export type AdminTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const TEMPLATE_COLUMNS =
  "id, name, description, content, created_at, updated_at";

// Newest first, so the editor and the management page both show the most
// recent templates at the top.
export async function listTemplates(): Promise<AdminTemplateSummary[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("landing_page_templates")
    .select("id, name, description, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminTemplateSummary[];
}

export async function getTemplate(
  id: string
): Promise<AdminTemplate | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("landing_page_templates")
    .select(TEMPLATE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AdminTemplate | null) ?? null;
}

// All template names (for the client-side duplicate pre-check before the
// unique index rejects the write).
export async function listTemplateNames(): Promise<string[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("landing_page_templates")
    .select("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as { name: string }[]).map((row) => row.name);
}

// Copies another product's current draft content straight from the DB
// (used by the editor's "copy from another product" action).
export async function getDraftContentForProduct(
  productId: string
): Promise<{ content: unknown; productName: string } | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("product_landing_pages")
    .select("draft_content, products(name)")
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as {
    draft_content: unknown;
    products: { name: string } | { name: string }[] | null;
  };
  const product = Array.isArray(row.products)
    ? row.products[0] ?? null
    : row.products;
  return { content: row.draft_content, productName: product?.name ?? "" };
}

// Products that already have a landing page, for the "copy from another
// product" searchable list.
export async function listPagesForCopy(): Promise<
  { productId: string; productName: string; slug: string; updatedAt: string }[]
> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("product_landing_pages")
    .select("product_id, slug, updated_at, products(name)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (
    (data ?? []) as {
      product_id: string;
      slug: string;
      updated_at: string;
      products: { name: string } | { name: string }[] | null;
    }[]
  ).map((row) => {
    const product = Array.isArray(row.products)
      ? row.products[0] ?? null
      : row.products;
    return {
      productId: row.product_id,
      productName: product?.name ?? "",
      slug: row.slug,
      updatedAt: row.updated_at,
    };
  });
}
