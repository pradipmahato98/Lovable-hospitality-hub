import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureRandomNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a hex string of the correct length", () => {
    expect(generateSecureHex(4)).toHaveLength(8);
    expect(generateSecureHex(12)).toHaveLength(24);
    expect(generateSecureHex(16)).toHaveLength(32);
  });

  it("generates valid hex characters", () => {
    const hex = generateSecureHex(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different values on subsequent calls", () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureRandomNumber", () => {
  it("generates numbers within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const val = generateSecureRandomNumber(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it("handles negative ranges", () => {
    const val = generateSecureRandomNumber(-10, -1);
    expect(val).toBeGreaterThanOrEqual(-10);
    expect(val).toBeLessThanOrEqual(-1);
  });

  it("handles min > max by swapping them", () => {
    const val = generateSecureRandomNumber(10, 1);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10);
  });

  it("returns the min value if range is 1", () => {
    const val = generateSecureRandomNumber(5, 5);
    expect(val).toBe(5);
  });
});
