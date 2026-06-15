import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureNumber } from "../utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const bytes = 16;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different strings on subsequent calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });

    it("should handle different byte lengths", () => {
      expect(generateSecureHex(8)).toHaveLength(16);
      expect(generateSecureHex(32)).toHaveLength(64);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      const min = 1000;
      const max = 9999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("should handle a range of 1", () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });

    it("should be inclusive of both min and max", () => {
      // This is a probabilistic test, but with 1000 iterations for a range of 2,
      // it's extremely likely to hit both.
      const results = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        results.add(generateSecureNumber(1, 2));
      }
      expect(results.has(1)).toBe(true);
      expect(results.has(2)).toBe(true);
    });
  });
});
