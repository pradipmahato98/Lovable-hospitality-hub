import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of correct length", () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(0, 9999);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(9999);
      }
    });

    it("should respect min and max values", () => {
      const num = generateSecureNumber(50, 50);
      expect(num).toBe(50);
    });
  });
});
