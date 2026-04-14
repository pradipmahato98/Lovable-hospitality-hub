import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("Security Utilities", () => {
  describe("generateSecureHex", () => {
    it("should generate a hex string of correct length", () => {
      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16);
      expect(hex8).toMatch(/^[0-9a-f]{16}$/);

      const hex12 = generateSecureHex(12);
      expect(hex12).toHaveLength(24);
      expect(hex12).toMatch(/^[0-9a-f]{24}$/);
    });

    it("should generate different values on subsequent calls", () => {
      const val1 = generateSecureHex(12);
      const val2 = generateSecureHex(12);
      expect(val1).not.toBe(val2);
    });
  });
});
