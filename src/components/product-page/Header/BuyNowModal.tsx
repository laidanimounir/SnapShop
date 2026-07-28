"use client";
import React, { useState } from "react";
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

  const handleConfirm = () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) return;

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

    setSubmitted(true);
    setCustomerName("");
    setPhone("");
    setAddress("");
    setQuantity(1);

    setTimeout(() => {
      setSubmitted(false);
      onOpenChange(false);
    }, 1500);
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
                placeholder="Your full name"
                className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+213 5XX XX XX XX"
                className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Shipping Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, state"
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-black">Total:</span>
              <span className="text-lg font-bold text-brand-accent">DA {finalPrice * quantity}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!customerName.trim() || !phone.trim() || !address.trim()}
              className="w-full py-3 rounded-full bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Purchase
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuyNowModal;
