import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different strings on each call", () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1000, 9999);
        expect(num).toBeGreaterThanOrEqual(1000);
        expect(num).toBeLessThanOrEqual(9999);
      }
    });

    it("should handle min and max being the same", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
