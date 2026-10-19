import { describe, expect, it } from "vitest";
import { themeSchema } from "../theme";
import { safeThemeToCssVariables, themeToCssVariables } from "../theme-css";

describe("themeToCssVariables", () => {
  it("maps every theme value to a css variable", () => {
    const theme = themeSchema.parse({
      primaryColor: "#123456",
      accentColor: "#654321",
      pageBgColor: "#abcdef",
      textColor: "#111111",
      buttonBgColor: "#222222",
      buttonTextColor: "#eeeeee",
      buttonRadius: 12,
      baseFontSize: 18,
      sectionSpacing: 64,
      headingFont: "tajawal",
      bodyFont: "almarai",
    });

    expect(themeToCssVariables(theme)).toEqual({
      "--lp-primary": "#123456",
      "--lp-accent": "#654321",
      "--lp-bg": "#abcdef",
      "--lp-text": "#111111",
      "--lp-btn-bg": "#222222",
      "--lp-btn-text": "#eeeeee",
      "--lp-btn-radius": "12px",
      "--lp-font-size": "18px",
      "--lp-section-spacing": "64px",
      "--font-heading": "var(--font-tajawal)",
      "--font-body": "var(--font-almarai)",
    });
  });

  it("produces css-ready values for the default theme", () => {
    const vars = themeToCssVariables(themeSchema.parse({}));
    expect(vars["--lp-btn-radius"]).toBe("8px");
    expect(vars["--font-heading"]).toBe("var(--font-cairo)");
    expect(vars["--font-body"]).toBe("var(--font-cairo)");
    for (const value of Object.values(vars)) {
      expect(value).not.toBe("");
    }
  });

  it("never throws on bad input and falls back to defaults", () => {
    expect(safeThemeToCssVariables({ primaryColor: "red" })["--lp-primary"]).toBe(
      "#1A1A1A"
    );
    expect(safeThemeToCssVariables(null)["--lp-font-size"]).toBe("16px");
    expect(safeThemeToCssVariables(undefined)["--lp-section-spacing"]).toBe("48px");
  });
});
