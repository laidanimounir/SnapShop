import { describe, expect, it } from "vitest";

import { isUuid, landingAssetPath } from "../landing-asset";

const PAGE_ID = "f5ff445a-e160-43e5-87de-bebe59ed9b81";
const FILE_ID = "ab4242f3-3967-4e2d-83fb-d3366e68961a";

describe("isUuid", () => {
  it("accepts canonical uuids in either case", () => {
    expect(isUuid(PAGE_ID)).toBe(true);
    expect(isUuid(PAGE_ID.toUpperCase())).toBe(true);
  });

  it("rejects anything that could escape the folder", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid("../landing")).toBe(false);
    expect(isUuid(`${PAGE_ID}/../x`)).toBe(false);
    expect(isUuid(`landing/${PAGE_ID}`)).toBe(false);
  });
});

describe("landingAssetPath", () => {
  it("builds a path inside the landing folder with the real extension", () => {
    expect(landingAssetPath(PAGE_ID, FILE_ID, "jpg")).toBe(
      `landing/${PAGE_ID}/${FILE_ID}.jpg`
    );
    expect(landingAssetPath(PAGE_ID, FILE_ID, "png")).toBe(
      `landing/${PAGE_ID}/${FILE_ID}.png`
    );
    expect(landingAssetPath(PAGE_ID, FILE_ID, "webp")).toBe(
      `landing/${PAGE_ID}/${FILE_ID}.webp`
    );
  });

  it("returns null for unsafe ids or an unknown image kind", () => {
    expect(landingAssetPath("../x", FILE_ID, "jpg")).toBeNull();
    expect(landingAssetPath(PAGE_ID, "../x", "jpg")).toBeNull();
    expect(
      landingAssetPath(PAGE_ID, FILE_ID, "gif" as unknown as "png")
    ).toBeNull();
  });
});
