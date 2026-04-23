import { describe, it, expect } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("generates a string of the correct length", () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    expect(hex).toHaveLength(bytes * 2);
  });

  it("generates a valid hexadecimal string", () => {
    const hex = generateSecureHex(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different values on subsequent calls", () => {
    const hex1 = generateSecureHex(8);
    const hex2 = generateSecureHex(8);
    expect(hex1).not.toBe(hex2);
  });
});
