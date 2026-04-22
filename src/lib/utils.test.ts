import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a string of the correct length", () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    // 12 bytes = 24 hex characters
    expect(hex).toHaveLength(bytes * 2);
  });

  it("should generate a valid hexadecimal string", () => {
    const hex = generateSecureHex(12);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should produce different values on subsequent calls", () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });

  it("should handle different byte lengths", () => {
    expect(generateSecureHex(4)).toHaveLength(8);
    expect(generateSecureHex(16)).toHaveLength(32);
  });
});
