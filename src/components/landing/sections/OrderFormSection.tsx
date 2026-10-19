"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { IoMdCheckmark } from "react-icons/io";
import Price from "@/components/common/Price";
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
import type { LandingOrderData, LandingVariant } from "@/lib/landing/order-data";
import { orderFormSectionSchema } from "@/lib/landing/sections";
import {
  getDiscountAmount,
  getEffectivePrice,
  round2,
} from "@/lib/pricing";
import {
  isValidQuantity,
  MAX_QUANTITY_PER_VARIANT,
} from "@/lib/quantity";
import { sortSizes } from "@/lib/sizes";
import { ar, formatAr } from "@/lib/store/i18n-ar";
import { cn } from "@/lib/utils";
import SectionShell from "./SectionShell";

type OrderFormSectionProps = {
  section: unknown;
  /** Server-shaped product data; undefined = not provided (e.g. preview). */
  order?: LandingOrderData | null;
  /** Admin preview: same UI, but submission is disabled. */
  preview?: boolean;
};

const inputCls =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-black outline-none transition-colors placeholder:text-black/40";

export default function OrderFormSection({
  section,
  order,
  preview = false,
}: OrderFormSectionProps) {
  const parsed = orderFormSectionSchema.safeParse(section);
  const active = parsed.success && !parsed.data.hidden;
  const props = parsed.success ? parsed.data.props : null;

  const variants = useMemo<LandingVariant[]>(
    () =>
      order && Array.isArray(order.variants)
        ? order.variants.filter((v) => v && typeof v.id === "string" && v.id)
        : [],
    [order]
  );
  const zones = useMemo(
    () => (order && Array.isArray(order.zones) ? order.zones : []),
    [order]
  );

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of variants) {
      if (v.color && !map.has(v.color)) map.set(v.color, v.colorHex ?? "");
    }
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);
  const hasColors = colors.length > 0;

  const isColorAvailable = (name: string) =>
    variants.some((v) => v.color === name && v.stock > 0);

  const defaultColor = useMemo(
    () =>
      colors.find((c) =>
        variants.some((v) => v.color === c.name && v.stock > 0)
      )?.name ??
      colors[0]?.name ??
      null,
    [colors, variants]
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(defaultColor);

  useEffect(() => {
    if (!hasColors) {
      setSelectedColor(null);
      return;
    }
    setSelectedColor((prev) =>
      prev && colors.some((c) => c.name === prev) ? prev : defaultColor
    );
  }, [colors, hasColors, defaultColor]);

  const optionsForColor = useMemo(
    () =>
      variants.filter((v) =>
        hasColors ? v.color === selectedColor : v.color == null
      ),
    [variants, hasColors, selectedColor]
  );

  const sizeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const v of optionsForColor) if (v.size) set.add(v.size);
    return sortSizes(Array.from(set), order?.sizeType);
  }, [optionsForColor, order?.sizeType]);
  const hasSizes = sizeOptions.length > 0;

  const firstInStockSize = useMemo(
    () =>
      sizeOptions.find((size) =>
        optionsForColor.some((v) => v.size === size && v.stock > 0)
      ) ?? null,
    [sizeOptions, optionsForColor]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(
    firstInStockSize ?? sizeOptions[0] ?? null
  );

  useEffect(() => {
    if (!hasSizes) {
      setSelectedSize(null);
      return;
    }
    setSelectedSize((prev) =>
      prev && sizeOptions.includes(prev)
        ? prev
        : firstInStockSize ?? sizeOptions[0] ?? null
    );
  }, [hasSizes, sizeOptions, firstInStockSize]);

  const variantForSize = (size: string) =>
    optionsForColor.find((v) => v.size === size) ?? null;

  const selectedVariant = useMemo<LandingVariant | null>(() => {
    const found =
      variants.find(
        (v) =>
          (hasColors ? v.color === selectedColor : v.color == null) &&
          (hasSizes ? v.size === selectedSize : v.size == null)
      ) ?? null;
    // Single-variant products resolve even before any choice is made.
    if (!found && variants.length === 1) return variants[0];
    return found;
  }, [variants, hasColors, hasSizes, selectedColor, selectedSize]);

  const unitPrice = order
    ? getEffectivePrice(order.basePrice, selectedVariant?.price ?? null)
    : 0;
  const unitDiscount = order
    ? getDiscountAmount(
        unitPrice,
        order.discountPercentage,
        order.discountAmount
      )
    : 0;
  const stock = selectedVariant?.stock ?? 0;
  const maxQuantity = Math.max(
    1,
    Math.min(MAX_QUANTITY_PER_VARIANT, stock)
  );

  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity((q) => Math.min(Math.max(1, q), maxQuantity));
  }, [maxQuantity]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilayaCode, setWilayaCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const wilayaRef = useRef<HTMLSelectElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  const selectedZone = useMemo(
    () => zones.find((z) => z.wilaya_code === Number(wilayaCode)) ?? null,
    [zones, wilayaCode]
  );

  // The delivery method selector can be hidden by the section settings;
  // ordering still needs a type, so it falls back to home delivery.
  const effectiveDeliveryType: DeliveryType = props?.showShipping
    ? deliveryType
    : "home";

  const subtotal = round2(unitPrice * quantity);
  const discountTotal = round2(unitDiscount * quantity);
  const deliveryPrice = getDeliveryPrice(selectedZone, effectiveDeliveryType);
  const orderTotal = getOrderTotal(subtotal, discountTotal, deliveryPrice);

  const errors: FieldErrors = {
    customerName: touched.customerName ? validateName(customerName) : undefined,
    phone: touched.phone ? validatePhone(phone) : undefined,
    address: touched.address ? validateAddress(address) : undefined,
    wilaya: touched.wilaya
      ? validateWilaya(wilayaCode, zones.length > 0)
      : undefined,
  };

  const blockedReason: string | null = (() => {
    if (variants.length === 0) return ar.product.unavailable;
    if (stock <= 0) return ar.product.outOfStock;
    if (!selectedVariant) return ar.product.unavailable;
    if (hasColors && !selectedColor) return ar.product.pickColor;
    if (hasSizes && !selectedSize) return ar.product.pickSize;
    if (!isValidQuantity(quantity) || quantity > stock) return ar.product.outOfStock;
    if (zones.length === 0) return ar.checkout.validation.zonesError;
    return null;
  })();
  const isBlocked = blockedReason !== null;

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const scrollToFirstInvalid = (fieldErrors: FieldErrors) => {
    const order_: [string | undefined, RefObject<HTMLElement | null>][] = [
      [fieldErrors.customerName, nameRef],
      [fieldErrors.phone, phoneRef],
      [fieldErrors.wilaya, wilayaRef],
      [fieldErrors.address, addressRef],
    ];
    const first = order_.find(([err]) => Boolean(err));
    if (!first) return;
    const el = first[1].current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  };

  // Step 4 replaces the body of this handler with the placeGuestOrder call.
  const handleSubmit = () => {
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
  };

  if (!active || !props) return null;

  const title = props.title || "اطلب الآن";

  if (!order || variants.length === 0) {
    return (
      <SectionShell id="order-form">
        <div className="rounded-[var(--lp-btn-radius)] border-2 border-dashed border-black/20 p-6 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="mt-2 text-sm opacity-70">{ar.product.unavailable}</p>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell id="order-form">
      <div className="rounded-[var(--lp-btn-radius)] border border-black/10 bg-white p-4 text-black shadow-sm sm:p-5">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>

        {preview && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {ar.product.previewNotice}
          </p>
        )}

        {hasColors && (
          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium">
              {ar.product.selectColors}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((color) => {
                const available = isColorAvailable(color.name);
                const selected = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    type="button"
                    disabled={!available}
                    aria-label={
                      available
                        ? color.name
                        : formatAr(ar.product.optionUnavailable, {
                            name: color.name,
                          })
                    }
                    aria-pressed={selected}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-full border border-black/15 transition-shadow",
                      selected && "ring-2 ring-black ring-offset-2",
                      !available && "cursor-not-allowed opacity-50"
                    )}
                    style={{
                      backgroundColor: color.hex || "#d1d5db",
                      backgroundImage: available
                        ? undefined
                        : "linear-gradient(to top right, transparent 46%, rgba(0,0,0,0.55) 46%, rgba(0,0,0,0.55) 54%, transparent 54%)",
                    }}
                  >
                    {selected && available && (
                      <IoMdCheckmark className="text-base text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasSizes && (
          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium">
              {ar.product.chooseSize}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {sizeOptions.map((size) => {
                const variant = variantForSize(size);
                const available = (variant?.stock ?? 0) > 0;
                const selected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={
                      available
                        ? size
                        : formatAr(ar.product.optionUnavailable, { name: size })
                    }
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-[48px] rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      selected && available
                        ? "border-transparent bg-black text-white"
                        : "border-black/15 bg-[#F5F5F5] text-black hover:border-black/30",
                      !available &&
                        "cursor-not-allowed border-black/10 bg-transparent text-black/40 line-through"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium">
            {ar.product.quantity}
          </span>
          <div className="inline-flex items-center gap-4 rounded-full bg-[#F0F0F0] px-4 py-2">
            <button
              type="button"
              className="h-6 w-6 text-xl leading-none disabled:opacity-40"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="-"
            >
              -
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              type="button"
              className="h-6 w-6 text-xl leading-none disabled:opacity-40"
              onClick={() =>
                setQuantity((q) => Math.min(maxQuantity, q + 1))
              }
              disabled={quantity >= maxQuantity}
              aria-label="+"
            >
              +
            </button>
          </div>
          {props.showStock && selectedVariant && stock > 0 && (
            <p className="mt-2 text-xs text-black/60">
              {formatAr(ar.product.remainingStock, { n: stock })}
            </p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label
              htmlFor="lp-order-name"
              className="mb-1 block text-xs font-medium"
            >
              {ar.checkout.customerName}
            </label>
            <input
              id="lp-order-name"
              ref={nameRef}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onBlur={() => handleBlur("customerName")}
              placeholder={ar.checkout.fullName}
              className={cn(
                inputCls,
                errors.customerName
                  ? "border-red-400 focus:border-red-500"
                  : "border-black/15 focus:border-black/40"
              )}
            />
            {errors.customerName && (
              <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lp-order-phone"
              className="mb-1 block text-xs font-medium"
            >
              {ar.checkout.phoneNumber}
            </label>
            <input
              id="lp-order-phone"
              ref={phoneRef}
              type="tel"
              dir="ltr"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder={ar.checkout.phonePlaceholder}
              className={cn(
                inputCls,
                "text-start",
                errors.phone
                  ? "border-red-400 focus:border-red-500"
                  : "border-black/15 focus:border-black/40"
              )}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lp-order-wilaya"
              className="mb-1 block text-xs font-medium"
            >
              {ar.checkout.wilaya}
            </label>
            <select
              id="lp-order-wilaya"
              ref={wilayaRef}
              value={wilayaCode}
              onChange={(e) => setWilayaCode(e.target.value)}
              onBlur={() => handleBlur("wilaya")}
              disabled={zones.length === 0}
              className={cn(
                inputCls,
                errors.wilaya
                  ? "border-red-400 focus:border-red-500"
                  : "border-black/15 focus:border-black/40",
                zones.length === 0 && "cursor-not-allowed opacity-60"
              )}
            >
              <option value="">{ar.checkout.selectWilaya}</option>
              {zones.map((zone) => (
                <option key={zone.wilaya_code} value={zone.wilaya_code}>
                  {formatZoneLabel(zone)}
                </option>
              ))}
            </select>
            {errors.wilaya && (
              <p className="mt-1 text-xs text-red-600">{errors.wilaya}</p>
            )}
            {zones.length === 0 && (
              <p className="mt-1 text-xs text-red-600">
                {ar.checkout.validation.zonesError}
              </p>
            )}
          </div>

          {props.showShipping && (
            <div>
              <span className="mb-1 block text-xs font-medium">
                {ar.checkout.deliveryMethod}
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["home", "office"] as DeliveryType[]).map((type) => {
                  const checked = deliveryType === type;
                  const price = getDeliveryPrice(selectedZone, type);
                  return (
                    <label
                      key={type}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                        checked
                          ? "border-black bg-gray-50"
                          : "border-black/15 hover:border-black/40"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="lp-order-delivery-type"
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
                <p className="mt-1 text-xs text-black/50">
                  {ar.checkout.selectWilayaHint}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="lp-order-address"
              className="mb-1 block text-xs font-medium"
            >
              {ar.checkout.shippingAddress}
            </label>
            <textarea
              id="lp-order-address"
              ref={addressRef}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => handleBlur("address")}
              placeholder={ar.checkout.addressPlaceholder}
              rows={2}
              className={cn(
                inputCls,
                "resize-none",
                errors.address
                  ? "border-red-400 focus:border-red-500"
                  : "border-black/15 focus:border-black/40"
              )}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lp-order-note"
              className="mb-1 block text-xs font-medium"
            >
              {ar.checkout.note}
            </label>
            <textarea
              id="lp-order-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={ar.checkout.notePlaceholder}
              rows={2}
              maxLength={300}
              className={cn(inputCls, "resize-none border-black/15 focus:border-black/40")}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-black/10 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-black/60">
              {ar.checkout.subtotal}
              {quantity > 1 ? ` × ${quantity}` : ""}
            </span>
            <span>
              <Price value={subtotal} />
            </span>
          </div>
          {discountTotal > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-black/60">{ar.checkout.discount}</span>
              <span className="text-red-600">
                -<Price value={discountTotal} />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-black/60">
              {ar.checkout.delivery}
              {selectedZone
                ? ` (${DELIVERY_TYPE_LABEL[effectiveDeliveryType]})`
                : ""}
            </span>
            <span>{selectedZone ? <Price value={deliveryPrice} /> : "—"}</span>
          </div>
          <hr className="border-t-black/10" />
          <div className="flex items-center justify-between text-base font-bold">
            <span>{ar.checkout.total}</span>
            <span>{selectedZone ? <Price value={orderTotal} /> : "—"}</span>
          </div>
          <p className="text-[11px] text-black/50">{ar.checkout.codNote}</p>
        </div>

        {/* Honeypot: hidden from humans, filled by bots (rejected in step 4). */}
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

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBlocked || preview}
          className={cn(
            "mt-4 w-full rounded-[var(--lp-btn-radius)] bg-[var(--lp-btn-bg)] px-6 py-3 text-base font-bold text-[var(--lp-btn-text)] transition-opacity",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isBlocked ? blockedReason : props.ctaText}
        </button>
      </div>
    </SectionShell>
  );
}
