import { describe, expect, it } from "vitest";
import { themeSchema } from "../theme";

describe("themeSchema", () => {
  it("accepts a fully specified valid theme", () => {
    const parsed = themeSchema.parse({
      primaryColor: "#123456",
      accentColor: "#abcdef",
      pageBgColor: "#fff",
      textColor: "#000000",
      buttonBgColor: "#111111",
      buttonTextColor: "#ffffff",
      buttonRadius: 12,
      baseFontSize: 18,
      sectionSpacing: 64,
      headingFont: "tajawal",
      bodyFont: "almarai",
    });
    expect(parsed.headingFont).toBe("tajawal");
    expect(parsed.bodyFont).toBe("almarai");
    expect(parsed.buttonRadius).toBe(12);
    expect(parsed.baseFontSize).toBe(18);
    expect(parsed.sectionSpacing).toBe(64);
  });

  it("fills defaults for an empty theme", () => {
    const parsed = themeSchema.parse({});
    expect(parsed.primaryColor).toBe("#1A1A1A");
    expect(parsed.accentColor).toBe("#C9A24B");
    expect(parsed.pageBgColor).toBe("#FFFFFF");
    expect(parsed.textColor).toBe("#111111");
    expect(parsed.buttonBgColor).toBe("#1A1A1A");
    expect(parsed.buttonTextColor).toBe("#FFFFFF");
    expect(parsed.buttonRadius).toBe(8);
    expect(parsed.baseFontSize).toBe(16);
    expect(parsed.sectionSpacing).toBe(48);
    expect(parsed.headingFont).toBe("cairo");
    expect(parsed.bodyFont).toBe("cairo");
  });

  it("rejects colors that are not hex", () => {
    expect(themeSchema.safeParse({ primaryColor: "red" }).success).toBe(false);
    expect(themeSchema.safeParse({ primaryColor: "rgb(1,2,3)" }).success).toBe(false);
    expect(themeSchema.safeParse({ primaryColor: "#12345" }).success).toBe(false);
    expect(themeSchema.safeParse({ textColor: "javascript:alert(1)" }).success).toBe(false);
  });

  it("rejects numbers outside the safe ranges", () => {
    expect(themeSchema.safeParse({ buttonRadius: -1 }).success).toBe(false);
    expect(themeSchema.safeParse({ buttonRadius: 41 }).success).toBe(false);
    expect(themeSchema.safeParse({ buttonRadius: 8.5 }).success).toBe(false);
    expect(themeSchema.safeParse({ baseFontSize: 13 }).success).toBe(false);
    expect(themeSchema.safeParse({ baseFontSize: 29 }).success).toBe(false);
    expect(themeSchema.safeParse({ sectionSpacing: -10 }).success).toBe(false);
    expect(themeSchema.safeParse({ sectionSpacing: 161 }).success).toBe(false);
  });

  it("rejects unknown fonts", () => {
    expect(themeSchema.safeParse({ headingFont: "comic" }).success).toBe(false);
    expect(themeSchema.safeParse({ bodyFont: "Times New Roman" }).success).toBe(false);
  });
});
