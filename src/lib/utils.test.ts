import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("Secure PRNG Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a string of the correct length", () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex characters
    });

    it("should generate a valid hexadecimal string", () => {
      const hex = generateSecureHex(8);
      expect(hex).toMatch(/^[0-9a-f]{16}$/);
    });

    it("should generate different values each time", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
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

    it("should handle min and max in any order", () => {
      const min = 20;
      const max = 10;
      const num = generateSecureRandomNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(10);
      expect(num).toBeLessThanOrEqual(20);
    });

    it("should return the number when min equals max", () => {
      const num = generateSecureRandomNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should generate different values (probabilistic)", () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureRandomNumber(0, 1000000));
      }
      expect(values.size).toBeGreaterThan(95);
    });
  });
});
