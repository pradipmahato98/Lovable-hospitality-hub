import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Random Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a string of the correct length", () => {
      expect(generateSecureHex(4)).toHaveLength(8);
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(16)).toHaveLength(32);
    });

    it("should generate a valid hexadecimal string", () => {
      const hex = generateSecureHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should produce different values on consecutive calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("should handle min equal to max", () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });

    it("should throw an error if min > max", () => {
      expect(() => generateSecureNumber(10, 1)).toThrow();
    });

    it("should generate all numbers in range eventually", () => {
      const seen = new Set<number>();
      for (let i = 0; i < 200; i++) {
        seen.add(generateSecureNumber(0, 9));
      }
      expect(seen.size).toBe(10);
    });
  });
});
