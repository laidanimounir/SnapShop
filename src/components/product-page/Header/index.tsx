"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PhotoSection from "./PhotoSection";
import BuyNowModal from "./BuyNowModal";
import { Product } from "@/types/product.types";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Rating from "@/components/ui/Rating";
import { addToCart } from "@/lib/features/carts/cartsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import {
  getDiscountedPrice,
  getDiscountAmount,
  getEffectivePrice,
  formatPrice,
} from "@/lib/pricing";
import { sortSizes } from "@/lib/sizes";
import { MAX_PRODUCT_IMAGES } from "@/lib/admin/images";
import { IoMdCheckmark } from "react-icons/io";

const Header = ({ product }: { product: Product }) => {
  const dispatch = useAppDispatch();

  // Only active variants reach the storefront (filtered server-side),
  // but guard again so a stale prop never shows a dead variant.
  const activeVariants = useMemo(
    () => product.variants.filter((v) => v.is_active !== false),
    [product.variants]
  );

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    activeVariants.forEach((v) => {
      if (v.color != null && v.color !== "" && !map.has(v.color)) {
        map.set(v.color, v.color_hex ?? "");
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [activeVariants]);
  const hasColors = colors.length > 0;

  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors[0]?.name ?? null
  );

  useEffect(() => {
    setSelectedColor((prev) => {
      if (!hasColors) return null;
      if (prev && colors.some((c) => c.name === prev)) return prev;
      return colors[0]?.name ?? null;
    });
  }, [colors, hasColors]);

  // Images linked to the selected color win when any exist; else all.
  // Primary image always comes first.
  const displayedImages = useMemo(() => {
    const imgs = product.images;
    const linked =
      selectedColor != null
        ? imgs.filter((i) => i.color === selectedColor)
        : [];
    const base = linked.length > 0 ? linked : imgs;
    // Cap to 1 main + 3 extras; extra legacy images are hidden, not deleted.
    return [...base]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .slice(0, MAX_PRODUCT_IMAGES);
  }, [product.images, selectedColor]);

  const primaryImage =
    displayedImages[0]?.url ?? product.images[0]?.url ?? "";
  const [selectedImage, setSelectedImage] = useState<string>(primaryImage);

  useEffect(() => {
    setSelectedImage(primaryImage);
  }, [primaryImage]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    activeVariants
      .filter((v) =>
        hasColors ? v.color === selectedColor : v.color == null
      )
      .forEach((v) => {
        if (v.size != null && v.size !== "") set.add(v.size);
      });
    return sortSizes(Array.from(set), product.size_type);
  }, [activeVariants, hasColors, selectedColor, product.size_type]);
  const hasSizes = sizes.length > 0;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSizes) {
      setSelectedSize(null);
    } else {
      setSelectedSize((prev) =>
        prev && sizes.includes(prev) ? prev : sizes[0] ?? null
      );
    }
  }, [sizes, hasSizes]);

  const selectedVariant = useMemo(() => {
    const found =
      activeVariants.find(
        (v) =>
          (hasColors ? v.color === selectedColor : v.color == null) &&
          (hasSizes ? v.size === selectedSize : v.size == null)
      ) ?? null;
    // Single-variant products (no color, no size) resolve directly.
    if (!found && activeVariants.length === 1) return activeVariants[0];
    return found;
  }, [activeVariants, hasColors, hasSizes, selectedColor, selectedSize]);

  const basePrice = selectedVariant
    ? getEffectivePrice(product.base_price, selectedVariant.price)
    : product.base_price;
  const price = getDiscountedPrice(
    basePrice,
    product.discount_percentage,
    product.discount_amount
  );
  const discountAmount = getDiscountAmount(
    basePrice,
    product.discount_percentage,
    product.discount_amount
  );
  const hasDiscount = product.discount_percentage > 0 || product.discount_amount > 0;
  const stock = selectedVariant?.stock_quantity ?? 0;

  const handleAddToCart = () => {
    if (!selectedVariant || stock <= 0) return;
    dispatch(
      addToCart({
        variant_id: selectedVariant.id,
        product_id: product.id,
        name: product.name,
        srcUrl: selectedImage || primaryImage,
        color: selectedVariant.color,
        size: selectedVariant.size,
        price,
        originalPrice: basePrice,
        quantity,
      })
    );
  };

  const [quantity, setQuantity] = useState(1);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <PhotoSection
            images={displayedImages.map((i) => i.url)}
            title={product.name}
            selected={selectedImage}
            onSelect={setSelectedImage}
          />
        </div>
        <div>
          <h1
            className={cn([
              integralCF.className,
              "text-2xl md:text-[40px] md:leading-[40px] mb-3 md:mb-3.5 capitalize",
            ])}
          >
            {product.name}
          </h1>
          <div className="flex items-center mb-3 sm:mb-3.5">
            <Rating
              initialValue={product.rating}
              allowFraction
              SVGclassName="inline-block"
              emptyClassName="fill-gray-50"
              size={25}
              readonly
            />
            <span className="text-black text-xs sm:text-sm ml-[11px] sm:ml-[13px] pb-0.5 sm:pb-0">
              {product.rating.toFixed(1)}
              <span className="text-black/60">/5</span>
            </span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3 mb-5">
            <span className="font-bold text-black text-2xl sm:text-[32px]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="font-bold text-black/40 line-through text-2xl sm:text-[32px]">
                {formatPrice(basePrice)}
              </span>
            )}
            {product.discount_percentage > 0 && (
              <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-brand-accent/10 text-brand-accent">
                -{product.discount_percentage}%
              </span>
            )}
            {product.discount_amount > 0 && (
              <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-brand-accent/10 text-brand-accent">
                -{formatPrice(discountAmount)}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-black/60 mb-5">
            {product.description}
          </p>
          {hasColors && (
            <>
              <hr className="h-[1px] border-t-black/10 mb-5" />
              <div className="flex flex-col">
                <span className="text-sm sm:text-base text-black/60 mb-4">
                  Select Colors
                </span>
                <div className="flex items-center flex-wrap space-x-3 sm:space-x-4">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      aria-label={color.name}
                      className="rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-black/10"
                      style={{
                        backgroundColor: color.hex || "#d1d5db",
                      }}
                      onClick={() => setSelectedColor(color.name)}
                    >
                      {selectedColor === color.name && (
                        <IoMdCheckmark className="text-base text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {hasSizes && (
            <>
              <hr className="h-[1px] border-t-black/10 my-5" />
              <div className="flex flex-col">
                <span className="text-sm sm:text-base text-black/60 mb-4">
                  Choose Size
                </span>
                <div className="flex items-center flex-wrap lg:space-x-3">
                  {sizes.map((size) => {
                    const variant = activeVariants.find(
                      (v) =>
                        (hasColors
                          ? v.color === selectedColor
                          : v.color == null) && v.size === size
                    );
                    const outOfStock = variant && variant.stock_quantity <= 0;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!!outOfStock}
                        className={cn([
                          "bg-[#F0F0F0] flex items-center justify-center px-5 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base rounded-full m-1 lg:m-0 max-h-[46px]",
                          selectedSize === size && "bg-black font-medium text-white",
                          outOfStock && "opacity-40 cursor-not-allowed line-through",
                        ])}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          <hr className="hidden md:block h-[1px] border-t-black/10 my-5" />

          <div className="flex items-center justify-between sm:justify-start gap-3 mt-5">
            <div className="bg-[#F0F0F0] rounded-full flex items-center justify-between min-w-[110px] px-4 py-3">
              <button
                type="button"
                className="h-6 w-6 text-xl"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span className="font-medium text-sm sm:text-base">{quantity}</span>
              <button
                type="button"
                className="h-6 w-6 text-xl"
                onClick={() =>
                  setQuantity((q) => Math.min(10, Math.max(1, stock), q + 1))
                }
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={!selectedVariant || stock <= 0}
              className="bg-black w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAddToCart}
            >
              {stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              type="button"
              disabled={!selectedVariant || stock <= 0}
              className="bg-brand-accent w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-brand-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setBuyNowOpen(true)}
            >
              Buy Now
            </button>
          </div>

          {!selectedVariant && (
            <p className="text-xs text-black/50 mt-3">
              This product is currently unavailable.
            </p>
          )}
        </div>
      </div>

      <BuyNowModal
        open={buyNowOpen}
        onOpenChange={setBuyNowOpen}
        variantId={selectedVariant?.id ?? ""}
        quantity={quantity}
        title={product.name}
        image={selectedImage || primaryImage}
        color={selectedVariant?.color ?? null}
        size={selectedVariant?.size ?? null}
        price={price}
      />
    </>
  );
};

export default Header;
