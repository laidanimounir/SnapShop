"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import GuestCheckoutForm from "@/components/checkout/GuestCheckoutForm";
import { useRouter } from "next/navigation";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";

type BuyNowModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  quantity: number;
  title: string;
  image: string;
  color: string | null;
  size: string | null;
  price: number;
};

const BuyNowModal = ({
  open,
  onOpenChange,
  variantId,
  quantity,
  title,
  image,
  color,
  size,
  price,
}: BuyNowModalProps) => {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn([integralCF.className, "text-xl"])}>
            Quick Checkout
          </DialogTitle>
          <DialogDescription className="text-sm text-black/60">
            Confirm your details to place the order
          </DialogDescription>
        </DialogHeader>

        <GuestCheckoutForm
          items={[{ variant_id: variantId, quantity }]}
          onSuccess={(token) => {
            onOpenChange(false);
            router.push(`/order-confirmation/${token}`);
          }}
          summary={
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 rounded-lg bg-[#F0EEED] overflow-hidden shrink-0">
                <img src={image} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">{title}</p>
                {[color, size].filter(Boolean).join(" / ") && (
                  <p className="text-xs text-black/60">
                    {[color, size].filter(Boolean).join(" / ")}
                  </p>
                )}
                <p className="text-sm font-bold text-black">
                  {formatPrice(price * quantity)}
                </p>
              </div>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default BuyNowModal;
