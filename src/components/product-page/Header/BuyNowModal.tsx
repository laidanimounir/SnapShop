"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Product } from "@/types/product.types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { addToCart } from "@/lib/features/carts/cartsSlice";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";

interface BuyNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Product;
}

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

const validateField = (
  field: keyof FieldErrors,
  value: string
): string | undefined => {
  switch (field) {
    case "customerName": return validateName(value);
    case "phone": return validatePhone(value);
    case "address": return validateAddress(value);
    default: return undefined;
  }
};

const BuyNowModal = ({ open, onOpenChange, data }: BuyNowModalProps) => {
  const dispatch = useAppDispatch();
  const { sizeSelection, colorSelection } = useAppSelector(
    (state) => state.products
  );
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem("snapshop_customer_info");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.address) setAddress(parsed.address);
          if (parsed.quantity) setQuantity(parsed.quantity);
        }
      } catch {
      }
    }
  }, [open]);

  const errors: FieldErrors = {
    customerName: touched.customerName ? validateName(customerName) : undefined,
    phone: touched.phone ? validatePhone(phone) : undefined,
    address: touched.address ? validateAddress(address) : undefined,
  };

  const hasErrors = !!errors.customerName || !!errors.phone || !!errors.address;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleConfirm = () => {
    const allTouched = { customerName: true, phone: true, address: true };
    setTouched(allTouched);

    const nameErr = validateName(customerName);
    const phoneErr = validatePhone(phone);
    const addrErr = validateAddress(address);
    if (nameErr || phoneErr || addrErr) return;

    setIsSubmitting(true);

    try {
      localStorage.setItem(
        "snapshop_customer_info",
        JSON.stringify({ customerName: customerName.trim(), phone: phone.trim(), address: address.trim(), quantity })
      );
    } catch {
    }

    dispatch(
      addToCart({
        id: data.id,
        name: data.title,
        srcUrl: data.srcUrl,
        price: data.price,
        attributes: [sizeSelection, colorSelection.name],
        discount: data.discount,
        quantity,
      })
    );

    setTimeout(() => {
      setSubmitted(true);
      setCustomerName("");
      setPhone("");
      setAddress("");
      setQuantity(1);

      setTimeout(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        onOpenChange(false);
      }, 1500);
    }, 600);
  };

  const finalPrice = data.discount.percentage > 0
    ? Math.round(data.price - (data.price * data.discount.percentage) / 100)
    : data.discount.amount > 0
    ? Math.round(data.price - data.discount.amount)
    : data.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className={cn([integralCF.className, "text-xl"])}>
            Quick Checkout
          </DialogTitle>
          <DialogDescription className="text-sm text-black/60">
            Confirm your details to place the order
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-black">Order placed successfully!</p>
            <p className="text-xs text-black/60 mt-1">We will contact you shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 rounded-lg bg-[#F0EEED] overflow-hidden shrink-0">
                <img src={data.srcUrl} alt={data.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{data.title}</p>
                <p className="text-xs text-black/60">
                  {sizeSelection} / {colorSelection.name}
                </p>
                <p className="text-sm font-bold text-black">DA {finalPrice}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center text-sm hover:bg-gray-100 transition-all"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center text-sm hover:bg-gray-100 transition-all"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

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
                  errors.customerName
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/10 focus:border-black/30"
                )}
              />
              {errors.customerName && (
                <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
              )}
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
                  errors.phone
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/10 focus:border-black/30"
                )}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
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
                  errors.address
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/10 focus:border-black/30"
                )}
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-black">Total:</span>
              <span className="text-lg font-bold text-brand-accent">DA {finalPrice * quantity}</span>
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuyNowModal;
