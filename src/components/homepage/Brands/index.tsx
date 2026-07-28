// TODO: Third-party brand logos (Versace, Gucci, Prada, Zara, Calvin Klein)
// are placeholder demo content. Replace with actual brand partners or
// remove before public launch to avoid trademark concerns.
import Image from "next/image";
import React from "react";

const brandsData: { id: string; srcUrl: string }[] = [
  { id: "versace", srcUrl: "/icons/versace-logo.svg" },
  { id: "zara", srcUrl: "/icons/zara-logo.svg" },
  { id: "gucci", srcUrl: "/icons/gucci-logo.svg" },
  { id: "prada", srcUrl: "/icons/prada-logo.svg" },
  { id: "calvin-klein", srcUrl: "/icons/calvin-klein-logo.svg" },
];

const Brands = () => {
  return (
    <div className="bg-black py-5 md:py-0 overflow-hidden">
      <div className="mx-auto flex">
        <div className="flex animate-marquee gap-7 sm:gap-10 md:gap-16 px-7 sm:px-10 md:px-16 items-center">
          {[...brandsData, ...brandsData].map((brand, i) => (
            <Image
              key={`${brand.id}-${i}`}
              priority
              src={brand.srcUrl}
              height={0}
              width={0}
              alt={brand.id}
              className="h-auto w-auto max-w-[116px] lg:max-w-48 max-h-[26px] lg:max-h-9 my-5 md:my-11 shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Brands;
