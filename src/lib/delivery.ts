import { round2 } from "./pricing";

export type DeliveryType = "home" | "office";

export type DeliveryZone = {
  wilaya_code: number;
  name_ar: string;
  name_fr: string;
  home_price: number;
  office_price: number;
};

export function isDeliveryType(value: string): value is DeliveryType {
  return value === "home" || value === "office";
}

/**
 * Delivery price for the selected zone and type. The server recomputes
 * the same value in place_guest_order from delivery_zones; this helper
 * only mirrors it for the live client total.
 */
export function getDeliveryPrice(
  zone: DeliveryZone | null,
  type: DeliveryType
): number {
  if (!zone) return 0;
  return round2(type === "office" ? zone.office_price : zone.home_price);
}

/** Client total, identical to the server formula (2-decimal rounding). */
export function getOrderTotal(
  subtotal: number,
  discountTotal: number,
  deliveryPrice: number
): number {
  return round2(subtotal - discountTotal + deliveryPrice);
}

export function formatZoneLabel(
  zone: Pick<DeliveryZone, "wilaya_code" | "name_ar" | "name_fr">
): string {
  return `${String(zone.wilaya_code).padStart(2, "0")} — ${zone.name_fr} — ${zone.name_ar}`;
}

export const DELIVERY_TYPE_LABEL: Record<DeliveryType, string> = {
  home: "Home delivery",
  office: "Office pickup",
};
