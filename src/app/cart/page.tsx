"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import GuestCheckoutForm from "@/components/checkout/GuestCheckoutForm";
import { cn } from "@/lib/utils";
import { cairo } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { TbBasketExclamation } from "react-icons/tb";
import React, { useState } from "react";
import { RootState } from "@/lib/store";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { clearCart } from "@/lib/features/carts/cartsSlice";
import { formatPrice } from "@/lib/pricing";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, subtotal, total } = useAppSelector(
    (state: RootState) => state.carts
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const discount = subtotal - total;
  const items = (cart?.items ?? []).map((i) => ({
    variant_id: i.variant_id,
    quantity: i.quantity,
  }));

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        {cart && cart.items.length > 0 ? (
          <>
            <BreadcrumbCart />
            <h2
              className={cn([
                cairo.className,
                "font-bold text-[32px] md:text-[40px] text-black uppercase mb-5 md:mb-6",
              ])}
            >
              your cart
            </h2>
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              <div className="w-full p-3.5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10">
                {cart?.items.map((product, idx, arr) => (
                  <React.Fragment key={product.variant_id}>
                    <ProductCard data={product} />
                    {arr.length - 1 !== idx && <hr className="border-t-black/10" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-black/10">
                <h6 className="text-xl md:text-2xl font-bold text-black">
                  Order Summary
                </h6>
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">Subtotal</span>
                    <span className="md:text-xl font-bold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">Discount</span>
                    <span className="md:text-xl font-bold text-red-600">
                      -{formatPrice(discount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black/60">Delivery Fee</span>
                    <span className="md:text-xl font-bold text-black/60">
                      Calculated at checkout
                    </span>
                  </div>
                  <hr className="border-t-black/10" />
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-black">
                      Total before delivery
                    </span>
                    <span className="text-xl md:text-2xl font-bold">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  className="text-sm md:text-base font-medium bg-brand-primary rounded-full w-full py-4 h-[54px] md:h-[60px] group"
                  onClick={() => setCheckoutOpen(true)}
                >
                  Go to Checkout{" "}
                  <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-gray-300 mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">Your shopping cart is empty.</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">Shop</Link>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={cn([cairo.className, "text-xl"])}>
              Checkout
            </DialogTitle>
            <DialogDescription className="text-sm text-black/60">
              Confirm your details to place the order
            </DialogDescription>
          </DialogHeader>
          <GuestCheckoutForm
            items={items}
            subtotal={subtotal}
            discountTotal={discount}
            onSuccess={(token) => {
              dispatch(clearCart());
              setCheckoutOpen(false);
              router.push(`/order-confirmation/${token}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
