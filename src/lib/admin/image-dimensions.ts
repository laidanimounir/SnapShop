// Hand-rolled image dimension reader for the admin upload guard.
// Header-only parsing (no pixel decoding) for the three accepted
// formats: PNG, JPEG and WebP. Anything not fully understood returns
// null and the caller must reject the upload — never guess.

export const MAX_IMAGE_DIMENSION = 8000; // px, per side

export type ImageDimensions = { width: number; height: number };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function readImageDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (isPng(bytes)) return readPngDimensions(bytes);
  if (isJpeg(bytes)) return readJpegDimensions(bytes);
  if (isWebp(bytes)) return readWebpDimensions(bytes);
  return null;
}

/** Dimensions are acceptable for upload: present, integral, in 1..limit. */
export function withinDimensionLimit(dimensions: ImageDimensions | null): boolean {
  return (
    dimensions != null &&
    Number.isInteger(dimensions.width) &&
    Number.isInteger(dimensions.height) &&
    dimensions.width >= 1 &&
    dimensions.height >= 1 &&
    dimensions.width <= MAX_IMAGE_DIMENSION &&
    dimensions.height <= MAX_IMAGE_DIMENSION
  );
}

function readU16BE(b: Uint8Array, o: number): number {
  return (b[o] << 8) | b[o + 1];
}

function readU32BE(b: Uint8Array, o: number): number {
  return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
}

function readU32LE(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}

function asciiAt(b: Uint8Array, offset: number, text: string): boolean {
  if (b.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i += 1) {
    if (b[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

// ---------------------------------------------------------------
// PNG: 8-byte signature, then the IHDR chunk must be first:
//   len(4) 'IHDR' width(4 BE) height(4 BE) ...
// ---------------------------------------------------------------

function isPng(b: Uint8Array): boolean {
  return b.length >= 8 && PNG_SIGNATURE.every((v, i) => b[i] === v);
}

function readPngDimensions(b: Uint8Array): ImageDimensions | null {
  if (b.length < 24) return null;
  if (readU32BE(b, 8) !== 13) return null; // IHDR must be 13 bytes
  if (!asciiAt(b, 12, "IHDR")) return null;
  const width = readU32BE(b, 16);
  const height = readU32BE(b, 20);
  if (width === 0 || height === 0) return null;
  return { width, height };
}

// ---------------------------------------------------------------
// JPEG: SOI (FF D8), then marker segments. Each segment is
//   FF <marker> len(2 BE, includes itself) <payload>
// The Start-Of-Frame marker (SOF0-SOF15 minus DHT/JPG/DAC) carries
//   precision(1) height(2 BE) width(2 BE).
// APP segments (EXIF thumbnails with embedded FF D8 FF C0, etc.) are
// skipped whole via their length, so a thumbnail can never be read
// as the main image. Entropy-coded data starts at SOS — if no SOF
// was seen by then, the file is malformed: reject.
// ---------------------------------------------------------------

function isJpeg(b: Uint8Array): boolean {
  return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function isSofMarker(marker: number): boolean {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 && // DHT
    marker !== 0xc8 && // JPG reserved
    marker !== 0xcc // DAC
  );
}

function readJpegDimensions(b: Uint8Array): ImageDimensions | null {
  let pos = 2; // skip SOI
  while (pos + 1 < b.length) {
    if (b[pos] !== 0xff) return null; // framing broken outside a scan
    while (pos < b.length && b[pos] === 0xff) pos++; // FF fill bytes
    if (pos >= b.length) return null;
    const marker = b[pos];
    pos += 1;

    // Markers without a length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9) return null; // EOI before any SOF
    if (marker === 0xda) return null; // SOS before any SOF
    if (marker === 0x00) return null; // stuffed byte outside a scan

    if (pos + 2 > b.length) return null; // truncated length field
    const length = readU16BE(b, pos);
    if (length < 2) return null;
    if (pos + length > b.length) return null; // segment exceeds the file

    if (isSofMarker(marker)) {
      if (length < 7) return null;
      const height = readU16BE(b, pos + 3);
      const width = readU16BE(b, pos + 5);
      if (width === 0 || height === 0) return null;
      return { width, height };
    }

    pos += length;
  }
  return null;
}

// ---------------------------------------------------------------
// WebP: 'RIFF' size 'WEBP', then a chunk at offset 12:
//   fourcc(4) size(4 LE) data...
// Three header flavours: 'VP8 ' (lossy), 'VP8L' (lossless),
// 'VP8X' (extended). The RIFF/chunk size must fit the file.
// ---------------------------------------------------------------

function isWebp(b: Uint8Array): boolean {
  return b.length >= 12 && asciiAt(b, 0, "RIFF") && asciiAt(b, 8, "WEBP");
}

function readWebpDimensions(b: Uint8Array): ImageDimensions | null {
  if (b.length < 20) return null;
  const chunkSize = readU32LE(b, 16);
  if (20 + chunkSize > b.length) return null; // truncated file

  if (asciiAt(b, 12, "VP8X")) {
    if (b.length < 30 || chunkSize < 10) return null;
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  if (asciiAt(b, 12, "VP8L")) {
    if (b.length < 25 || chunkSize < 5) return null;
    if (b[20] !== 0x2f) return null; // VP8L signature byte
    const bits = readU32LE(b, 21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >>> 14) & 0x3fff);
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }

  if (asciiAt(b, 12, "VP8 ")) {
    if (b.length < 30 || chunkSize < 10) return null;
    // 3-byte frame tag, then the 3-byte keyframe sync code.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    const width = (b[26] | (b[27] << 8)) & 0x3fff;
    const height = (b[28] | (b[29] << 8)) & 0x3fff;
    if (width === 0 || height === 0) return null;
    return { width, height };
  }

  return null; // unknown WebP chunk (ANIM/ALPH first, etc.)
}
