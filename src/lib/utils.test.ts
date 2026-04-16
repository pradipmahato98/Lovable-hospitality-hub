import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a string of the correct length", () => {
    expect(generateSecureHex(4)).toHaveLength(8); // 4 bytes = 8 hex chars
    expect(generateSecureHex(12)).toHaveLength(24); // 12 bytes = 24 hex chars
  });

  it("should generate valid hexadecimal characters", () => {
    const hex = generateSecureHex(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should generate different values on subsequent calls", () => {
    const hex1 = generateSecureHex(8);
    const hex2 = generateSecureHex(8);
    expect(hex1).not.toBe(hex2);
  });
});
