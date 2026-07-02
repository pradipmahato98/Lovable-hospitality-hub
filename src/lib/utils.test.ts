import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a hex string of the correct length", () => {
    const bytes = 16;
    const hex = generateSecureHex(bytes);
    expect(hex).toHaveLength(bytes * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique values", () => {
    const hex1 = generateSecureHex(8);
    const hex2 = generateSecureHex(8);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureNumber", () => {
  it("generates a number within the specified range", () => {
    const min = 10;
    const max = 20;
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    }
  });

  it("handles a single number range", () => {
    const num = generateSecureNumber(5, 5);
    expect(num).toBe(5);
  });

  it("handles reversed min and max", () => {
    const num = generateSecureNumber(20, 10);
    expect(num).toBeGreaterThanOrEqual(10);
    expect(num).toBeLessThanOrEqual(20);
  });

  it("throws for extremely large ranges", () => {
    expect(() => generateSecureNumber(0, Math.pow(2, 32))).toThrow();
  });
});
