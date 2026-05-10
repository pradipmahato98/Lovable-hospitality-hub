import { describe, it, expect } from "vitest";
import { generateSecureNumber, generateSecureHex } from "./utils";

describe("Security Utilities", () => {
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

    it("should handle single number range", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });

  describe("generateSecureHex", () => {
    it("should generate a hex string of correct length", () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values", () => {
      const hex1 = generateSecureHex(8);
      const hex2 = generateSecureHex(8);
      expect(hex1).not.toBe(hex2);
    });
  });
});
