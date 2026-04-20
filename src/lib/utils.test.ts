import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    expect(hex).toHaveLength(bytes * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should generate different values each time", () => {
    const hex1 = generateSecureHex(16);
    const hex2 = generateSecureHex(16);
    expect(hex1).not.toBe(hex2);
  });

  it("should handle different byte lengths", () => {
    expect(generateSecureHex(4)).toHaveLength(8);
    expect(generateSecureHex(8)).toHaveLength(16);
    expect(generateSecureHex(32)).toHaveLength(64);
  });
});
