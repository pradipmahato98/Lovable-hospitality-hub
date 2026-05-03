import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("generates a string of the correct length", () => {
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(16)).toHaveLength(32);
    });

    it("generates valid hexadecimal characters", () => {
      const hex = generateSecureHex(32);
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
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("handles large ranges", () => {
      const num = generateSecureNumber(0, 999999);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(999999);
    });

    it("generates different values over time", () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(generateSecureNumber(0, 1000000));
      }
      expect(results.size).toBeGreaterThan(90);
    });
  });
});
