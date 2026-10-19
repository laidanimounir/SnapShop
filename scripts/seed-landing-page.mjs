// Dev-only seeder for product landing pages.
//
// Creates (or updates) one PUBLISHED landing page for a product so the
// storefront route /p/{slug} can be tried locally before the Stage 2 admin
// editor exists. It writes the same valid sample content to both
// draft_content and published_content.
//
// Usage:
//   node --env-file=.env.local scripts/seed-landing-page.mjs [slug] [--product-id=UUID] [--dry-run]
//
//   slug          defaults to "demo-offer" (ignored for products that
//                 already have a landing page: their slug is kept)
//   --product-id  target a specific product instead of the newest active one
//   --dry-run     print the plan without touching the database
//
// Safety: refuses to run when NODE_ENV=production unless ALLOW_PROD_SEED=1.
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
// environment; never prints keys.

import { createClient } from "@supabase/supabase-js";
import { buildSampleContent, DEFAULT_SLUG } from "./sample-content.mjs";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const productId = args.find((a) => a.startsWith("--product-id="))?.split("=")[1];
const slug = args.find((a) => !a.startsWith("--")) ?? DEFAULT_SLUG;

function fail(message) {
  console.error(`خطأ: ${message}`);
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_PROD_SEED !== "1"
) {
  fail(
    "refusing to seed while NODE_ENV=production (set ALLOW_PROD_SEED=1 to override)"
  );
}

if (slug.length < 3 || slug.length > 80 || !SLUG_RE.test(slug)) {
  fail(`"${slug}" is not a valid slug (lowercase letters, digits, single dashes)`);
}

if (dryRun) {
  const sample = buildSampleContent({
    name: "منتج تجريبي",
    price: 2500,
    images: [],
  });
  console.log("dry-run: no database connection, nothing written.");
  console.log(`slug:     ${slug}`);
  console.log(`sections: ${sample.sections.map((s) => s.type).join(", ")}`);
  console.log(`count:    ${sample.sections.length}`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  fail("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const host = new URL(url).host;
console.log(`project: ${host}`);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let productQuery = supabase
  .from("products")
  .select("id, name, base_price")
  .eq("is_active", true);
productQuery = productId
  ? productQuery.eq("id", productId)
  : productQuery.order("created_at", { ascending: false });

const { data: product, error: productError } = await productQuery
  .limit(1)
  .maybeSingle();

if (productError) fail(`could not read products: ${productError.message}`);
if (!product) {
  fail(
    productId
      ? `no active product with id ${productId}`
      : "no active product found to attach a landing page to"
  );
}

const { data: images, error: imagesError } = await supabase
  .from("product_images")
  .select("url, alt_text, position")
  .eq("product_id", product.id)
  .order("position", { ascending: true });

if (imagesError) fail(`could not read product images: ${imagesError.message}`);

const { data: existing, error: existingError } = await supabase
  .from("product_landing_pages")
  .select("id, slug, published_at")
  .eq("product_id", product.id)
  .maybeSingle();

if (existingError) fail(`could not read landing page: ${existingError.message}`);

const finalSlug = existing ? existing.slug : slug;
const content = buildSampleContent({
  name: product.name,
  price: product.base_price,
  images: (images ?? []).map((img) => ({ url: img.url, alt: img.alt_text })),
});
const now = new Date().toISOString();

const { error: writeError } = await supabase
  .from("product_landing_pages")
  .upsert(
    {
      product_id: product.id,
      slug: finalSlug,
      status: "published",
      draft_content: content,
      published_content: content,
      seo_title: `${product.name} — الدفع عند الاستلام`,
      seo_description:
        "منتج أصلي بجودة عالية، الدفع عند الاستلام وتوصيل سريع لجميع الولايات.",
      published_at: existing?.published_at ?? now,
      updated_at: now,
    },
    { onConflict: "product_id" }
  );

if (writeError) fail(`could not write landing page: ${writeError.message}`);

console.log(`${existing ? "updated" : "created"} published landing page`);
console.log(`product: ${product.name}`);
console.log(`path:    /p/${finalSlug}`);
console.log(`open:    http://localhost:3000/p/${finalSlug}`);
