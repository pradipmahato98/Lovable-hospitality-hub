import { describe, it, expect } from "vitest";
import { generateSecureRandomString, generateSecureAPIKey } from "./security";

describe("security utilities", () => {
  it("generates a random string of the correct length", () => {
    const length = 10;
    const str = generateSecureRandomString(length);
    expect(str).toHaveLength(length);
  });

  it("generates different strings each time", () => {
    const str1 = generateSecureRandomString(10);
    const str2 = generateSecureRandomString(10);
    expect(str1).not.toBe(str2);
  });

  it("generates a secure API key with prefix", () => {
    const key = generateSecureAPIKey("test", 10);
    expect(key).toMatch(/^test_[a-zA-Z0-9]{10}$/);
  });

  it("uses default prefix 'sk'", () => {
    const key = generateSecureAPIKey();
    expect(key.startsWith("sk_")).toBe(true);
  });
});
