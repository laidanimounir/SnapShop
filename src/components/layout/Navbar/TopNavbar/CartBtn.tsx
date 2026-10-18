"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ar } from "@/lib/store/i18n-ar";

const CartBtn = () => {
  const { cart } = useAppSelector((state: RootState) => state.carts);

  return (
    <Link href="/cart" className="relative me-[14px] p-1">
      <Image
        priority
        src="/icons/cart.svg"
        height={100}
        width={100}
        alt={ar.a11y.cart}
        className="max-w-[22px] max-h-[22px]"
      />
      {cart && cart.totalQuantities > 0 && (
        <span className="border bg-black text-white rounded-full w-fit-h-fit px-1 text-xs absolute -top-3 left-1/2 -translate-x-1/2">
          <bdi dir="ltr">{cart.totalQuantities}</bdi>
        </span>
      )}
    </Link>
  );
};

export default CartBtn;
