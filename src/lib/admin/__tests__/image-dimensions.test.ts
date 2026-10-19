import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAX_IMAGE_DIMENSION,
  readImageDimensions,
  withinDimensionLimit,
} from "../image-dimensions";

const FIXTURES = fileURLToPath(new URL("fixtures/", import.meta.url));

function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(FIXTURES, name)));
}

describe("readImageDimensions — PNG", () => {
  it("reads real encoder-produced PNGs", () => {
    expect(readImageDimensions(fixture("tiny.png"))).toEqual({
      width: 1,
      height: 1,
    });
    expect(readImageDimensions(fixture("sample.png"))).toEqual({
      width: 16,
      height: 16,
    });
  });

  it("accepts dimensions exactly at the limit", () => {
    expect(readImageDimensions(fixture("boundary.png"))).toEqual({
      width: 8000,
      height: 1,
    });
    expect(withinDimensionLimit(readImageDimensions(fixture("boundary.png")))).toBe(
      true
    );
  });

  it("reads but rejects an oversized header-only PNG", () => {
    const dims = readImageDimensions(fixture("oversized.png"));
    expect(dims).toEqual({ width: 9000, height: 9000 });
    expect(withinDimensionLimit(dims)).toBe(false);
  });

  it("returns null for a truncated PNG", () => {
    expect(readImageDimensions(fixture("truncated.png"))).toBeNull();
    expect(withinDimensionLimit(null)).toBe(false);
  });

  it("returns null when IHDR is not the first chunk", () => {
    // sig + garbage length + 'IHDR'-less bytes
    const bogus = new Uint8Array(32);
    bogus.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    bogus.set([0, 0, 0, 99], 8);
    bogus.set([0x49, 0x45, 0x4e, 0x44], 12); // 'IEND' where IHDR must be
    expect(readImageDimensions(bogus)).toBeNull();
  });
});

describe("readImageDimensions — JPEG", () => {
  it("reads a plain baseline JPEG", () => {
    expect(readImageDimensions(fixture("tiny.jpg"))).toEqual({
      width: 3,
      height: 2,
    });
  });

  it("reads the main SOF, not an EXIF thumbnail's SOF", () => {
    // file contains APP1 with embedded 9x9 SOF; main SOF is 7x5
    expect(readImageDimensions(fixture("exif-thumb.jpg"))).toEqual({
      width: 7,
      height: 5,
    });
  });

  it("skips FF fill bytes before the SOF marker", () => {
    expect(readImageDimensions(fixture("fill-bytes.jpg"))).toEqual({
      width: 12,
      height: 9,
    });
  });

  it("reads but rejects an oversized SOF", () => {
    const dims = readImageDimensions(fixture("oversized.jpg"));
    expect(dims).toEqual({ width: 8001, height: 1 });
    expect(withinDimensionLimit(dims)).toBe(false);
  });

  it("returns null for a truncated JPEG", () => {
    expect(readImageDimensions(fixture("truncated.jpg"))).toBeNull();
  });

  it("returns null for SOI without a parseable SOF", () => {
    expect(readImageDimensions(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
    expect(
      readImageDimensions(Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02]))
    ).toBeNull();
  });

  it("returns null when a segment length overruns the file", () => {
    const overrun = Uint8Array.from([
      0xff, 0xd8, // SOI
      0xff, 0xe1, // APP1
      0xff, 0xff, // length 65535 — way past the end
      0x00,
    ]);
    expect(readImageDimensions(overrun)).toBeNull();
  });
});

describe("readImageDimensions — WebP", () => {
  it("reads lossless (VP8L) WebP", () => {
    expect(readImageDimensions(fixture("tiny.webp"))).toEqual({
      width: 5,
      height: 4,
    });
  });

  it("reads lossy (VP8) WebP", () => {
    expect(readImageDimensions(fixture("lossy.webp"))).toEqual({
      width: 6,
      height: 4,
    });
  });

  it("reads extended (VP8X) WebP", () => {
    expect(readImageDimensions(fixture("extended.webp"))).toEqual({
      width: 8,
      height: 6,
    });
  });

  it("returns null for a truncated WebP", () => {
    expect(readImageDimensions(fixture("truncated.webp"))).toBeNull();
  });

  it("returns null when the chunk size overruns the file", () => {
    const bad = fixture("tiny.webp").slice(0, 24);
    // inflate the declared VP8L chunk size beyond the buffer
    bad[16] = 0xff;
    bad[17] = 0xff;
    expect(readImageDimensions(bad)).toBeNull();
  });

  it("returns null for an unknown leading chunk", () => {
    const anim = fixture("tiny.webp");
    anim[12] = 0x41; // 'A'
    anim[13] = 0x4e; // 'N'
    anim[14] = 0x49; // 'I'
    anim[15] = 0x4d; // 'M'
    expect(readImageDimensions(anim)).toBeNull();
  });
});

describe("readImageDimensions — non-images", () => {
  it("returns null for garbage", () => {
    expect(readImageDimensions(new Uint8Array(64))).toBeNull();
    expect(readImageDimensions(Uint8Array.from([1, 2, 3, 4]))).toBeNull();
    expect(
      readImageDimensions(Uint8Array.from([0x47, 0x49, 0x46, 0x38])) // GIF magic
    ).toBeNull();
  });

  it("returns null for an empty buffer", () => {
    expect(readImageDimensions(new Uint8Array(0))).toBeNull();
  });
});

describe("withinDimensionLimit", () => {
  it("accepts 1x1 up to the exact limit", () => {
    expect(withinDimensionLimit({ width: 1, height: 1 })).toBe(true);
    expect(
      withinDimensionLimit({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION })
    ).toBe(true);
  });

  it("rejects anything over the limit, zero, negative or fractional", () => {
    expect(
      withinDimensionLimit({ width: MAX_IMAGE_DIMENSION + 1, height: 1 })
    ).toBe(false);
    expect(withinDimensionLimit({ width: 1, height: 0 })).toBe(false);
    expect(withinDimensionLimit({ width: -1, height: 10 })).toBe(false);
    expect(withinDimensionLimit({ width: 10.5, height: 10 })).toBe(false);
    expect(withinDimensionLimit(null)).toBe(false);
  });
});
