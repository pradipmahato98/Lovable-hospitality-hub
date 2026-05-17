import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(16)).toHaveLength(32);
    });

    it("should generate different values each time", () => {
      const val1 = generateSecureHex(12);
      const val2 = generateSecureHex(12);
      expect(val1).not.toBe(val2);
    });

    it("should only contain hexadecimal characters", () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(100000, 999999);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it("should generate different values", () => {
      const num1 = generateSecureNumber(0, 1000000);
      const num2 = generateSecureNumber(0, 1000000);
      expect(num1).not.toBe(num2);
    });
  });
});
