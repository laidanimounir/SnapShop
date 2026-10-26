import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackPixelEvent } from "../tracking";

// The suite runs in the node environment, so a minimal stand-in for the
// browser global lets the tracker be exercised without adding jsdom.
type AnyWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (...args: unknown[]) => void };
};

const globalRef = globalThis as unknown as { window?: AnyWindow };

beforeEach(() => {
  globalRef.window = {} as AnyWindow;
});

afterEach(() => {
  delete globalRef.window;
  vi.restoreAllMocks();
});

describe("trackPixelEvent", () => {
  it("sends the same event to both pixels with a default currency", () => {
    const fbq = vi.fn();
    const track = vi.fn();
    globalRef.window!.fbq = fbq;
    globalRef.window!.ttq = { track };

    trackPixelEvent("ViewContent");

    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", {
      currency: "DZD",
    });
    expect(track).toHaveBeenCalledWith("ViewContent", { currency: "DZD" });
  });

  it("includes value and quantity when supplied", () => {
    const fbq = vi.fn();
    globalRef.window!.fbq = fbq;

    trackPixelEvent("Purchase", { value: 300, quantity: 2, currency: "DZD" });

    expect(fbq).toHaveBeenCalledWith("track", "Purchase", {
      currency: "DZD",
      value: 300,
      quantity: 2,
    });
  });

  it("includes the selected offer tier (id and quantity), never a price", () => {
    const fbq = vi.fn();
    const track = vi.fn();
    globalRef.window!.fbq = fbq;
    globalRef.window!.ttq = { track };

    trackPixelEvent("Purchase", {
      value: 4500,
      quantity: 2,
      offerId: "offer-uuid-1",
      offerQuantity: 2,
    });

    const expected = {
      currency: "DZD",
      value: 4500,
      quantity: 2,
      offer_id: "offer-uuid-1",
      offer_quantity: 2,
    };
    expect(fbq).toHaveBeenCalledWith("track", "Purchase", expected);
    expect(track).toHaveBeenCalledWith("Purchase", expected);
  });

  it("omits offer params when no tier is selected", () => {
    const fbq = vi.fn();
    globalRef.window!.fbq = fbq;

    trackPixelEvent("Purchase", { value: 2800, quantity: 1, offerId: null });

    expect(fbq).toHaveBeenCalledWith("track", "Purchase", {
      currency: "DZD",
      value: 2800,
      quantity: 1,
    });
  });

  it("includes content ids, content type and an event id when supplied", () => {
    const fbq = vi.fn();
    const track = vi.fn();
    globalRef.window!.fbq = fbq;
    globalRef.window!.ttq = { track };

    trackPixelEvent("Purchase", {
      value: 4500,
      contentIds: ["product-uuid-1"],
      contentType: "product",
      eventId: "order-uuid-1",
    });

    const expected = {
      currency: "DZD",
      value: 4500,
      content_ids: ["product-uuid-1"],
      content_type: "product",
      event_id: "order-uuid-1",
    };
    expect(fbq).toHaveBeenCalledWith("track", "Purchase", expected);
    expect(track).toHaveBeenCalledWith("Purchase", expected);
  });

  it("omits content params when they are missing or empty", () => {
    const fbq = vi.fn();
    globalRef.window!.fbq = fbq;

    trackPixelEvent("ViewContent", { value: 2000, contentIds: [] });

    expect(fbq).toHaveBeenCalledWith("track", "ViewContent", {
      currency: "DZD",
      value: 2000,
    });
  });

  it("does nothing and never throws when no pixel loaded", () => {
    expect(() => trackPixelEvent("InitiateCheckout")).not.toThrow();
  });

  it("does nothing when there is no browser window at all", () => {
    delete globalRef.window;
    expect(() => trackPixelEvent("ViewContent")).not.toThrow();
  });

  it("swallows errors raised by a broken pixel", () => {
    globalRef.window!.fbq = () => {
      throw new Error("pixel blew up");
    };
    expect(() => trackPixelEvent("Purchase", { value: 10 })).not.toThrow();
  });
});
