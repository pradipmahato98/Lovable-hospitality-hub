import { describe, it, expect } from "vitest";
import { generateSecureRandomString, generateSecureAPIKey } from "./security";

describe("Security Utilities", () => {
  describe("generateSecureRandomString", () => {
    it("should generate a string of the correct length", () => {
      const length = 16;
      const result = generateSecureRandomString(length);
      expect(result).toHaveLength(length);
    });

    it("should generate unique strings", () => {
      const s1 = generateSecureRandomString(24);
      const s2 = generateSecureRandomString(24);
      expect(s1).not.toBe(s2);
    });

    it("should only contain characters from the charset", () => {
      const result = generateSecureRandomString(100);
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (const char of result) {
        expect(charset).toContain(char);
      }
    });
  });

  describe("generateSecureAPIKey", () => {
    it("should start with the default prefix", () => {
      const result = generateSecureAPIKey();
      expect(result.startsWith("sk_")).toBe(true);
    });

    it("should start with a custom prefix", () => {
      const result = generateSecureAPIKey("pk");
      expect(result.startsWith("pk_")).toBe(true);
    });

    it("should have the correct total length", () => {
      // prefix (2) + underscore (1) + random part (24) = 27
      const result = generateSecureAPIKey("sk");
      expect(result).toHaveLength(27);
    });
  });
});
