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

const categories = ["t-shirts", "shorts", "shirts", "hoodie", "jeans"];
const dressStyles = ["casual", "formal", "party", "gym"];
const sizes = ["S", "M", "L", "XL", "XXL"];

const colorMap: Record<string, string> = {
  Red: "#dc2626",
  Green: "#16a34a",
  Blue: "#2563eb",
  Black: "#000000",
  White: "#ffffff",
  Yellow: "#eab308",
  Purple: "#9333ea",
  Pink: "#ec4899",
  Orange: "#ea580c",
  Gray: "#6b7280",
};
const colorNames = Object.keys(colorMap);

const Filters = () => {
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
  const activeStyle = searchParams.get("style") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || 500;

  const hasFilters = Boolean(
    activeCategory || activeStyle || activeColor || activeSize ||
      searchParams.get("minPrice") || searchParams.get("maxPrice")
  );

  return (
    <>
      <hr className="border-t-black/10" />

      <div className="flex flex-col space-y-0.5 text-black/60">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() =>
              setParam("category", activeCategory === category ? undefined : category)
            }
            className={cn(
              "flex items-center justify-between py-2 capitalize",
              activeCategory === category && "text-black font-medium"
            )}
          >
            {category} <MdKeyboardArrowRight />
          </button>
        ))}
      </div>
      <hr className="border-t-black/10" />

      <Accordion type="single" collapsible defaultValue="filter-price">
        <AccordionItem value="filter-price" className="border-none">
          <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
            Price
          </AccordionTrigger>
          <AccordionContent className="pt-4" contentClassName="overflow-visible">
            <Slider
              defaultValue={[minPrice, maxPrice]}
              min={0}
              max={500}
              step={5}
              label="DA"
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

      <Accordion type="single" collapsible defaultValue="filter-colors">
        <AccordionItem value="filter-colors" className="border-none">
          <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
            Colors
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="flex flex-wrap gap-2.5">
              {colorNames.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  className="rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-black/20"
                  style={{ backgroundColor: colorMap[color] }}
                  onClick={() => setParam("color", activeColor === color ? undefined : color)}
                >
                  {activeColor === color && (
                    <IoMdCheckmark
                      className={cn("text-base", color === "White" || color === "Yellow" ? "text-black" : "text-white")}
                    />
                  )}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <hr className="border-t-black/10" />

      <Accordion type="single" collapsible defaultValue="filter-size">
        <AccordionItem value="filter-size" className="border-none">
          <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
            Size
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="flex items-center flex-wrap">
              {sizes.map((size) => (
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

      <Accordion type="single" collapsible defaultValue="filter-style">
        <AccordionItem value="filter-style" className="border-none">
          <AccordionTrigger className="text-black font-bold text-xl hover:no-underline p-0 py-0.5">
            Dress Style
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-0">
            <div className="flex flex-col text-black/60 space-y-0.5">
              {dressStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setParam("style", activeStyle === style ? undefined : style)}
                  className={cn(
                    "flex items-center justify-between py-2 capitalize",
                    activeStyle === style && "text-black font-medium"
                  )}
                >
                  {style} <MdKeyboardArrowRight />
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="bg-black w-full rounded-full text-sm font-medium py-4 h-12 text-white"
        >
          Clear Filters
        </button>
      )}
    </>
  );
};

export default Filters;
