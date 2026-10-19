import ProductListSec from "@/components/common/ProductListSec";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { getProducts, getFeaturedReviews } from "@/lib/api/products";
import { getPublishedLandingSlugMap } from "@/lib/landing/api";
import { ar } from "@/lib/store/i18n-ar";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    { products: newArrivals },
    { products: topSelling },
    featuredReviews,
    landingSlugs,
  ] = await Promise.all([
    getProducts({ sort: "newest", pageSize: 8 }),
    getProducts({ sort: "most-popular", pageSize: 8 }),
    getFeaturedReviews(6),
    getPublishedLandingSlugMap(),
  ]);

  return (
    <>
      <Header />
      <main className="my-[50px] sm:my-[72px]">
        <ProductListSec
          title={ar.home.newArrivals}
          data={newArrivals}
          viewAllLink="/shop?sort=newest"
          landingSlugs={landingSlugs}
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title={ar.home.topSelling}
            data={topSelling}
            viewAllLink="/shop?sort=most-popular"
            landingSlugs={landingSlugs}
          />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        <Reviews data={featuredReviews} />
      </main>
    </>
  );
}
