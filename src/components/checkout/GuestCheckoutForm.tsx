"use client";

import React, { useEffect, useMemo, useState } from "react";
import { placeGuestOrder } from "@/lib/api/orders";
import type { OrderItemPayload } from "@/lib/api/orders";
import { fetchDeliveryZones } from "@/lib/api/delivery";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  DELIVERY_TYPE_LABEL,
  formatZoneLabel,
  getDeliveryPrice,
  getOrderTotal,
  type DeliveryType,
  type DeliveryZone,
} from "@/lib/delivery";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type FieldErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
  wilaya?: string;
};

const validateName = (value: string): string | undefined =>
  !value.trim() ? "Please enter your full name" : undefined;

const validatePhone = (value: string): string | undefined => {
  if (!value.trim()) return "Please enter your phone number";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return "Phone number must have at least 8 digits";
  return undefined;
};

const validateAddress = (value: string): string | undefined =>
  !value.trim() ? "Please enter your shipping address" : undefined;

export default function GuestCheckoutForm({
  items,
  onSuccess,
  summary,
  subtotal,
  discountTotal = 0,
}: {
  items: OrderItemPayload[];
  onSuccess: (token: string) => void;
  summary?: React.ReactNode;
  subtotal: number;
  discountTotal?: number;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [wilayaCode, setWilayaCode] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("home");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout attempt: reused across retries so a retry
  // returns the existing order instead of creating a duplicate.
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  // Honeypot: hidden from humans; bots that fill it are rejected.
  const [company, setCompany] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchDeliveryZones()
      .then((rows) => {
        if (!cancelled) {
          setZones(rows);
          setZonesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setZonesError(
            "Could not load delivery options. Please refresh the page and try again."
          );
          setZonesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedZone = useMemo(
    () => zones.find((z) => z.wilaya_code === Number(wilayaCode)) ?? null,
    [zones, wilayaCode]
  );

  const deliveryPrice = getDeliveryPrice(selectedZone, deliveryType);
  const orderTotal = getOrderTotal(subtotal, discountTotal, deliveryPrice);

  const errors: FieldErrors = {
    customerName: touched.customerName ? validateName(customerName) : undefined,
    phone: touched.phone ? validatePhone(phone) : undefined,
    address: touched.address ? validateAddress(address) : undefined,
    wilaya:
      touched.wilaya && zones.length > 0 && !wilayaCode
        ? "Please select your wilaya"
        : undefined,
  };

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleConfirm = async () => {
    setTouched({ customerName: true, phone: true, address: true, wilaya: true });
    const nameErr = validateName(customerName);
    const phoneErr = validatePhone(phone);
    const addrErr = validateAddress(address);
    const wilayaErr = zones.length > 0 && !wilayaCode ? "wilaya" : undefined;
    if (nameErr || phoneErr || addrErr || wilayaErr) return;

    if (zonesError || zonesLoading) {
      setError(
        zonesError ??
          "Delivery options are still loading. Please try again in a moment."
      );
      return;
    }

    if (company.trim() !== "") {
      setError("Something went wrong placing your order. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const attemptKey = idempotencyKey ?? createIdempotencyKey();
      setIdempotencyKey(attemptKey);
      const result = await placeGuestOrder({
        guest_name: customerName.trim(),
        guest_phone: phone.trim(),
        guest_address: address.trim(),
        items,
        idempotency_key: attemptKey,
        wilaya_code: Number(wilayaCode),
        delivery_type: deliveryType,
      });
      setIdempotencyKey(null);
      onSuccess(result.confirmation_token);
    } catch (e) {
      // placeGuestOrder already maps server errors to user-facing text.
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong placing your order. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {summary}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-black mb-1">Customer Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onBlur={() => handleBlur("customerName")}
          placeholder="Your full name"
          className={cn(
            "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all",
            errors.customerName ? "border-red-400 focus:border-red-500" : "border-black/10 focus:border-black/30"
          )}
        />
        {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => handleBlur("phone")}
          placeholder="+213 5XX XX XX XX"
          className={cn(
            "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all",
            errors.phone ? "border-red-400 focus:border-red-500" : "border-black/10 focus:border-black/30"
          )}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="checkout-wilaya" className="block text-xs font-medium text-black mb-1">
          Wilaya
        </label>
        <select
          id="checkout-wilaya"
          value={wilayaCode}
          onChange={(e) => setWilayaCode(e.target.value)}
          onBlur={() => handleBlur("wilaya")}
          disabled={zonesLoading || !!zonesError}
          className={cn(
            "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all bg-white",
            errors.wilaya ? "border-red-400 focus:border-red-500" : "border-black/10 focus:border-black/30",
            (zonesLoading || !!zonesError) && "opacity-60 cursor-not-allowed"
          )}
        >
          <option value="">
            {zonesLoading ? "Loading wilayas…" : "Select your wilaya"}
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
        <span className="block text-xs font-medium text-black mb-1">Delivery Method</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(["home", "office"] as DeliveryType[]).map((type) => {
            const price = getDeliveryPrice(selectedZone, type);
            const checked = deliveryType === type;
            return (
              <label
                key={type}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors",
                  checked
                    ? "border-black bg-gray-50"
                    : "border-black/10 hover:border-black/30"
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delivery-type"
                    value={type}
                    checked={checked}
                    onChange={() => setDeliveryType(type)}
                    className="accent-black"
                  />
                  {DELIVERY_TYPE_LABEL[type]}
                </span>
                <span className="font-medium text-black/70">
                  {selectedZone ? formatPrice(price) : "—"}
                </span>
              </label>
            );
          })}
        </div>
        {!selectedZone && (
          <p className="text-xs text-black/50 mt-1">
            Select a wilaya to see delivery prices.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-black mb-1">Shipping Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => handleBlur("address")}
          placeholder="Street, building, landmarks"
          rows={2}
          className={cn(
            "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all resize-none",
            errors.address ? "border-red-400 focus:border-red-500" : "border-black/10 focus:border-black/30"
          )}
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>

      <div className="rounded-lg border border-black/10 p-3 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-black/60">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-black/60">Discount</span>
            <span className="text-red-600">-{formatPrice(discountTotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-black/60">
            Delivery{selectedZone ? ` (${DELIVERY_TYPE_LABEL[deliveryType]})` : ""}
          </span>
          <span>{selectedZone ? formatPrice(deliveryPrice) : "—"}</span>
        </div>
        <hr className="border-t-black/10" />
        <div className="flex items-center justify-between font-bold text-base">
          <span>Total</span>
          <span>{selectedZone ? formatPrice(orderTotal) : "—"}</span>
        </div>
        <p className="text-[11px] text-black/50">
          Cash on delivery. The final total is recalculated by the server.
        </p>
      </div>

      {/* Honeypot field: hidden from humans, bots that fill it are rejected. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
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
        onClick={handleConfirm}
        disabled={isSubmitting || zonesLoading}
        className="w-full py-3 rounded-full bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {isSubmitting ? "Processing..." : "Confirm Purchase"}
      </button>
    </div>
  );
}
