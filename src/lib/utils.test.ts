import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const length = 12;
      const hex = generateSecureHex(length);
      expect(hex).toHaveLength(length * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on successive calls", () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
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

    it("should generate different values on successive calls", () => {
      const num1 = generateSecureNumber(0, 1000000);
      const num2 = generateSecureNumber(0, 1000000);
      expect(num1).not.toBe(num2);
    });
  });
});
