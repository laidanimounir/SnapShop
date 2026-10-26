import { describe, expect, it } from "vitest";
import {
  DISABLED_PIXEL_SETTINGS,
  parseTrackingPixelSetting,
} from "../api/public-store-settings";

describe("parseTrackingPixelSetting", () => {
  it("reads as disabled for missing or non-object values", () => {
    expect(parseTrackingPixelSetting(null)).toEqual(DISABLED_PIXEL_SETTINGS);
    expect(parseTrackingPixelSetting(undefined)).toEqual(
      DISABLED_PIXEL_SETTINGS
    );
    expect(parseTrackingPixelSetting("tracking_pixel")).toEqual(
      DISABLED_PIXEL_SETTINGS
    );
    expect(parseTrackingPixelSetting([1, 2])).toEqual(DISABLED_PIXEL_SETTINGS);
  });

  it("reads as disabled unless enabled is exactly true", () => {
    expect(parseTrackingPixelSetting({ pixel_id: "12345", enabled: false })).toEqual(
      DISABLED_PIXEL_SETTINGS
    );
    expect(parseTrackingPixelSetting({ pixel_id: "12345" })).toEqual(
      DISABLED_PIXEL_SETTINGS
    );
    expect(parseTrackingPixelSetting({ pixel_id: "12345", enabled: "yes" })).toEqual(
      DISABLED_PIXEL_SETTINGS
    );
  });

  it("returns a valid facebook id when enabled", () => {
    expect(
      parseTrackingPixelSetting({ pixel_id: "123456789012345", enabled: true })
    ).toEqual({
      enabled: true,
      facebookPixelId: "123456789012345",
      tiktokPixelId: null,
    });
  });

  it("drops a facebook id that fails the existing regex", () => {
    // letters, too short, too long, empty
    for (const pixel_id of ["abcde", "1234", "1".repeat(21), ""]) {
      const parsed = parseTrackingPixelSetting({ pixel_id, enabled: true });
      expect(parsed.enabled).toBe(true);
      expect(parsed.facebookPixelId).toBeNull();
    }
  });

  it("picks up an optional tiktok id stored next to the pixel id", () => {
    const parsed = parseTrackingPixelSetting({
      pixel_id: "123456",
      tiktok_pixel_id: "CJK123ABC",
      enabled: true,
    });
    expect(parsed).toEqual({
      enabled: true,
      facebookPixelId: "123456",
      tiktokPixelId: "CJK123ABC",
    });
  });

  it("drops a tiktok id that fails its regex", () => {
    const parsed = parseTrackingPixelSetting({
      pixel_id: "123456",
      tiktok_pixel_id: "id with spaces!",
      enabled: true,
    });
    expect(parsed.tiktokPixelId).toBeNull();
  });
});
