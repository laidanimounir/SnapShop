"use client";
import React, { useState } from "react";
import { Product } from "@/types/product.types";
import BuyNowModal from "./BuyNowModal";

const BuyNowBtn = ({ data }: { data: Product & { quantity: number } }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="bg-brand-accent w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-brand-accent/90 transition-all"
        onClick={() => setModalOpen(true)}
      >
        Buy Now
      </button>
      <BuyNowModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        data={data}
      />
    </>
  );
};

export default BuyNowBtn;
