import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("generates a string of the correct length", () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it("generates valid hexadecimal characters", () => {
      const hex = generateSecureHex(16);
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
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("handles large ranges correctly", () => {
      const num = generateSecureNumber(0, 1000000);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(1000000);
    });

    it("throws error if min > max", () => {
      expect(() => generateSecureNumber(10, 1)).toThrow("min must be less than or equal to max");
    });
  });
});
