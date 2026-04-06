import { describe, it, expect } from "vitest";
import { generateSecureRandomNumber, generateSecureHex } from "./utils";

describe("generateSecureRandomNumber", () => {
  it("generates a number within the specified range (inclusive)", () => {
    const min = 10;
    const max = 20;
    for (let i = 0; i < 100; i++) {
      const result = generateSecureRandomNumber(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });

  it("handles a single-value range", () => {
    const result = generateSecureRandomNumber(10, 10);
    expect(result).toBe(10);
  });

  it("returns min if max is less than min", () => {
    const result = generateSecureRandomNumber(20, 10);
    expect(result).toBe(20);
  });
});

describe("generateSecureHex", () => {
  it("generates a string of the correct length", () => {
    const bytes = 12;
    const result = generateSecureHex(bytes);
    expect(result).toHaveLength(bytes * 2);
  });

  it("generates a valid hexadecimal string", () => {
    const result = generateSecureHex(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different strings on subsequent calls", () => {
    const result1 = generateSecureHex(8);
    const result2 = generateSecureHex(8);
    expect(result1).not.toBe(result2);
  });
});
