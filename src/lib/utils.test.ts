import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a string of correct length", () => {
    expect(generateSecureHex(12)).toHaveLength(24);
    expect(generateSecureHex(16)).toHaveLength(32);
  });

  it("generates a valid hexadecimal string", () => {
    const hex = generateSecureHex(12);
    expect(hex).toMatch(/^[0-9a-f]{24}$/);
  });

  it("generates unique strings", () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureNumber", () => {
  it("generates a number within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(0, 9999);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  it("handles range of 1", () => {
    expect(generateSecureNumber(5, 5)).toBe(5);
  });

  it("generates distributed numbers", () => {
    const numbers = new Set();
    for (let i = 0; i < 10; i++) {
      numbers.add(generateSecureNumber(0, 1000000));
    }
    expect(numbers.size).toBe(10);
  });
});
