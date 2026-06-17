import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("generates a string of the correct length", () => {
      const hex16 = generateSecureHex(16);
      expect(hex16).toHaveLength(32); // 16 bytes = 32 hex chars

      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars
    });

    it("generates only valid hex characters", () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("generates different values on subsequent calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("generates a number within the specified range", () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it("works with a range of 1", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it("generates different values on subsequent calls", () => {
      const num1 = generateSecureNumber(0, 1000000);
      const num2 = generateSecureNumber(0, 1000000);
      expect(num1).not.toBe(num2);
    });
  });
});
