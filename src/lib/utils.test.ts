import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a string of the correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      // Each byte is represented by 2 hex characters
      expect(hex).toHaveLength(bytes * 2);
    });

    it("should generate a valid hexadecimal string", () => {
      const hex = generateSecureHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on successive calls", () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureRandomNumber", () => {
    it("should generate a number within the specified range (inclusive)", () => {
      const min = 0;
      const max = 9999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it("should handle min equal to max", () => {
      const val = 5;
      expect(generateSecureRandomNumber(val, val)).toBe(val);
    });

    it("should throw an error if min > max", () => {
      expect(() => generateSecureRandomNumber(10, 5)).toThrow();
    });

    it("should generate different values over many iterations", () => {
      const values = new Set();
      for (let i = 0; i < 50; i++) {
        values.add(generateSecureRandomNumber(0, 1000000));
      }
      // Extremely unlikely to have many collisions in such a large range
      expect(values.size).toBeGreaterThan(45);
    });
  });
});
