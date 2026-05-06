import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("generates a string of the correct length", () => {
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(4)).toHaveLength(8);
    });

    it("generates a valid hexadecimal string", () => {
      const hex = generateSecureHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("generates different values each time", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("generates a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(0, 9);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(9);
      }
    });

    it("handles negative ranges", () => {
      const num = generateSecureNumber(-10, -5);
      expect(num).toBeGreaterThanOrEqual(-10);
      expect(num).toBeLessThanOrEqual(-5);
    });

    it("generates different values each time", () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(generateSecureNumber(0, 1000000));
      }
      expect(results.size).toBeGreaterThan(95);
    });
  });
});
