import { themeSchema, type Theme } from "./theme";

// Maps a validated landing page theme to the CSS custom properties the
// page renderer and section components read. Fonts map to the
// next/font variables declared in src/styles/fonts/index.ts.

const FONT_VARS: Record<Theme["headingFont"], string> = {
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
  almarai: "var(--font-almarai)",
};

export function themeToCssVariables(theme: Theme): Record<string, string> {
  return {
    "--lp-primary": theme.primaryColor,
    "--lp-accent": theme.accentColor,
    "--lp-bg": theme.pageBgColor,
    "--lp-text": theme.textColor,
    "--lp-btn-bg": theme.buttonBgColor,
    "--lp-btn-text": theme.buttonTextColor,
    "--lp-btn-radius": `${theme.buttonRadius}px`,
    "--lp-font-size": `${theme.baseFontSize}px`,
    "--lp-section-spacing": `${theme.sectionSpacing}px`,
    "--font-heading": FONT_VARS[theme.headingFont],
    "--font-body": FONT_VARS[theme.bodyFont],
  };
}

// Convenience for callers holding untrusted JSON: never throws.
export function safeThemeToCssVariables(raw: unknown): Record<string, string> {
  const parsed = themeSchema.safeParse(raw);
  return themeToCssVariables(parsed.success ? parsed.data : themeSchema.parse({}));
}
