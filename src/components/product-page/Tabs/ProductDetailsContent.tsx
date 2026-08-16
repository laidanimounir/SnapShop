import React from "react";
import type { Product } from "@/types/product.types";

const ProductDetailsContent = ({ product }: { product: Product }) => {
  const specs: { label: string; value: string }[] = [
    { label: "Category", value: product.category ?? "-" },
    { label: "Brand", value: product.brand ?? "-" },
  ];

  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-black mb-5 sm:mb-6">
        Product details
      </h3>
      <p className="text-sm sm:text-base text-black/60 mb-6">{product.description}</p>
      <div className="grid grid-cols-3">
        {specs.map((item, i) => (
          <React.Fragment key={i}>
            <div>
              <p className="text-sm py-3 w-full leading-7 lg:py-4 pr-2 text-neutral-500">
                {item.label}
              </p>
            </div>
            <div className="col-span-2 py-3 lg:py-4 border-b">
              <p className="text-sm w-full leading-7 text-neutral-800 font-medium">
                {item.value}
              </p>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default ProductDetailsContent;
