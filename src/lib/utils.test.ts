import { describe, it, expect, vi } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of the correct length", () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it("should use crypto.getRandomValues", () => {
      const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
      generateSecureHex(12);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("generateSecureNumber", () => {
    it("should generate a number within the specified range", () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(0, 9);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(9);
      }
    });

    it("should use crypto.getRandomValues", () => {
      const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
      generateSecureNumber(0, 100);
      expect(spy).toHaveBeenCalled();
    });
  });
});
