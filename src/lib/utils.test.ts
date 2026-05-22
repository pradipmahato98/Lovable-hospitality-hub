import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on subsequent calls", () => {
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
      }
    });

    it("should handle min and max being the same", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
