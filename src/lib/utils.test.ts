import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on subsequent calls", () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });

    it("should handle custom byte lengths", () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("should handle range of 0", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should generate diverse values over many iterations", () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureNumber(0, 1000000));
      }
      expect(values.size).toBeGreaterThan(95); // High probability of being unique
    });
  });
});
