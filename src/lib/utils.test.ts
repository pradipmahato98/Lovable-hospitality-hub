import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    // 12 bytes = 24 hex characters
    expect(hex).toHaveLength(bytes * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should use the default number of bytes (16)", () => {
    const hex = generateSecureHex();
    expect(hex).toHaveLength(32);
  });

  it("should produce different values on subsequent calls", () => {
    const hex1 = generateSecureHex(8);
    const hex2 = generateSecureHex(8);
    expect(hex1).not.toBe(hex2);
  });
});
