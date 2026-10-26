import { ar, formatAr } from "@/lib/admin/i18n-ar";
import { round2 } from "@/lib/pricing";
import {
  MAX_OFFERS_PER_PRODUCT,
  type QuantityOfferDraft,
} from "@/types/offer.types";

export type ValidQuantityOffer = {
  quantity: number;
  total_price: number;
  label: string | null;
  badge: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type QuantityOfferValidation =
  | { ok: true; offers: ValidQuantityOffer[] }
  | { ok: false; error: string };

const isBlank = (d: QuantityOfferDraft): boolean =>
  d.quantity.trim() === "" &&
  d.total_price.trim() === "" &&
  d.label.trim() === "" &&
  d.badge.trim() === "";

const fail = (error: string): QuantityOfferValidation => ({ ok: false, error });

/**
 * App-side rules for quantity offers (the DB only enforces quantity 1-10,
 * unique (product_id, quantity) and total_price > 0):
 * - blank rows are ignored (the admin can leave a row empty)
 * - at most 3 rows, integer quantity 1-10, unique per product
 * - total price > 0 and never above buying the qty at the normal price
 * - exactly one default tier (the first one wins if none was picked)
 */
export function validateQuantityOffers(
  drafts: QuantityOfferDraft[],
  basePrice: number
): QuantityOfferValidation {
  const rows = drafts.filter((d) => !isBlank(d));

  if (rows.length > MAX_OFFERS_PER_PRODUCT) {
    return fail(
      formatAr(ar.products.editor.offersMaxError, {
        n: MAX_OFFERS_PER_PRODUCT,
      })
    );
  }

  const seen = new Set<number>();
  const offers: ValidQuantityOffer[] = [];

  for (const row of rows) {
    const quantity = Number(row.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return fail(ar.products.editor.offersQuantityRange);
    }
    if (seen.has(quantity)) {
      return fail(ar.products.editor.offersQuantityUnique);
    }
    seen.add(quantity);

    const total = Number(row.total_price);
    if (!Number.isFinite(total) || total <= 0) {
      return fail(ar.products.editor.offersPricePositive);
    }

    const reference =
      Number.isFinite(basePrice) && basePrice > 0
        ? round2(basePrice * quantity)
        : null;
    if (reference != null && round2(total) > reference) {
      return fail(
        formatAr(ar.products.editor.offersPriceTooHigh, {
          total: round2(total).toFixed(2),
          limit: reference.toFixed(2),
        })
      );
    }

    offers.push({
      quantity,
      total_price: round2(total),
      label: row.label.trim() || null,
      badge: row.badge.trim() || null,
      is_default: row.is_default,
      is_active: row.is_active,
    });
  }

  // Exactly one default tier (or none -> the first tier becomes default).
  let hasDefault = false;
  for (const offer of offers) {
    if (offer.is_default && !hasDefault) {
      hasDefault = true;
    } else {
      offer.is_default = false;
    }
  }
  if (!hasDefault && offers.length > 0) offers[0].is_default = true;

  return { ok: true, offers };
}
