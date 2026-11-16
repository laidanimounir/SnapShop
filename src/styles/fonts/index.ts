import localFont from "next/font/local";

// Local font files already vendored in src/styles/fonts/
const integralCF = localFont({
  src: [
    {
      path: "./integralcf-bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  fallback: ["sans-serif"],
  variable: "--font-integralCF",
});

const satoshi = localFont({
  src: [
    {
      path: "./Satoshi-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Satoshi-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "./Satoshi-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  fallback: ["sans-serif"],
  variable: "--font-satoshi",
});

// Arabic-capable fonts served locally via @fontsource (no network requests).
// Kept next/font/google-style names/variables so callers (e.g. layout.tsx)
// keep working unchanged. The actual @font-face rules are imported in
// src/styles/globals.css.
export const cairo = { className: "font-cairo", variable: "--font-cairo" };
export const tajawal = { className: "font-tajawal", variable: "--font-tajawal" };
export const almarai = { className: "font-almarai", variable: "--font-almarai" };

export { integralCF, satoshi };
