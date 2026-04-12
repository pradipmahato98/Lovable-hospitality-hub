import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      expect(generateSecureHex(8)).toHaveLength(16);
      expect(generateSecureHex(16)).toHaveLength(32);
    });

    it("should only contain hex characters", () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should be different on subsequent calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureRandomNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("should handle min > max by swapping them", () => {
      const num = generateSecureRandomNumber(10, 1);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    });

    it("should handle min === max", () => {
      const num = generateSecureRandomNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should work for large ranges", () => {
        const num = generateSecureRandomNumber(0, 0xffffffff);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(0xffffffff);
    });
  });
});
