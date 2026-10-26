import type { Product } from "@/types/product.types";
import type { QuantityOffer } from "@/types/offer.types";

// Structured data for the product page (Google rich results):
//   - Product with one Offer per active quantity tier (or a single Offer
//     built from the real price when the product has no tiers)
//   - AggregateRating ONLY when there is a real rating and at least one
//     approved review (never invent stars)
//   - BreadcrumbList mirroring the visible breadcrumb
// Prices are plain numbers in DZD; availability comes from real variant
// stock. Pure and testable: no fetching, no env access.

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";

export type ProductJsonLdBreadcrumb = {
  name: string;
  url: string;
};

export type ProductJsonLdInput = {
  product: Product;
  /** Active quantity tiers (already fetched for the page). */
  offers: QuantityOffer[];
  /** Count of approved reviews shown on the page. */
  reviewCount: number;
  /** Absolute origin, e.g. https://example.com (no trailing slash). */
  siteUrl: string;
  /** Path of this product page, e.g. /shop/product/<uuid>. */
  path: string;
  breadcrumb: ProductJsonLdBreadcrumb[];
};

function absoluteUrl(url: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildProductJsonLd({
  product,
  offers,
  reviewCount,
  siteUrl,
  path,
  breadcrumb,
}: ProductJsonLdInput): Record<string, unknown> {
  const url = `${siteUrl.replace(/\/$/, "")}${path}`;

  // Real stock: at least one active variant you can actually buy.
  const inStock = product.variants.some(
    (v) => v.is_active !== false && v.stock_quantity > 0
  );
  const availability = inStock ? IN_STOCK : OUT_OF_STOCK;

  const activeTiers = offers
    .filter((offer) => offer.is_active)
    .sort((a, b) => a.position - b.position);

  const tierOffers = activeTiers.map((offer) => ({
    "@type": "Offer",
    price: Number(offer.total_price),
    priceCurrency: "DZD",
    availability,
    url,
  }));

  const offersJson =
    tierOffers.length > 0
      ? tierOffers
      : [
          {
            "@type": "Offer",
            price: Number(product.base_price),
            priceCurrency: "DZD",
            availability,
            url,
          },
        ];

  const productJson: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description,
    url,
    image: product.images.map((image) => absoluteUrl(image.url, siteUrl)),
    offers: offersJson,
  };

  if (product.brand) {
    productJson.brand = { "@type": "Brand", name: product.brand };
  }

  // Only publish stars that exist on the page.
  if (product.rating > 0 && reviewCount >= 1) {
    productJson.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(product.rating),
      reviewCount,
    };
  }

  const breadcrumbJson = {
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.url, siteUrl),
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [productJson, breadcrumbJson],
  };
}
