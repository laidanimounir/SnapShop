// Quantity pricing tiers ("قطعتين 4500 دج"): total_price is the FINAL
// price for that quantity of the product (no discount on top).

export type QuantityOffer = {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  label: string | null;
  badge: string | null;
  is_default: boolean;
  position: number;
  is_active: boolean;
};

/** Editor draft: numbers kept as strings so inputs stay simple. */
export type QuantityOfferDraft = {
  id: string | null;
  quantity: string;
  total_price: string;
  label: string;
  badge: string;
  is_default: boolean;
  is_active: boolean;
};

export const MAX_OFFERS_PER_PRODUCT = 3;

export function toOfferDraft(offer: QuantityOffer): QuantityOfferDraft {
  return {
    id: offer.id,
    quantity: String(offer.quantity),
    total_price: String(offer.total_price),
    label: offer.label ?? "",
    badge: offer.badge ?? "",
    is_default: offer.is_default,
    is_active: offer.is_active,
  };
}

export function emptyOfferDraft(): QuantityOfferDraft {
  return {
    id: null,
    quantity: "",
    total_price: "",
    label: "",
    badge: "",
    is_default: false,
    is_active: true,
  };
}
