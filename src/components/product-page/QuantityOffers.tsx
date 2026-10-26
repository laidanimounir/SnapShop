"use client";

import Price from "@/components/common/Price";
import { getOfferDisplay } from "@/lib/pricing";
import { ar, formatAr, formatStorePrice } from "@/lib/store/i18n-ar";
import { cn } from "@/lib/utils";
import type { QuantityOffer } from "@/types/offer.types";

/** Arabic label for a tier quantity: قطعة واحدة / قطعتان / 3 قطع … */
export function quantityLabel(quantity: number): string {
  if (quantity === 1) return ar.product.offers.unitOne;
  if (quantity === 2) return ar.product.offers.unitTwo;
  if (quantity >= 3 && quantity <= 10) {
    return formatAr(ar.product.offers.unitFew, { n: quantity });
  }
  return formatAr(ar.product.offers.unitOther, { n: quantity });
}

type QuantityOffersProps = {
  offers: QuantityOffer[];
  /** Real price of ONE piece (variant-aware, after display logic). */
  unitPrice: number;
  /** Stock of the selected variant: tiers above it are not buyable. */
  stock: number;
  selectedId: string | null;
  onChange: (offerId: string) => void;
};

export default function QuantityOffers({
  offers,
  unitPrice,
  stock,
  selectedId,
  onChange,
}: QuantityOffersProps) {
  const active = offers.filter((offer) => offer.is_active);
  if (active.length === 0) return null;

  // Only one tier: no choice to make, show it as a simple info row.
  if (active.length === 1) {
    const offer = active[0];
    return (
      <>
        <hr className="h-[1px] border-t-black/10 my-5" />
        <div className="flex items-center justify-between gap-3 border border-black/10 rounded-xl px-4 py-3 bg-black/[0.03]">
          <span className="text-sm text-black/70 flex items-center gap-2 min-w-0">
            {quantityLabel(offer.quantity)}
            {offer.badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-accent/10 text-[var(--brand-accent-ink)] shrink-0">
                {offer.badge}
              </span>
            )}
          </span>
          <Price value={offer.total_price} className="font-bold text-sm shrink-0" />
        </div>
      </>
    );
  }

  return (
    <>
      <hr className="h-[1px] border-t-black/10 my-5" />
      <div
        role="radiogroup"
        aria-label={ar.product.offers.label}
        className="flex flex-col gap-2"
      >
        {active.map((offer) => {
          const disabled = offer.quantity > stock;
          const checked = !disabled && offer.id === selectedId;
          const { saving, perPiece } = getOfferDisplay(
            offer.total_price,
            offer.quantity,
            unitPrice
          );
          return (
            <label
              key={offer.id}
              className={cn([
                "flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors",
                "border-black/10",
                checked && "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent",
                disabled && "opacity-50 cursor-not-allowed",
              ])}
            >
              <input
                type="radio"
                name="quantity-offer"
                className="sr-only peer"
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(offer.id)}
              />
              <span
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-black/25 flex items-center justify-center peer-checked:border-brand-accent peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2"
              >
                {checked && (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-accent" />
                )}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm sm:text-base font-medium">
                    {quantityLabel(offer.quantity)}
                    {offer.badge && (
                      <span className="ms-2 text-[10px] px-2 py-0.5 rounded-full bg-brand-accent/10 text-[var(--brand-accent-ink)] font-normal">
                        {offer.badge}
                      </span>
                    )}
                  </span>
                  <Price
                    value={offer.total_price}
                    className="font-bold text-sm sm:text-base shrink-0"
                  />
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/70">
                  {saving > 0 && (
                    <span className="text-[var(--brand-accent-ink)] font-medium">
                      {formatAr(ar.product.offers.save, {
                        amount: formatStorePrice(saving),
                      })}
                    </span>
                  )}
                  <span>
                    <bdi dir="ltr">{`≈ ${perPiece.toFixed(0)} DA`}</bdi>{" "}
                    {ar.product.offers.perPiece}
                  </span>
                  {disabled && (
                    <span className="text-red-600 font-medium">
                      {ar.product.offers.unavailable}
                    </span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}
