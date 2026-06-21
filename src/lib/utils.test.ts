import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a string of the correct length", () => {
      expect(generateSecureHex(10)).toHaveLength(10);
      expect(generateSecureHex(24)).toHaveLength(24);
    });

    it("should generate a valid hex string", () => {
      const hex = generateSecureHex(100);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different strings on subsequent calls", () => {
      const hex1 = generateSecureHex(20);
      const hex2 = generateSecureHex(20);
      expect(hex1).not.toBe(hex2);
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

    it("should handle min and max being the same", () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });

    it("should throw an error if min > max", () => {
      expect(() => generateSecureNumber(10, 5)).toThrow("Min must be less than or equal to max");
    });
  });
});
