import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const hex8 = generateSecureHex(4);
    expect(hex8).toHaveLength(8);
    expect(hex8).toMatch(/^[0-9a-f]{8}$/);

    const hex24 = generateSecureHex(12);
    expect(hex24).toHaveLength(24);
    expect(hex24).toMatch(/^[0-9a-f]{24}$/);
  });

  it("should produce different values on subsequent calls", () => {
    const val1 = generateSecureHex(16);
    const val2 = generateSecureHex(16);
    expect(val1).not.toBe(val2);
  });
});

describe("generateSecureNumber", () => {
  it("should generate a number within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(10, 20);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    }
  });

  it("should handle large ranges correctly", () => {
    const min = 100000;
    const max = 999999;
    const num = generateSecureNumber(min, max);
    expect(num).toBeGreaterThanOrEqual(min);
    expect(num).toBeLessThanOrEqual(max);
  });

  it("should handle single value range", () => {
    const num = generateSecureNumber(5, 5);
    expect(num).toBe(5);
  });
});
