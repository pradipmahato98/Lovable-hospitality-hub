import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      // 12 bytes = 24 hex characters
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on subsequent calls", () => {
      const hex1 = generateSecureHex(8);
      const hex2 = generateSecureHex(8);
      expect(hex1).not.toBe(hex2);
    });

    it("should handle custom byte lengths", () => {
      expect(generateSecureHex(4)).toHaveLength(8);
      expect(generateSecureHex(16)).toHaveLength(32);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the inclusive range", () => {
      const min = 100000;
      const max = 999999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("should handle a range of 1 (min === max)", () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });

    it("should generate different values for a range", () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(generateSecureNumber(0, 1000000));
      }
      // Extremely low probability of 50 collisions in 1M range
      expect(results.size).toBeGreaterThan(45);
    });
  });
});
