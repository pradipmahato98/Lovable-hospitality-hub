import { describe, it, expect } from "vitest";
import {
  generateSecureRandomString,
  generateSecureAPIKey,
  generateSecureNumericString
} from "./security";

describe("Security Utilities", () => {
  describe("generateSecureRandomString", () => {
    it("should generate a string of the correct length", () => {
      expect(generateSecureRandomString(10)).toHaveLength(10);
      expect(generateSecureRandomString(32)).toHaveLength(32);
    });

    it("should generate unique strings", () => {
      const s1 = generateSecureRandomString(16);
      const s2 = generateSecureRandomString(16);
      expect(s1).not.toBe(s2);
    });

    it("should only contain characters from the default charset", () => {
      const result = generateSecureRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("generateSecureAPIKey", () => {
    it("should start with sk_ prefix", () => {
      expect(generateSecureAPIKey()).toMatch(/^sk_/);
    });

    it("should have correct length (sk_ + 24)", () => {
      expect(generateSecureAPIKey()).toHaveLength(27);
    });
  });

  describe("generateSecureNumericString", () => {
    it("should generate a numeric string of the correct length", () => {
      expect(generateSecureNumericString(6)).toHaveLength(6);
      expect(generateSecureNumericString(6)).toMatch(/^[0-9]+$/);
    });

    it("should generate unique numeric strings", () => {
      const s1 = generateSecureNumericString(6);
      const s2 = generateSecureNumericString(6);
      expect(s1).not.toBe(s2);
    });
  });
});
