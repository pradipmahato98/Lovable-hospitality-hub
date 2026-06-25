import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const bytes = 16;
    const result = generateSecureHex(bytes);
    expect(result).toHaveLength(bytes * 2);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("should generate different strings on each call", () => {
    const result1 = generateSecureHex(16);
    const result2 = generateSecureHex(16);
    expect(result1).not.toBe(result2);
  });
});

describe("generateSecureNumber", () => {
  it("should generate a number within the range", () => {
    const min = 10;
    const max = 20;
    for (let i = 0; i < 100; i++) {
      const result = generateSecureNumber(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });

  it("should throw if min > max", () => {
    expect(() => generateSecureNumber(20, 10)).toThrow("min must be less than or equal to max");
  });

  it("should handle large ranges", () => {
    const min = 0;
    const max = 1000000;
    const result = generateSecureNumber(min, max);
    expect(result).toBeGreaterThanOrEqual(min);
    expect(result).toBeLessThanOrEqual(max);
  });
});
