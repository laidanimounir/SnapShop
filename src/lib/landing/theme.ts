import { z } from "zod";

// Theme schema for landing pages. Every field has a safe default, so an
// empty (or missing) theme still parses into a complete usable theme.
// Numbers are range-checked so a hand-edited JSON row can never produce
// unreadable or broken CSS.

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const LANDING_FONTS = ["cairo", "tajawal", "almarai"] as const;

const hexColor = (fallback: string) =>
  z.string().regex(HEX_COLOR, "must be a hex color like #1A1A1A").default(fallback);

const rangedInt = (min: number, max: number, fallback: number) =>
  z
    .number()
    .int()
    .min(min)
    .max(max)
    .default(fallback);

export const themeSchema = z.object({
  primaryColor: hexColor("#1A1A1A"),
  accentColor: hexColor("#C9A24B"),
  pageBgColor: hexColor("#FFFFFF"),
  textColor: hexColor("#111111"),
  buttonBgColor: hexColor("#1A1A1A"),
  buttonTextColor: hexColor("#FFFFFF"),
  buttonRadius: rangedInt(0, 40, 8),
  baseFontSize: rangedInt(14, 28, 16),
  sectionSpacing: rangedInt(0, 160, 48),
  headingFont: z.enum(LANDING_FONTS).default("cairo"),
  bodyFont: z.enum(LANDING_FONTS).default("cairo"),
});

export type Theme = z.infer<typeof themeSchema>;
