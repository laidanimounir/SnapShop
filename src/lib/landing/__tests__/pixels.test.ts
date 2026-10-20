import { describe, expect, it } from "vitest";

import {
  facebookPixelScript,
  resolveLandingPixels,
  tiktokPixelScript,
} from "../pixels";

describe("resolveLandingPixels", () => {
  it("keeps digit-only ids and drops everything else", () => {
    expect(
      resolveLandingPixels({
        facebookPixelId: "1234567890123456",
        tiktokPixelId: "9876543210",
      })
    ).toEqual({ facebook: "1234567890123456", tiktok: "9876543210" });
  });

  it("treats empty and unsafe values as absent", () => {
    expect(
      resolveLandingPixels({
        facebookPixelId: "",
        tiktokPixelId: "1');alert(1);//",
      })
    ).toEqual({ facebook: null, tiktok: null });
    expect(resolveLandingPixels({})).toEqual({ facebook: null, tiktok: null });
  });
});

describe("pixel snippets", () => {
  it("initializes facebook and sends a page view", () => {
    const script = facebookPixelScript("1234567890123456");
    expect(script).toContain("connect.facebook.net/en_US/fbevents.js");
    expect(script).toContain("fbq('init','1234567890123456')");
    expect(script).toContain("fbq('track','PageView')");
  });

  it("loads tiktok and sends a page event", () => {
    const script = tiktokPixelScript("9876543210");
    expect(script).toContain("analytics.tiktok.com/i18n/pixel/events.js");
    expect(script).toContain("ttq.load('9876543210')");
    expect(script).toContain("ttq.page()");
  });
});
