import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on subsequent calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("should handle min equal to max", () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });

    it("should throw error if min > max", () => {
      expect(() => generateSecureNumber(10, 5)).toThrow("Min must be less than or equal to max");
    });

    it("should handle large ranges", () => {
      const min = 0;
      const max = 1000000;
      const num = generateSecureNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    });

    it("should throw error for ranges larger than 32-bit limit", () => {
        // 2^32 = 4294967296. Range is max - min + 1.
        // So if max - min = 2^32, range is 2^32 + 1, which is > 0xffffffff (4294967295)
        const min = 0;
        const max = 0xffffffff; // Range is 0xffffffff + 1 = 2^32
        expect(() => generateSecureNumber(min, max)).toThrow("Range is too large for 32-bit secure generation");
    });
  });
});
