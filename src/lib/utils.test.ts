import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("generates a string of the correct length", () => {
    expect(generateSecureHex(12)).toHaveLength(24);
    expect(generateSecureHex(16)).toHaveLength(32);
    expect(generateSecureHex(4)).toHaveLength(8);
  });

  it("generates valid hexadecimal characters", () => {
    const hex = generateSecureHex(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different values on subsequent calls", () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });
});
