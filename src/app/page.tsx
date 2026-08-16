import ProductListSec from "@/components/common/ProductListSec";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { getProducts, getFeaturedReviews } from "@/lib/api/products";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ products: newArrivals }, { products: topSelling }, featuredReviews] =
    await Promise.all([
      getProducts({ sort: "newest", pageSize: 8 }),
      getProducts({ sort: "most-popular", pageSize: 8 }),
      getFeaturedReviews(6),
    ]);

  return (
    <>
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        <ProductListSec
          title="NEW ARRIVALS"
          data={newArrivals}
          viewAllLink="/shop?sort=newest"
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title="top selling"
            data={topSelling}
            viewAllLink="/shop?sort=most-popular"
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
