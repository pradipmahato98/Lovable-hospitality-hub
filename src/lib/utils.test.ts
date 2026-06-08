import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex8 = generateSecureHex(4);
      expect(hex8).toHaveLength(8);
      expect(hex8).toMatch(/^[0-9a-f]+$/);

      const hex16 = generateSecureHex(8);
      expect(hex16).toHaveLength(16);
      expect(hex16).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate different values on consecutive calls", () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1000, 9999);
        expect(num).toBeGreaterThanOrEqual(1000);
        expect(num).toBeLessThanOrEqual(9999);
      }
    });

    it("should handle single number range", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
