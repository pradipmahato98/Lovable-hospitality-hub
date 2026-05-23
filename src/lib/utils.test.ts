import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hexadecimal string of correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on consecutive calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
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
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it("should handle range of 1", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should generate different numbers over many iterations", () => {
      const numbers = new Set();
      for (let i = 0; i < 50; i++) {
        numbers.add(generateSecureNumber(0, 1000000));
      }
      expect(numbers.size).toBeGreaterThan(45);
    });
  });
});
