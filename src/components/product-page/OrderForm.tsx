"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { placeGuestOrder } from "@/lib/api/orders";
import { createIdempotencyKey } from "@/lib/idempotency";
import { useDeliveryZones } from "@/lib/hooks/useDeliveryZones";
import {
  hasAnyFieldError,
  validateAddress,
  validateCheckoutFields,
  validateName,
  validatePhone,
  validateWilaya,
  type FieldErrors,
} from "@/lib/checkout/validation";
import {
  DELIVERY_TYPE_LABEL,
  formatZoneLabel,
  getDeliveryPrice,
  getOrderTotal,
  type DeliveryType,
} from "@/lib/delivery";
import { clampQuantity, isValidQuantity, MAX_QUANTITY_PER_VARIANT } from "@/lib/quantity";
import { round2 } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import Price from "@/components/common/Price";
import { ar } from "@/lib/store/i18n-ar";
import type { QuantityOffer } from "@/types/offer.types";
import { trackPixelEvent } from "@/lib/landing/tracking";

type OrderFormProps = {
  variantId: string | null;
  quantity: number;
  product: { id: string; name: string };
  image: string;
  /** Pre-discount unit price (server: effective_price). */
  unitPrice: number;
  /** Per-unit discount (server: unit_discount). */
  unitDiscount: number;
  stock: number;
  hasColors: boolean;
  hasSizes: boolean;
  selectedColor: string | null;
  selectedSize: string | null;
  /** Selected quantity tier (fixed total price), if the product has offers. */
  offer?: QuantityOffer | null;
  /** True when the product has quantity offers (tier picker replaces stepper). */
  hasOffers?: boolean;
};

export default function OrderForm({
  variantId,
  quantity,
  product,
  image,
  unitPrice,
  unitDiscount,
  stock,
  hasColors,
  hasSizes,
  selectedColor,
  selectedSize,
  offer = null,
  hasOffers = false,
}: OrderFormProps) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilayaCode, setWilayaCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const { zones, zonesLoading, zonesError } = useDeliveryZones();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  // One key per (variant, quantity, offer) attempt: reused across retries of
  // the same payload so a retry returns the existing order instead of
  // creating a duplicate; regenerated when the payload changes (including
  // switching the selected quantity tier).
  const [idempotency, setIdempotency] = useState<{
    key: string;
    variantId: string;
    quantity: number;
    offerId: string | null;
  } | null>(null);

  // Sticky-bar keyboard offset (visualViewport-aware; graceful fallback).
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      setKeyboardOffset(offset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const wilayaRef = useRef<HTMLSelectElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  const selectedZone = useMemo(
    () => zones.find((z) => z.wilaya_code === Number(wilayaCode)) ?? null,
    [zones, wilayaCode]
  );

  const subtotal = round2(unitPrice * quantity);
  // A quantity tier is a fixed TOTAL price: express it as a discount line so
  // subtotal (reference) / discount / total keep their existing meaning.
  const discountTotal = offer
    ? Math.max(0, round2(subtotal - offer.total_price))
    : round2(unitDiscount * quantity);
  const goodsTotal = round2(subtotal - discountTotal);
  const deliveryPrice = getDeliveryPrice(selectedZone, deliveryType);
  const orderTotal = getOrderTotal(subtotal, discountTotal, deliveryPrice);

  const quantityValid =
    isValidQuantity(quantity) && quantity <= Math.min(MAX_QUANTITY_PER_VARIANT, Math.max(stock, 1));

  const blockedReason: string | null = (() => {
    if (stock <= 0) return ar.product.outOfStock;
    if (!variantId) return ar.product.unavailable;
    if (hasColors && !selectedColor) return ar.product.pickColor;
    if (hasSizes && !selectedSize) return ar.product.pickSize;
    // Offers exist but no tier fits the selected variant's stock: the
    // stepper is hidden, so there is nothing else to order.
    if (hasOffers && !offer) return ar.product.outOfStock;
    if (!quantityValid) return ar.product.outOfStock;
    if (zonesLoading) return ar.checkout.loadingWilayas;
    return null;
  })();
  const isBlocked = blockedReason !== null;

  const errors: FieldErrors = {
    customerName: touched.customerName ? validateName(customerName) : undefined,
    phone: touched.phone ? validatePhone(phone) : undefined,
    address: touched.address ? validateAddress(address) : undefined,
    wilaya: touched.wilaya ? validateWilaya(wilayaCode, zones.length > 0) : undefined,
  };

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const scrollToFirstInvalid = (fieldErrors: FieldErrors) => {
    const order: [string | undefined, React.RefObject<HTMLElement | null>][] = [
      [fieldErrors.customerName, nameRef],
      [fieldErrors.phone, phoneRef],
      [fieldErrors.wilaya, wilayaRef],
      [fieldErrors.address, addressRef],
    ];
    const first = order.find(([err]) => Boolean(err));
    if (!first) return;
    const el = first[1].current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  const handleSubmit = async () => {
    setTouched({ customerName: true, phone: true, address: true, wilaya: true });
    const fieldErrors = validateCheckoutFields({
      customerName,
      phone,
      address,
      wilayaCode,
      hasZones: zones.length > 0,
    });
    if (hasAnyFieldError(fieldErrors)) {
      scrollToFirstInvalid(fieldErrors);
      return;
    }
    if (!variantId) return;
    if (zonesError || zonesLoading) {
      setError(zonesError ?? ar.checkout.validation.zonesLoading);
      return;
    }
    if (company.trim() !== "") {
      setError(ar.checkout.validation.honeypot);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const offerId = offer?.id ?? null;
      // Reuse the key while the payload is unchanged; regenerate when the
      // variant, quantity or selected tier changed since the failed attempt.
      let attemptKey: string;
      if (
        idempotency &&
        idempotency.variantId === variantId &&
        idempotency.quantity === quantity &&
        idempotency.offerId === offerId
      ) {
        attemptKey = idempotency.key;
      } else {
        attemptKey = createIdempotencyKey();
        setIdempotency({ key: attemptKey, variantId, quantity, offerId });
      }
      const result = await placeGuestOrder({
        guest_name: customerName.trim(),
        guest_phone: phone.trim(),
        guest_address: address.trim(),
        items: [{ variant_id: variantId, quantity: clampQuantity(quantity) }],
        idempotency_key: attemptKey,
        wilaya_code: Number(wilayaCode),
        delivery_type: deliveryType,
        offer_id: offerId,
      });
      setIdempotency(null);
      // Funnel pixel: report the conversion with the selected tier (id +
      // quantity, never a price) so ad reporting can tell which offer sold.
      // No pixel is injected on this page yet - the call is a safe no-op.
      trackPixelEvent("Purchase", {
        value: result.total,
        quantity,
        offerId,
        offerQuantity: offer?.quantity,
      });
      router.push(`/order-confirmation/${result.confirmation_token}`);
    } catch (e) {
      // placeGuestOrder already maps server errors to user-facing Arabic text.
      setError(e instanceof Error ? e.message : ar.checkout.validation.generic);
      setIsSubmitting(false);
    }
  };

  const buttonLabel = isSubmitting
    ? ar.checkout.processing
    : isBlocked
      ? blockedReason
      : ar.product.orderNow;

  const submitButton = (variant: "inline" | "sticky") => (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isSubmitting || isBlocked}
      className={cn(
        "rounded-full text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90",
        variant === "inline"
          ? "w-full py-3"
          : "flex-1 py-3 min-h-[44px]"
      )}
    >
      {isSubmitting && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {buttonLabel}
    </button>
  );

  return (
    <div className="mt-5 pt-5 border-t border-black/10 space-y-4">
      {/* Product line + money summary (server convention: pre-discount
          subtotal, discount row, delivery, total). */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-14 h-14 rounded-lg bg-[#F0EEED] overflow-hidden shrink-0 relative">
          {image && (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black truncate">{product.name}</p>
          {[selectedColor, selectedSize].filter(Boolean).join(" / ") && (
            <p className="text-xs text-black/60">
              {[selectedColor, selectedSize].filter(Boolean).join(" / ")}
            </p>
          )}
          <p className="text-sm font-bold text-black">
            <Price value={subtotal} />
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Visible group headings — labels stay visible above every field. */}
      <h3 className="text-[13px] font-semibold text-black">{ar.checkout.yourInfo}</h3>

      <div>
        <label className="block text-[13px] font-medium text-black mb-1">
          {ar.checkout.customerName}
        </label>
        <input
          ref={nameRef}
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onBlur={() => handleBlur("customerName")}
          placeholder={ar.checkout.fullName}
          className={cn(
            "w-full px-3 py-3 text-base border rounded-lg outline-none transition-all",
            errors.customerName
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-black/10 focus:border-black/40 focus:ring-2 focus:ring-black/10"
          )}
        />
        {errors.customerName && (
          <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium text-black mb-1">
          {ar.checkout.phoneNumber}
        </label>
        <input
          ref={phoneRef}
          type="tel"
          dir="ltr"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder={ar.checkout.phonePlaceholder}
          className={cn(
            "w-full px-3 py-3 text-base border rounded-lg outline-none transition-all text-start",
            errors.phone
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-black/10 focus:border-black/40 focus:ring-2 focus:ring-black/10"
          )}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <h3 className="text-[13px] font-semibold text-black pt-3 border-t border-black/10">
        {ar.checkout.shippingInfo}
      </h3>

      <div>
        <label htmlFor="order-wilaya" className="block text-[13px] font-medium text-black mb-1">
          {ar.checkout.wilaya}
        </label>
        <select
          id="order-wilaya"
          ref={wilayaRef}
          value={wilayaCode}
          onChange={(e) => setWilayaCode(e.target.value)}
          onBlur={() => handleBlur("wilaya")}
          disabled={zonesLoading || !!zonesError}
          className={cn(
            "w-full px-3 py-3 text-base border rounded-lg outline-none transition-all bg-white",
            errors.wilaya
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-black/10 focus:border-black/40 focus:ring-2 focus:ring-black/10",
            (zonesLoading || !!zonesError) && "opacity-60 cursor-not-allowed"
          )}
        >
          <option value="">
            {zonesLoading ? ar.checkout.loadingWilayas : ar.checkout.selectWilaya}
          </option>
          {zones.map((zone) => (
            <option key={zone.wilaya_code} value={zone.wilaya_code}>
              {formatZoneLabel(zone)}
            </option>
          ))}
        </select>
        {errors.wilaya && <p className="text-xs text-red-500 mt-1">{errors.wilaya}</p>}
        {zonesError && <p className="text-xs text-red-500 mt-1">{zonesError}</p>}
      </div>

      <div>
        <span className="block text-[13px] font-medium text-black mb-1">
          {ar.checkout.deliveryMethod}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(["home", "office"] as DeliveryType[]).map((type) => {
            const price = getDeliveryPrice(selectedZone, type);
            const checked = deliveryType === type;
            return (
              <label
                key={type}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-3 rounded-lg border cursor-pointer text-base transition-colors",
                  checked
                    ? "border-black bg-gray-50"
                    : "border-black/10 hover:border-black/30"
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="order-delivery-type"
                    value={type}
                    checked={checked}
                    onChange={() => setDeliveryType(type)}
                    className="accent-black"
                  />
                  {DELIVERY_TYPE_LABEL[type]}
                </span>
                <span className="font-medium text-black/70">
                  {selectedZone ? <Price value={price} /> : "—"}
                </span>
              </label>
            );
          })}
        </div>
        {!selectedZone && (
          <p className="text-xs text-black/50 mt-1">{ar.checkout.selectWilayaHint}</p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium text-black mb-1">
          {ar.checkout.shippingAddress}
        </label>
        <textarea
          ref={addressRef}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => handleBlur("address")}
          placeholder={ar.checkout.addressPlaceholder}
          rows={2}
          className={cn(
            "w-full px-3 py-3 text-base border rounded-lg outline-none transition-all resize-none",
            errors.address
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-black/10 focus:border-black/40 focus:ring-2 focus:ring-black/10"
          )}
        />
        {errors.address && (
          <p className="text-xs text-red-500 mt-1">{errors.address}</p>
        )}
      </div>

      <div className="rounded-lg border border-black/10 p-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-black/60">{ar.checkout.subtotal}</span>
          <span><Price value={subtotal} /></span>
        </div>
        {discountTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-black/60">{ar.checkout.discount}</span>
            <span className="text-red-600">-<Price value={discountTotal} /></span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-black/60">
            {ar.checkout.delivery}
            {selectedZone ? ` (${DELIVERY_TYPE_LABEL[deliveryType]})` : ""}
          </span>
          <span>{selectedZone ? <Price value={deliveryPrice} /> : "—"}</span>
        </div>
        <hr className="border-t-black/10" />
        <div className="flex items-center justify-between font-bold text-base">
          <span>{ar.checkout.total}</span>
          <span>{selectedZone ? <Price value={orderTotal} /> : "—"}</span>
        </div>
        <p className="text-[11px] text-black/50">{ar.checkout.codNote}</p>
      </div>

      {/* Honeypot field: hidden from humans, bots that fill it are rejected. */}
      <div className="hidden" aria-hidden="true">
        <label>
          {ar.checkout.company}
          <input
            type="text"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Desktop: single primary button at the end of the form. */}
      <div className="hidden md:block">{submitButton("inline")}</div>
      {/* Extra breathing room so the mobile sticky bar never sits on the
          last field (LayoutSpacing covers the footer). */}
      <div className="md:hidden h-2" />

      {/* Mobile: always-visible sticky action bar with live total. */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-black/10 px-4 pt-3 flex items-center gap-3"
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 0.75rem)`,
          ...(keyboardOffset > 0 ? { bottom: keyboardOffset } : null),
        }}
      >
        <div className="flex flex-col shrink-0">
          <span className="text-[11px] text-black/50 leading-tight">
            {selectedZone || offer
              ? ar.checkout.total
              : ar.checkout.subtotal}
          </span>
          <span className="font-bold text-base text-black leading-tight">
            {/* No wilaya yet: delivery is unknown, so show the goods
                total instead of a dash. With a quantity tier selected that
                is the tier's fixed total price. */}
            <Price value={selectedZone ? orderTotal : goodsTotal} />
          </span>
        </div>
        {submitButton("sticky")}
      </div>
    </div>
  );
}
