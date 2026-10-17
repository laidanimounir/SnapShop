// Common color palette for the admin product form.
// Each entry carries an English and an Arabic name plus a hex value.

export type CommonColor = {
  en: string;
  ar: string;
  hex: string;
};

export const COMMON_COLORS: CommonColor[] = [
  { en: "Black", ar: "أسود", hex: "#000000" },
  { en: "White", ar: "أبيض", hex: "#FFFFFF" },
  { en: "Gray", ar: "رمادي", hex: "#808080" },
  { en: "Silver", ar: "فضي", hex: "#C0C0C0" },
  { en: "Navy", ar: "كحلي", hex: "#000080" },
  { en: "Blue", ar: "أزرق", hex: "#0000FF" },
  { en: "Sky Blue", ar: "أزرق فاتح", hex: "#87CEEB" },
  { en: "Teal", ar: "أزرق مخضر", hex: "#008080" },
  { en: "Green", ar: "أخضر", hex: "#008000" },
  { en: "Olive", ar: "زيتوني", hex: "#808000" },
  { en: "Lime", ar: "ليموني", hex: "#BFFF00" },
  { en: "Yellow", ar: "أصفر", hex: "#FFFF00" },
  { en: "Gold", ar: "ذهبي", hex: "#FFD700" },
  { en: "Orange", ar: "برتقالي", hex: "#FFA500" },
  { en: "Brown", ar: "بني", hex: "#8B4513" },
  { en: "Beige", ar: "بيج", hex: "#F5F5DC" },
  { en: "Red", ar: "أحمر", hex: "#FF0000" },
  { en: "Maroon", ar: "عنابي", hex: "#800000" },
  { en: "Pink", ar: "وردي", hex: "#FFC0CB" },
  { en: "Magenta", ar: "أرجواني", hex: "#FF00FF" },
  { en: "Purple", ar: "بنفسجي", hex: "#800080" },
  { en: "Violet", ar: "بنفسجي فاتح", hex: "#EE82EE" },
  { en: "Turquoise", ar: "تركوازي", hex: "#40E0D0" },
  { en: "Cream", ar: "كريمي", hex: "#FFFDD0" },
];

/** Accepts #RRGGBB (with or without leading #), case-insensitive. */
export function isValidHex(value: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test((value ?? "").trim());
}

/** Normalize any accepted hex form to uppercase #RRGGBB, or null if invalid. */
export function normalizeHex(value: string): string | null {
  const raw = (value ?? "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toUpperCase()}`;
}

/** Custom sizes are arbitrary strings, so no list here. */
