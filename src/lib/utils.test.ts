import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex8 = generateSecureHex(4); // 4 bytes = 8 hex chars
      expect(hex8).toHaveLength(8);
      expect(hex8).toMatch(/^[0-9a-f]{8}$/);

      const hex16 = generateSecureHex(8); // 8 bytes = 16 hex chars
      expect(hex16).toHaveLength(16);
      expect(hex16).toMatch(/^[0-9a-f]{16}$/);
    });

    it("should generate different values on subsequent calls", () => {
      const val1 = generateSecureHex(16);
      const val2 = generateSecureHex(16);
      expect(val1).not.toBe(val2);
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(100, 200);
        expect(num).toBeGreaterThanOrEqual(100);
        expect(num).toBeLessThanOrEqual(200);
      }
    });

    it("should handle single number range", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
