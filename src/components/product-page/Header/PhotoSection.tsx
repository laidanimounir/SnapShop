"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { MAX_PRODUCT_IMAGES } from "@/lib/admin/images";
import { cn } from "@/lib/utils";

const PhotoSection = ({
  images,
  title,
  selected,
  onSelect,
}: {
  images: string[];
  title: string;
  selected: string;
  onSelect: (url: string) => void;
}) => {
  // Storefront shows 1 main image + up to 3 extras. Extra images on a
  // legacy product are hidden here, never deleted.
  const capped = images.slice(0, MAX_PRODUCT_IMAGES);
  const gallery = capped.filter((url) => url !== selected).slice(0, MAX_PRODUCT_IMAGES - 1);

  // ---- mobile: swipeable scroll-snap track + dots -------------------------
  const trackRef = useRef<HTMLDivElement>(null);
  const cappedKey = capped.join("|");
  const [index, setIndex] = useState(() => {
    const i = capped.indexOf(selected);
    return i >= 0 ? i : 0;
  });

  // Follow the parent's selection (thumbnail click, color switch): scroll the
  // mobile track to the matching slide without animating.
  useEffect(() => {
    const i = capped.indexOf(selected);
    const next = i >= 0 ? i : 0;
    setIndex(next);
    const el = trackRef.current;
    if (!el || el.dataset.index === String(next)) return;
    el.dataset.index = String(next);
    const direction = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: direction * next * el.clientWidth });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, cappedKey]);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const raw = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    const next = Math.min(Math.max(raw, 0), Math.max(capped.length - 1, 0));
    if (next !== index) {
      setIndex(next);
      el.dataset.index = String(next);
      if (capped[next]) onSelect(capped[next]);
    }
  };

  const goTo = (i: number) => {
    const el = trackRef.current;
    setIndex(i);
    if (capped[i]) onSelect(capped[i]);
    if (!el) return;
    el.dataset.index = String(i);
    const direction = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollTo({ left: direction * i * el.clientWidth, behavior: "smooth" });
  };

  const placeholder = (
    <div
      className="flex flex-col items-center justify-center gap-3 w-full h-full text-black/35 py-14"
      role="img"
      aria-label={title}
    >
      <ImageOff className="w-12 h-12 sm:w-16 sm:h-16" strokeWidth={1.25} aria-hidden="true" />
    </div>
  );

  if (capped.length === 0) {
    return (
      <div className="flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full aspect-[4/5] max-h-[440px] sm:max-h-[500px] lg:aspect-auto lg:h-full lg:max-h-[530px] lg:min-h-[380px] xl:min-h-[530px] overflow-hidden mb-2 sm:mb-3 lg:mb-0">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:gap-3.5">
      {/* Desktop: thumbnail column. */}
      {gallery.length > 0 && (
        <div className="hidden lg:flex flex-col gap-3.5 w-fit items-start justify-start">
          {gallery.map((photo) => (
            <button
              key={photo}
              type="button"
              className="bg-[#F0EEED] rounded-[13px] xl:rounded-[20px] w-full max-w-[111px] xl:max-w-[152px] max-h-[106px] xl:max-h-[167px] xl:min-h-[167px] aspect-square overflow-hidden"
              onClick={() => onSelect(photo)}
            >
              <Image
                src={photo}
                width={152}
                height={167}
                sizes="(min-width: 1024px) 152px, 111px"
                className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
                alt={title}
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile: swipeable gallery with scroll-snap + dots. */}
      <div className="lg:hidden w-full mb-2">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          data-index={String(index)}
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-[13px] overscroll-x-contain"
        >
          {capped.map((url) => (
            <div
              key={url}
              className="shrink-0 w-full snap-center bg-[#F0EEED] aspect-[4/5] max-h-[440px] sm:max-h-[500px] overflow-hidden"
            >
              <Image
                src={url}
                width={444}
                height={555}
                sizes="100vw"
                className="w-full h-full object-cover"
                alt={title}
                priority={url === capped[0]}
              />
            </div>
          ))}
        </div>
        {capped.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3" role="tablist" aria-label={title}>
            {capped.map((url, i) => (
              <button
                key={url}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}`}
                className={cn([
                  "h-2 rounded-full transition-all",
                  i === index ? "w-5 bg-black" : "w-2 bg-black/25",
                ])}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: main image. */}
      <div className="hidden lg:flex items-center justify-center bg-[#F0EEED] rounded-[20px] w-full h-full max-h-[530px] min-h-[380px] xl:min-h-[530px] overflow-hidden mb-0">
        <Image
          src={selected || capped[0]}
          width={444}
          height={530}
          sizes="(min-width: 1024px) calc(50vw - 40px), 100vw"
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={title}
          priority
        />
      </div>
    </div>
  );
};

export default PhotoSection;
