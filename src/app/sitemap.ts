import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getProducts } from "@/lib/api/products";
import { getPublishedLandingSlugMap } from "@/lib/landing/api";

// Origin of THIS request: correct for the live domain, Vercel previews and
// local runs, without depending on any env var being set. The env var is
// only a last-resort fallback for contexts without a request (build tooling).
function siteOrigin(): string {
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // No request context: fall through to the env fallback.
  }
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

const STATIC_ROUTES = [
  "/",
  "/shop",
  "/search",
  "/track-order",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping",
];

function lastModified(stamp: string | undefined): Date | undefined {
  if (!stamp) return undefined;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteOrigin();

  let products: Awaited<ReturnType<typeof getProducts>>["products"] = [];
  let landingSlugs: Record<string, string> = {};
  try {
    // The catalog is small; one wide page covers every active product.
    const page = await getProducts({ pageSize: 1000, sort: "newest" });
    products = page.products;
  } catch {
    products = [];
  }
  try {
    landingSlugs = await getPublishedLandingSlugMap();
  } catch {
    landingSlugs = {};
  }

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${site}${route}`,
      lastModified: new Date(),
    })),
    // Products with a published landing page are served under /p/<slug>
    // (the product URL redirects there), so list the real destination.
    ...products.map((product) => {
      const landingSlug = landingSlugs[product.id];
      return {
        url: landingSlug
          ? `${site}/p/${landingSlug}`
          : `${site}/shop/product/${product.id}`,
        lastModified:
          lastModified(product.updated_at) ??
          lastModified(product.created_at),
      };
    }),
  ];
}
