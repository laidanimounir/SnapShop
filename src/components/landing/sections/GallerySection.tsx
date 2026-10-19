import Image from "next/image";
import { gallerySectionSchema } from "@/lib/landing/sections";
import SectionShell from "./SectionShell";

export default function GallerySection({ section }: { section: unknown }) {
  const parsed = gallerySectionSchema.safeParse(section);
  if (!parsed.success || parsed.data.hidden) return null;
  const { props } = parsed.data;

  return (
    <SectionShell>
      {props.colorName ? (
        <h2 className="mb-4 text-xl font-bold">{props.colorName}</h2>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {props.images.map((image, i) => (
          <Image
            key={`${image.imageUrl}-${i}`}
            src={image.imageUrl}
            alt={image.alt || `صورة ${i + 1}`}
            width={400}
            height={400}
            loading="lazy"
            sizes="(min-width: 640px) 33vw, 50vw"
            className="aspect-square w-full rounded-lg object-cover"
          />
        ))}
      </div>
    </SectionShell>
  );
}
