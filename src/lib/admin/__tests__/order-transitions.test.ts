import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  allowedTransitions,
  canTransition,
  isOrderStatus,
  isTerminalStatus,
  transitionRestoresStock,
} from "../order-transitions";

describe("order transitions", () => {
  it("allows only the documented edges", () => {
    expect(allowedTransitions("pending")).toEqual([
      "confirmed",
      "no_answer",
      "cancelled",
    ]);
    expect(allowedTransitions("confirmed")).toEqual(["shipped", "cancelled"]);
    expect(allowedTransitions("no_answer")).toEqual(["confirmed", "cancelled"]);
    expect(allowedTransitions("shipped")).toEqual(["delivered", "returned"]);
    expect(allowedTransitions("delivered")).toEqual([]);
    expect(allowedTransitions("cancelled")).toEqual([]);
    expect(allowedTransitions("returned")).toEqual([]);
  });

  it("rejects unknown statuses and backwards moves", () => {
    expect(allowedTransitions("bogus")).toEqual([]);
    expect(canTransition("shipped", "pending")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
    expect(canTransition("returned", "pending")).toBe(false);
    expect(canTransition("pending", "shipped")).toBe(false);
  });

  it("accepts valid edges", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("no_answer", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
    expect(canTransition("shipped", "returned")).toBe(true);
  });

  it("marks terminal statuses", () => {
    expect(isTerminalStatus("delivered")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("returned")).toBe(true);
    expect(isTerminalStatus("pending")).toBe(false);
    expect(isTerminalStatus("shipped")).toBe(false);
  });

  it("restores stock only for cancelled/returned from stock-holding states", () => {
    expect(transitionRestoresStock("pending", "cancelled")).toBe(true);
    expect(transitionRestoresStock("confirmed", "cancelled")).toBe(true);
    expect(transitionRestoresStock("no_answer", "cancelled")).toBe(true);
    expect(transitionRestoresStock("shipped", "returned")).toBe(true);
    expect(transitionRestoresStock("delivered", "returned")).toBe(false);
    expect(transitionRestoresStock("delivered", "cancelled")).toBe(false);
    expect(transitionRestoresStock("pending", "confirmed")).toBe(false);
    expect(transitionRestoresStock("shipped", "delivered")).toBe(false);
  });

  it("lists every status exactly once", () => {
    expect(ORDER_STATUSES).toHaveLength(7);
    expect(new Set(ORDER_STATUSES).size).toBe(7);
    ORDER_STATUSES.forEach((s) => expect(isOrderStatus(s)).toBe(true));
  });
});
