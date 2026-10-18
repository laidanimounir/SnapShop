"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { IoMdCheckmark } from "react-icons/io";
import { MdKeyboardArrowRight } from "react-icons/md";
import { ar } from "@/lib/store/i18n-ar";
import type { ProductFacet } from "@/lib/api/products";

function isLightColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

const Filters = ({ facets }: { facets: ProductFacet }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`/shop?${params.toString()}`, { scroll: false });
  };

  const activeCategory = searchParams.get("category") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || facets.maxPrice;

  const hasFilters = Boolean(
    activeCategory ||
      activeColor ||
      activeSize ||
      searchParams.get("minPrice") ||
      searchParams.get("maxPrice")
  );

  return (
    <>
      <hr className="border-t-black/10" />

      <div className="flex flex-col space-y-0.5 text-black/60">
        {facets.categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() =>
              setParam("category", activeCategory === category ? undefined : category)
            }
            className={cn(
              "flex items-center justify-between py-2",
              activeCategory === category && "text-black font-medium"
            )}
          >
            {category}{" "}
            <MdKeyboardArrowRight className="rtl:rotate-180" />
          </button>
        ))}
      </div>
      <hr className="border-t-black/10" />

      <Accordion type="single" collapsible defaultValue="filter-price">
        <AccordionItem value="filter-price" className="border-none">
          <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
            {ar.shop.price}
          </AccordionTrigger>
          <AccordionContent className="pt-4" contentClassName="overflow-visible">
            <Slider
              defaultValue={[minPrice, maxPrice]}
              min={0}
              max={facets.maxPrice}
              step={5}
              onValueCommit={(values: number[]) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("minPrice", String(values[0]));
                params.set("maxPrice", String(values[1]));
                params.delete("page");
                router.push(`/shop?${params.toString()}`, { scroll: false });
              }}
            />
            <div className="mb-3" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <hr className="border-t-black/10" />

      {facets.colors.length > 0 && (
        <>
          <Accordion type="single" collapsible defaultValue="filter-colors">
            <AccordionItem value="filter-colors" className="border-none">
              <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
                {ar.shop.colors}
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-0">
                <div className="flex flex-wrap gap-2.5">
                  {facets.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      aria-label={color.name}
                      className="rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-black/20"
                      style={{ backgroundColor: color.hex || "#d1d5db" }}
                      onClick={() => setParam("color", activeColor === color.name ? undefined : color.name)}
                    >
                      {activeColor === color.name && (
                        <IoMdCheckmark
                          className={cn(
                            "text-base",
                            isLightColor(color.hex || "#d1d5db") ? "text-black" : "text-white"
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <hr className="border-t-black/10" />
        </>
      )}

      {facets.sizes.length > 0 && (
        <>
          <Accordion type="single" collapsible defaultValue="filter-size">
            <AccordionItem value="filter-size" className="border-none">
              <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
                {ar.shop.size}
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-0">
                <div className="flex items-center flex-wrap">
                  {facets.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={cn([
                        "bg-[#F0F0F0] m-1 flex items-center justify-center px-5 py-2.5 text-sm rounded-full max-h-[39px]",
                        activeSize === size && "bg-black font-medium text-white",
                      ])}
                      onClick={() => setParam("size", activeSize === size ? undefined : size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <hr className="border-t-black/10" />
        </>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="bg-black w-full rounded-full text-sm font-medium py-4 h-12 text-white"
        >
          {ar.shop.clearFilters}
        </button>
      )}
    </>
  );
};

export default Filters;
