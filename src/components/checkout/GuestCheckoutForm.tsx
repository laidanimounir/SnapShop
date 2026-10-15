"use client";

import React, { useEffect, useState } from "react";
import { placeGuestOrder } from "@/lib/api/orders";
import type { OrderItemPayload } from "@/lib/api/orders";
import { createIdempotencyKey } from "@/lib/idempotency";
import { cn } from "@/lib/utils";

type FieldErrors = {
  customerName?: string;
  phone?: string;
  address?: string;
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
}: {
  items: OrderItemPayload[];
  onSuccess: (token: string) => void;
  summary?: React.ReactNode;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per checkout attempt: reused across retries so a retry
  // returns the existing order instead of creating a duplicate.
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [savedInfo, setSavedInfo] = useState<{
    customerName: string;
    phone: string;
    address: string;
  } | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("snapshop_customer_info");
      if (saved) setSavedInfo(JSON.parse(saved));
    } catch {
      setSavedInfo(null);
    }
  }, []);

  const applySavedInfo = () => {
    if (savedInfo) {
      setCustomerName(savedInfo.customerName);
      setPhone(savedInfo.phone);
      setAddress(savedInfo.address);
      setApplied(true);
    }
  };

  const errors: FieldErrors = {
    customerName: touched.customerName ? validateName(customerName) : undefined,
    phone: touched.phone ? validatePhone(phone) : undefined,
    address: touched.address ? validateAddress(address) : undefined,
  };

  const handleBlur = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleConfirm = async () => {
    setTouched({ customerName: true, phone: true, address: true });
    const nameErr = validateName(customerName);
    const phoneErr = validatePhone(phone);
    const addrErr = validateAddress(address);
    if (nameErr || phoneErr || addrErr) return;

    setIsSubmitting(true);
    setError(null);
    try {
      localStorage.setItem(
        "snapshop_customer_info",
        JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        })
      );
      const attemptKey = idempotencyKey ?? createIdempotencyKey();
      setIdempotencyKey(attemptKey);
      const result = await placeGuestOrder({
        guest_name: customerName.trim(),
        guest_phone: phone.trim(),
        guest_address: address.trim(),
        items,
        idempotency_key: attemptKey,
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

      {savedInfo && !applied && (
        <div className="flex items-center gap-2 p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-lg">
          <svg className="w-4 h-4 shrink-0 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-black/70 flex-1">
            Details found from a previous order.
            <button
              type="button"
              onClick={applySavedInfo}
              className="ml-1 text-brand-accent font-medium underline underline-offset-2 hover:no-underline"
            >
              Apply
            </button>
          </p>
          <button
            type="button"
            onClick={() => setSavedInfo(null)}
            className="text-black/30 hover:text-black/60 transition-all"
            aria-label="Dismiss saved details"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
        <label className="block text-xs font-medium text-black mb-1">Shipping Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onBlur={() => handleBlur("address")}
          placeholder="Street, city, state"
          rows={2}
          className={cn(
            "w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all resize-none",
            errors.address ? "border-red-400 focus:border-red-500" : "border-black/10 focus:border-black/30"
          )}
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isSubmitting}
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
