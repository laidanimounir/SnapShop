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
