import React from "react";
import Rating from "../ui/Rating";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product.types";
import { getDiscountedPrice } from "@/lib/pricing";
import Price from "./Price";
import { formatStorePrice } from "@/lib/store/i18n-ar";

type ProductCardProps = {
  data: Product;
  // Published landing-page slug for this product, when one exists.
  // Cards link straight to /p/{slug} instead of the old product page.
  landingSlug?: string | null;
};

const ProductCard = ({ data, landingSlug }: ProductCardProps) => {
  const ordered = [...data.images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary)
  );
  const image = ordered[0]?.url ?? "/images/pic1.png";
  const secondaryImage = ordered[1]?.url ?? null;
  const price = getDiscountedPrice(
    data.base_price,
    data.discount_percentage,
    data.discount_amount
  );
  const hasDiscount = data.discount_percentage > 0 || data.discount_amount > 0;

  return (
    <Link
      href={landingSlug ? `/p/${landingSlug}` : `/shop/product/${data.id}`}
      className="flex flex-col items-start aspect-auto"
    >
      <div className="group relative bg-[#F0EEED] rounded-[13px] lg:rounded-[20px] w-full lg:max-w-[295px] aspect-square mb-2.5 xl:mb-4 overflow-hidden">
        <Image
          src={image}
          width={295}
          height={298}
          className="rounded-md w-full h-full object-contain transition-all duration-500 group-hover:scale-110 group-hover:opacity-0"
          alt={data.name}
        />
        {secondaryImage && (
          <Image
            src={secondaryImage}
            width={295}
            height={298}
            className="absolute inset-0 rounded-md w-full h-full object-contain opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            alt={data.name}
          />
        )}
      </div>
      <strong className="text-black xl:text-xl">{data.name}</strong>
      <div className="flex items-end mb-1 xl:mb-2">
        <Rating
          initialValue={data.rating}
          allowFraction
          SVGclassName="inline-block"
          emptyClassName="fill-gray-50"
          size={19}
          readonly
        />
        <span className="text-black text-xs xl:text-sm ms-[11px] xl:ms-[13px] pb-0.5 xl:pb-0">
          <bdi dir="ltr">{data.rating.toFixed(1)}/5</bdi>
        </span>
      </div>
      <div className="flex items-center gap-[5px] xl:gap-2.5">
        <Price
          value={price}
          className="font-bold text-black text-xl xl:text-2xl"
        />
        {hasDiscount && (
          <Price
            value={data.base_price}
            className="font-bold text-black/40 line-through text-xl xl:text-2xl"
          />
        )}
        {data.discount_percentage > 0 && (
          <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-brand-accent/10 text-brand-accent">
            <bdi dir="ltr">-{data.discount_percentage}%</bdi>
          </span>
        )}
        {data.discount_amount > 0 && (
          <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-brand-accent/10 text-brand-accent">
            <bdi dir="ltr">-{formatStorePrice(data.discount_amount)}</bdi>
          </span>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
