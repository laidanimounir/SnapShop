"use client";

import React from "react";
import { PiTrashFill } from "react-icons/pi";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import {
  CartItem,
  incrementItem,
  decrementItem,
  removeItem,
} from "@/lib/features/carts/cartsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { formatPrice } from "@/lib/pricing";

const ProductCard = ({ data }: { data: CartItem }) => {
  const dispatch = useAppDispatch();
  const slug = data.name.toLowerCase().split(" ").join("-");

  return (
    <div className="flex items-start space-x-4">
      <Link
        href={`/shop/product/${data.product_id}/${slug}`}
        className="bg-[#F0EEED] rounded-lg w-full min-w-[100px] max-w-[100px] sm:max-w-[124px] aspect-square overflow-hidden"
      >
        <Image
          src={data.srcUrl}
          width={124}
          height={124}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={data.name}
        />
      </Link>
      <div className="flex w-full self-stretch flex-col">
        <div className="flex items-center justify-between">
          <Link
            href={`/shop/product/${data.product_id}/${slug}`}
            className="text-black font-bold text-base xl:text-xl"
          >
            {data.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 md:h-9 md:w-9"
            onClick={() => dispatch(removeItem({ variant_id: data.variant_id }))}
          >
            <PiTrashFill className="text-xl md:text-2xl text-red-600" />
          </Button>
        </div>
        {(data.size || data.color) && (
          <div className="mb-auto -mt-1">
            {data.size && (
              <div>
                <span className="text-black text-xs md:text-sm mr-1">Size:</span>
                <span className="text-black/60 text-xs md:text-sm">{data.size}</span>
              </div>
            )}
            {data.color && (
              <div className="-mt-1.5">
                <span className="text-black text-xs md:text-sm mr-1">Color:</span>
                <span className="text-black/60 text-xs md:text-sm">{data.color}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center flex-wrap justify-between">
          <div className="flex items-center space-x-[5px] xl:space-x-2.5">
            <span className="font-bold text-black text-xl xl:text-2xl">
              {formatPrice(data.price)}
            </span>
            {data.price < data.originalPrice && (
              <span className="font-bold text-black/40 line-through text-xl xl:text-2xl">
                {formatPrice(data.originalPrice)}
              </span>
            )}
          </div>
          <div className="bg-[#F0F0F0] rounded-full flex items-center justify-between px-4 py-2.5 min-w-[105px] max-w-[105px] sm:max-w-32">
            <button
              type="button"
              className="h-6 w-6 text-xl"
              onClick={() => dispatch(decrementItem({ variant_id: data.variant_id }))}
            >
              -
            </button>
            <span className="font-medium text-sm sm:text-base">{data.quantity}</span>
            <button
              type="button"
              className="h-6 w-6 text-xl"
              onClick={() => dispatch(incrementItem({ variant_id: data.variant_id }))}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
