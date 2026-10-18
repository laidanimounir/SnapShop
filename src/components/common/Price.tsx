import React from "react";
import { formatStorePrice } from "@/lib/store/i18n-ar";

type PriceProps = {
  value: number;
  className?: string;
};

/**
 * Storefront price: "12.00 DA" wrapped in a bidi-isolated LTR container so the
 * amount and currency never reorder inside RTL text.
 */
const Price = ({ value, className }: PriceProps) => (
  <bdi dir="ltr" className={className}>
    {formatStorePrice(value)}
  </bdi>
);

export default Price;
