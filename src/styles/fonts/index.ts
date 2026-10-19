import localFont from "next/font/local";
import { Cairo, Tajawal, Almarai } from "next/font/google";

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

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-tajawal",
});

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-almarai",
});

export { integralCF, satoshi, cairo, tajawal, almarai };
