import ProductListSec from "@/components/common/ProductListSec";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import ReviewsContent from "@/components/product-page/Tabs/ReviewsContent";
import {
  getProductById,
  getProducts,
  getApprovedReviews,
  type ProductPage,
} from "@/lib/api/products";
import { getActiveQuantityOffers } from "@/lib/api/offers";
import { buildProductJsonLd } from "@/lib/seo/product-json-ld";
import {
  getPublishedLandingSlugForProduct,
  getPublishedLandingSlugMap,
} from "@/lib/landing/api";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isValidUuid } from "@/lib/uuid";
import { BRAND_NAME } from "@/lib/config";
import { ar, truncateGraphemes } from "@/lib/store/i18n-ar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] };
}): Promise<Metadata> {
  const product = await getProductById(params.slug[0]).catch(() => null);
  if (!product) return { title: ar.meta.notFoundTitle };
  const description = truncateGraphemes(product.description, 160);
  const primary =
    product.images.find((i) => i.is_primary) ?? product.images[0];
  const path = `/shop/product/${product.id}`;
  const url = `${SITE_URL.replace(/\/$/, "")}${path}`;
  const images = primary ? [{ url: primary.url }] : [];
  return {
    title: product.name,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: BRAND_NAME,
      title: product.name,
      description,
      locale: ar.meta.ogLocale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const productId = params.slug[0];

  // Anything that is not a uuid (hand-edited url, garbage) is a 404, never a
  // Postgres cast error leaking as a 500.
  if (!isValidUuid(productId)) notFound();

  // When the product has a published landing page, the landing page is the
  // canonical storefront page for it: send visitors there instead.
  const landingSlug = await getPublishedLandingSlugForProduct(productId);
  if (landingSlug) redirect(`/p/${landingSlug}`);

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  const [reviews, { products: categoryProducts }, landingSlugs, offers] =
    await Promise.all([
      getApprovedReviews(productId),
      product.category
        ? getProducts({
            pageSize: 6,
            sort: "most-popular",
            category: product.category,
          })
        : Promise.resolve({ products: [], total: 0 } as ProductPage),
      getPublishedLandingSlugMap(),
      getActiveQuantityOffers(productId),
    ]);

  // Related products: same category first, falling back to popular ones
  // when the category has nothing else (or the product has none). The
  // current product never shows in its own list; an empty list hides the
  // whole section.
  let related = categoryProducts.filter((p) => p.id !== productId);
  if (related.length === 0) {
    const { products: popular } = await getProducts({
      pageSize: 6,
      sort: "most-popular",
    });
    related = popular.filter((p) => p.id !== productId);
  }

  // Structured data for search engines: mirrors exactly what the customer
  // sees (real price/tiers, real stock, real reviews).
  const jsonLd = buildProductJsonLd({
    product,
    offers,
    reviewCount: reviews.length,
    siteUrl: SITE_URL,
    path: `/shop/product/${product.id}`,
    breadcrumb: [
      { name: ar.shop.home, url: "/" },
      { name: ar.shop.title, url: "/shop" },
      { name: product.name, url: `/shop/product/${product.id}` },
    ],
  });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-4 sm:mb-6" />
        <BreadcrumbProduct title={product.name} />
        <section className="mb-9 sm:mb-11">
          <Header
            product={product}
            reviewCount={reviews.length}
            offers={offers}
          />
        </section>
        {/* Reviews sit above the tabs: social proof before the fold of the
            tab section, instead of hiding behind a tab click. */}
        <section className="pt-6 border-t border-black/10 mb-9 sm:mb-11">
          <ReviewsContent reviews={reviews} productId={product.id} />
        </section>
        <Tabs product={product} />
      </div>
      {related.length > 0 && (
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title={ar.product.youMightAlsoLike}
            data={related}
            landingSlugs={landingSlugs}
          />
        </div>
      )}
    </main>
  );
}
