"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ar } from "@/lib/store/i18n-ar";

const SortSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "most-popular";

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  return (
    <select
      value={current}
      onChange={onChange}
      aria-label={ar.shop.sortBy}
      className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent cursor-pointer"
    >
      <option value="most-popular">{ar.shop.sort.mostPopular}</option>
      <option value="low-price">{ar.shop.sort.lowPrice}</option>
      <option value="high-price">{ar.shop.sort.highPrice}</option>
      <option value="newest">{ar.shop.sort.newest}</option>
    </select>
  );
};

export default SortSelect;
