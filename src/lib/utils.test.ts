import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on subsequent calls", () => {
      const hex1 = generateSecureHex(8);
      const hex2 = generateSecureHex(8);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureRandomNumber", () => {
    it("should generate a number within the specified range", () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("should handle min > max by swapping them", () => {
      const min = 20;
      const max = 10;
      const num = generateSecureRandomNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(max);
      expect(num).toBeLessThanOrEqual(min);
    });

    it("should return min when min === max", () => {
      const val = 15;
      expect(generateSecureRandomNumber(val, val)).toBe(val);
    });

    it("should handle large ranges correctly", () => {
      const min = 0;
      const max = 0xffffffff; // 2^32 - 1
      const num = generateSecureRandomNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    });
  });
});
