"use client";

import React, { useEffect, useMemo, useState } from "react";
import PhotoSection from "./PhotoSection";
import OrderForm from "../OrderForm";
import QuantityOffers from "../QuantityOffers";
import { Product } from "@/types/product.types";
import type { QuantityOffer } from "@/types/offer.types";
import { cairo } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Rating from "@/components/ui/Rating";
import {
  getCompareAtPrice,
  getDiscountedPrice,
  getDiscountAmount,
  getEffectivePrice,
  getSavings,
  round2,
} from "@/lib/pricing";
import { sortSizes } from "@/lib/sizes";
import { MAX_PRODUCT_IMAGES } from "@/lib/admin/images";
import { IoMdCheckmark } from "react-icons/io";
import { Truck, Wallet, RotateCcw } from "lucide-react";
import Price from "@/components/common/Price";
import { trackPixelEvent } from "@/lib/landing/tracking";
import {
  ar,
  arabicCount,
  formatStorePrice,
  reviewCountForms,
} from "@/lib/store/i18n-ar";

const Header = ({
  product,
  reviewCount = 0,
  offers = [],
}: {
  product: Product;
  reviewCount?: number;
  offers?: QuantityOffer[];
}) => {
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
  // New model: the merchant types the real price (base_price) and an old
  // price shown struck through. Display only — never used for charging.
  // Products that still carry a legacy percentage/amount discount and no
  // compare_at_price keep today's display until the optional data
  // migration (see report) converts them.
  const hasComparePrice = product.compare_at_price != null;
  const price = hasComparePrice
    ? round2(basePrice)
    : getDiscountedPrice(basePrice, product.discount_percentage, product.discount_amount);
  const discountAmount = hasComparePrice
    ? 0
    : getDiscountAmount(basePrice, product.discount_percentage, product.discount_amount);
  const hasDiscount =
    !hasComparePrice &&
    (product.discount_percentage > 0 || product.discount_amount > 0);
  const compareAt = getCompareAtPrice(product.compare_at_price, price);
  const savings = compareAt != null ? getSavings(compareAt, price) : null;
  const stock = selectedVariant?.stock_quantity ?? 0;

  // ---- quantity offers (tiers replace the free stepper when they exist) ----
  const activeOffers = useMemo(
    () => offers.filter((offer) => offer.is_active),
    [offers]
  );
  // The default tier is pre-selected; otherwise the first active tier.
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(() => {
    if (activeOffers.length === 0) return null;
    const fallback = activeOffers.find((offer) => offer.is_default);
    return (fallback ?? activeOffers[0]).id;
  });
  // Selected tier that actually fits the selected variant's stock (falls
  // back to the first available tier when the selection becomes invalid).
  const selectedOffer = useMemo(() => {
    const pick = (offer: QuantityOffer) => offer.quantity <= stock;
    const exact = activeOffers.find(
      (offer) => offer.id === selectedOfferId && pick(offer)
    );
    if (exact) return exact;
    return activeOffers.find(pick) ?? null;
  }, [activeOffers, selectedOfferId, stock]);

  const [quantity, setQuantity] = useState(1);

  // Funnel pixel: one ViewContent per product view, with the product id and
  // the real (base) price. No-op until a pixel is enabled and loaded.
  useEffect(() => {
    trackPixelEvent("ViewContent", {
      value: product.base_price,
      contentIds: [product.id],
      contentType: "product",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              cairo.className,
              "text-2xl md:text-[40px] md:leading-[40px] mb-2 sm:mb-3 md:mb-3.5 break-words",
            ])}
          >
            {product.name}
          </h1>
          {(product.rating > 0 || reviewCount > 0) && (
            <div className="flex items-center mb-3 sm:mb-3.5">
              {product.rating > 0 && (
                <Rating
                  initialValue={product.rating}
                  allowFraction
                  SVGclassName="inline-block"
                  emptyClassName="fill-gray-50"
                  size={25}
                  readonly
                />
              )}
              {product.rating > 0 && (
                <span className="text-black text-xs sm:text-sm ms-[11px] sm:ms-[13px] pb-0.5 sm:pb-0">
                  <bdi dir="ltr">{product.rating.toFixed(1)}/5</bdi>
                </span>
              )}
              {reviewCount > 0 && (
                <span className="text-black/50 text-xs sm:text-sm pb-0.5 sm:pb-0 ms-1.5">
                  ({arabicCount(reviewCount, reviewCountForms)})
                </span>
              )}
            </div>
          )}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 mb-4 sm:mb-5">
            <Price
              value={price}
              className="font-bold text-black text-[26px] sm:text-[32px] leading-none"
            />
            {compareAt != null ? (
              <>
                <Price
                  value={compareAt}
                  className="font-medium text-black/40 line-through text-lg sm:text-xl leading-none"
                />
                {savings && savings.percent > 0 && (
                  <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3 rounded-full bg-brand-accent/10 text-brand-accent">
                    <bdi dir="ltr">-{savings.percent}%</bdi>
                  </span>
                )}
                {savings && savings.amount > 0 && savings.percent <= 0 && (
                  <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3 rounded-full bg-brand-accent/10 text-brand-accent">
                    <bdi dir="ltr">-{formatStorePrice(savings.amount)}</bdi>
                  </span>
                )}
              </>
            ) : (
              <>
                {hasDiscount && (
                  <Price
                    value={basePrice}
                    className="font-medium text-black/40 line-through text-lg sm:text-xl leading-none"
                  />
                )}
                {product.discount_percentage > 0 && (
                  <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3 rounded-full bg-brand-accent/10 text-brand-accent">
                    <bdi dir="ltr">-{product.discount_percentage}%</bdi>
                  </span>
                )}
                {product.discount_amount > 0 && (
                  <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3 rounded-full bg-brand-accent/10 text-brand-accent">
                    <bdi dir="ltr">-{formatStorePrice(discountAmount)}</bdi>
                  </span>
                )}
              </>
            )}
          </div>
          {/* Trust strip: honest, generic wording — no invented numbers. */}
          <ul className="grid grid-cols-3 gap-2 border-y border-black/10 py-3 mb-4 sm:mb-5">
            {[
              { icon: Wallet, label: ar.product.trust.cod, hint: ar.product.trust.codHint },
              { icon: Truck, label: ar.product.trust.delivery, hint: ar.product.trust.deliveryHint },
              { icon: RotateCcw, label: ar.product.trust.returns, hint: ar.product.trust.returnsHint },
            ].map(({ icon: Icon, label, hint }) => (
              <li key={label} className="flex flex-col items-center text-center gap-1">
                <Icon
                  className="w-4 h-4 sm:w-5 sm:h-5 text-brand-accent"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="text-[11px] sm:text-xs font-medium text-black leading-tight">
                  {label}
                </span>
                <span className="hidden sm:block text-[10px] text-black/45 leading-tight">
                  {hint}
                </span>
              </li>
            ))}
          </ul>
          {product.description && (
            <p className="text-sm sm:text-base leading-relaxed text-black/60 mb-4 sm:mb-5">
              {product.description}
            </p>
          )}
          {hasColors && (
            <div className="border-t border-black/10 pt-5 flex flex-col">
              <span className="text-sm sm:text-base font-medium text-black mb-4">
                {ar.product.selectColors}
              </span>
              <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    aria-label={`${ar.a11y.selectColor}: ${color.name}`}
                    aria-pressed={selectedColor === color.name}
                    className="rounded-full w-11 h-11 flex items-center justify-center border border-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2"
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
          )}
          {hasSizes && (
            <div className="border-t border-black/10 pt-5 mt-5 flex flex-col">
              <span className="text-sm sm:text-base font-medium text-black mb-4">
                {ar.product.chooseSize}
              </span>
              <div className="flex items-center flex-wrap lg:gap-3">
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
                      aria-label={`${ar.a11y.selectSize}: ${size}`}
                      aria-pressed={selectedSize === size}
                      className={cn([
                        "bg-[#F0F0F0] flex items-center justify-center px-5 lg:px-6 min-h-[44px] py-2.5 lg:py-3 text-sm lg:text-base rounded-full m-1 lg:m-0 max-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/60 focus-visible:ring-offset-2",
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
          )}
          {activeOffers.length > 0 && (
            <QuantityOffers
              offers={activeOffers}
              unitPrice={price}
              stock={stock}
              selectedId={selectedOffer?.id ?? null}
              onChange={setSelectedOfferId}
            />
          )}
          <hr className="hidden md:block h-[1px] border-t-black/10 my-5" />

          {/* Free stepper only when the product has no quantity offers:
              with tiers, the customer picks a tier instead. */}
          {activeOffers.length === 0 && (
            <div className="flex items-center justify-between sm:justify-start gap-3 mt-5">
              <div className="bg-[#F0F0F0] rounded-full flex items-center justify-between min-w-[110px] px-4 py-3">
                <button
                  type="button"
                  className="h-6 w-6 text-xl"
                  aria-label={ar.a11y.quantityDecrease}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="font-medium text-sm sm:text-base">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="h-6 w-6 text-xl"
                  aria-label={ar.a11y.quantityIncrease}
                  onClick={() =>
                    setQuantity((q) => Math.min(10, Math.max(1, stock), q + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>
          )}

          <OrderForm
            variantId={selectedVariant?.id ?? null}
            quantity={selectedOffer ? selectedOffer.quantity : quantity}
            product={{ id: product.id, name: product.name }}
            image={selectedImage || primaryImage}
            unitPrice={basePrice}
            unitDiscount={discountAmount}
            stock={stock}
            hasColors={hasColors}
            hasSizes={hasSizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            offer={selectedOffer}
            hasOffers={activeOffers.length > 0}
          />

          {!selectedVariant && (
            <p className="text-xs text-black/50 mt-3">{ar.product.unavailable}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
