import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars
      expect(hex8).toMatch(/^[0-9a-f]+$/);

      const hex16 = generateSecureHex(16);
      expect(hex16).toHaveLength(32);
    });

    it("should produce different values on subsequent calls", () => {
      const hex1 = generateSecureHex(8);
      const hex2 = generateSecureHex(8);
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

    it("should handle a range of 1", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should handle min and max being 0", () => {
        const num = generateSecureNumber(0, 0);
        expect(num).toBe(0);
    });
  });
});
