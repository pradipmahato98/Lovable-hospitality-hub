import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a string of the correct length", () => {
    expect(generateSecureHex(4)).toHaveLength(8);
    expect(generateSecureHex(16)).toHaveLength(32);
    expect(generateSecureHex(12)).toHaveLength(24);
  });

  it("should generate a valid hexadecimal string", () => {
    const hex = generateSecureHex(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should generate different values on subsequent calls", () => {
    const hex1 = generateSecureHex(16);
    const hex2 = generateSecureHex(16);
    expect(hex1).not.toBe(hex2);
  });
});
