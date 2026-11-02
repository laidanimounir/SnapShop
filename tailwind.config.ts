import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        integralCF: ["var(--font-integralCF)"],
        satoshi: ["var(--font-satoshi)"],
      },
      screens: {
        xs: "375px",
      },
      width: {
        frame: "77.5rem",
      },
      maxWidth: {
        frame: "77.5rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        brand: {
          primary: "#1A1A1A",
          accent: "#C9A24B",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        admin: {
          background: "hsl(var(--admin-background) / <alpha-value>)",
          foreground: "hsl(var(--admin-foreground) / <alpha-value>)",
          card: {
            DEFAULT: "hsl(var(--admin-card) / <alpha-value>)",
            foreground: "hsl(var(--admin-card-foreground) / <alpha-value>)",
          },
          popover: {
            DEFAULT: "hsl(var(--admin-popover) / <alpha-value>)",
            foreground: "hsl(var(--admin-popover-foreground) / <alpha-value>)",
          },
          primary: {
            DEFAULT: "hsl(var(--admin-primary) / <alpha-value>)",
            foreground: "hsl(var(--admin-primary-foreground) / <alpha-value>)",
          },
          secondary: {
            DEFAULT: "hsl(var(--admin-secondary) / <alpha-value>)",
            foreground: "hsl(var(--admin-secondary-foreground) / <alpha-value>)",
          },
          muted: {
            DEFAULT: "hsl(var(--admin-muted) / <alpha-value>)",
            foreground: "hsl(var(--admin-muted-foreground) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "hsl(var(--admin-accent) / <alpha-value>)",
            foreground: "hsl(var(--admin-accent-foreground) / <alpha-value>)",
          },
          destructive: {
            DEFAULT: "hsl(var(--admin-destructive) / <alpha-value>)",
            foreground: "hsl(var(--admin-destructive-foreground) / <alpha-value>)",
          },
          border: "hsl(var(--admin-border) / <alpha-value>)",
          input: "hsl(var(--admin-input) / <alpha-value>)",
          ring: "hsl(var(--admin-ring) / <alpha-value>)",
          sidebar: {
            DEFAULT: "hsl(var(--admin-sidebar) / <alpha-value>)",
            foreground: "hsl(var(--admin-sidebar-foreground) / <alpha-value>)",
            accent: "hsl(var(--admin-sidebar-accent) / <alpha-value>)",
            "accent-foreground":
              "hsl(var(--admin-sidebar-accent-foreground) / <alpha-value>)",
            border: "hsl(var(--admin-sidebar-border) / <alpha-value>)",
            ring: "hsl(var(--admin-sidebar-ring) / <alpha-value>)",
          },
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 20s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: ["backdrop-blur-[2px]"],
};
export default config;
