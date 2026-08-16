"use client";

import Image from "next/image";
import React from "react";

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
  const gallery = images.length > 1 ? images : [];

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:space-x-3.5">
      {gallery.length > 0 && (
        <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3.5 w-full lg:w-fit items-center lg:justify-start justify-center">
          {gallery.map((photo, index) => (
            <button
              key={index}
              type="button"
              className="bg-[#F0EEED] rounded-[13px] xl:rounded-[20px] w-full max-w-[111px] xl:max-w-[152px] max-h-[106px] xl:max-h-[167px] xl:min-h-[167px] aspect-square overflow-hidden"
              onClick={() => onSelect(photo)}
            >
              <Image
                src={photo}
                width={152}
                height={167}
                className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
                alt={title}
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center bg-[#F0EEED] rounded-[13px] sm:rounded-[20px] w-full sm:w-96 md:w-full mx-auto h-full max-h-[530px] min-h-[330px] lg:min-h-[380px] xl:min-h-[530px] overflow-hidden mb-3 lg:mb-0">
        <Image
          src={selected}
          width={444}
          height={530}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={title}
          priority
        />
      </div>
    </div>
  );
};

export default PhotoSection;
