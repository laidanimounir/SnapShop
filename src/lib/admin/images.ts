// Pure helpers for product images: a product keeps at most
// MAX_PRODUCT_IMAGES images (1 main + up to 3 extra). Position 0 is
// the primary image; is_primary is kept consistent with position.

export const MAX_PRODUCT_IMAGES = 4;

export const MAX_IMAGES_MESSAGE = `At most ${MAX_PRODUCT_IMAGES} images per product (1 main + up to ${MAX_PRODUCT_IMAGES - 1} extra).`;

export type OrderedImage = {
  id: string;
  position: number;
  is_primary: boolean;
};

/** Sort by position, primary first on ties, without mutating input. */
export function sortImages<T extends OrderedImage>(images: T[]): T[] {
  return [...images].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return Number(b.is_primary) - Number(a.is_primary);
  });
}

/** Position-ordered images, capped to MAX_PRODUCT_IMAGES. */
export function capImages<T extends OrderedImage>(images: T[]): T[] {
  return sortImages(images).slice(0, MAX_PRODUCT_IMAGES);
}

export function hasTooManyImages(count: number): boolean {
  return count > MAX_PRODUCT_IMAGES;
}

export function canAddImages(currentCount: number, adding = 1): boolean {
  return currentCount + adding <= MAX_PRODUCT_IMAGES;
}

/**
 * Move the image at `from` to index `to`, then recompute positions and
 * keep is_primary consistent: the image at index 0 is the primary one.
 */
export function moveImage<T extends OrderedImage>(
  images: T[],
  from: number,
  to: number
): T[] {
  const sorted = sortImages(images);
  if (from < 0 || from >= sorted.length) return sorted;
  const clampedTo = Math.max(0, Math.min(sorted.length - 1, to));
  const next = [...sorted];
  const [moved] = next.splice(from, 1);
  next.splice(clampedTo, 0, moved);
  return next.map((img, i) => ({ ...img, position: i, is_primary: i === 0 }));
}

/**
 * Storefront list: position-ordered, primary first, capped to 4.
 * Extra images on a legacy product are simply hidden, never deleted.
 */
export function imagesForDisplay<T extends OrderedImage>(images: T[]): T[] {
  return capImages(images);
}
