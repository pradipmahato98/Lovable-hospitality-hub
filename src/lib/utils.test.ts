import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex8 = generateSecureHex(4); // 4 bytes = 8 hex chars
      expect(hex8).toHaveLength(8);
      expect(hex8).toMatch(/^[0-9a-f]{8}$/);

      const hex24 = generateSecureHex(12); // 12 bytes = 24 hex chars
      expect(hex24).toHaveLength(24);
      expect(hex24).toMatch(/^[0-9a-f]{24}$/);
    });

    it("should generate unique values", () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureHex(8));
      }
      expect(values.size).toBe(100);
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

    it("should handle single number ranges", () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it("should generate unique values across multiple calls", () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureNumber(0, 1000000));
      }
      // Extremely low probability of collision in 100 calls for range 1M
      expect(values.size).toBeGreaterThan(95);
    });
  });
});
