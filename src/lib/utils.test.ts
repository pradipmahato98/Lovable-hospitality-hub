import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("generates a hex string of the correct length", () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("generates different values each time", () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("generates a number within the specified range", () => {
      const min = 100000;
      const max = 999999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("generates different values each time", () => {
      const num1 = generateSecureNumber(0, 1000000);
      const num2 = generateSecureNumber(0, 1000000);
      expect(num1).not.toBe(num2);
    });
  });
});
