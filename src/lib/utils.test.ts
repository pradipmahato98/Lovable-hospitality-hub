import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different strings on subsequent calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });

    it("should handle custom byte lengths", () => {
      expect(generateSecureHex(4)).toHaveLength(8);
      expect(generateSecureHex(12)).toHaveLength(24);
    });
  });

  describe("generateSecureRandomNumber", () => {
    it("should generate numbers within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
        expect(Number.isInteger(num)).toBe(true);
      }
    });

    it("should handle min > max by swapping them", () => {
      const num = generateSecureRandomNumber(10, 1);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it("should return min if range is 1", () => {
      expect(generateSecureRandomNumber(5, 5)).toBe(5);
    });
  });
});
