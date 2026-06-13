import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a hex string of the correct length", () => {
    const len = 12;
    const hex = generateSecureHex(len);
    expect(hex).toHaveLength(len * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("produces different values", () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureNumber", () => {
  it("generates a number within the specified range", () => {
    const min = 1000;
    const max = 9999;
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    }
  });

  it("works with range of 1", () => {
    const num = generateSecureNumber(5, 5);
    expect(num).toBe(5);
  });
});
