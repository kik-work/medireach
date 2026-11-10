import { describe, expect, it } from "vitest";
import { expiryValid, luhn } from "@/lib/services/payment.service";

describe("card checks", () => {
  it("Luhn", () => {
    expect(luhn("4242424242424242")).toBe(true);
    expect(luhn("4242424242424241")).toBe(false);
    expect(luhn("0")).toBe(false);
  });

  it("expiry is valid through the end of its month", () => {
    const now = new Date("2026-11-15T00:00:00Z");
    expect(expiryValid("11/26", now)).toBe(true);
    expect(expiryValid("10/26", now)).toBe(false);
    expect(expiryValid("13/30", now)).toBe(false);
    expect(expiryValid("1/30", now)).toBe(false);
  });
});
