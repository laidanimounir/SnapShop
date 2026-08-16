"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      className="font-medium text-sm px-1.5 sm:text-base w-fit text-black bg-transparent cursor-pointer"
    >
      <option value="most-popular">Most Popular</option>
      <option value="low-price">Low Price</option>
      <option value="high-price">High Price</option>
      <option value="newest">Newest</option>
    </select>
  );
};

export default SortSelect;
