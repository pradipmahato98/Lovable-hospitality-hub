import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a string of the correct length", () => {
    expect(generateSecureHex(8)).toHaveLength(16);
    expect(generateSecureHex(16)).toHaveLength(32);
    expect(generateSecureHex()).toHaveLength(32); // default
  });

  it("generates valid hexadecimal characters", () => {
    const hex = generateSecureHex(32);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different values each time", () => {
    const hex1 = generateSecureHex(16);
    const hex2 = generateSecureHex(16);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureNumber", () => {
  it("generates a number within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(1000, 9999);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  it("handles a single number range", () => {
    expect(generateSecureNumber(5, 5)).toBe(5);
  });

  it("generates different values over multiple calls", () => {
    const nums = new Set();
    for (let i = 0; i < 100; i++) {
      nums.add(generateSecureNumber(0, 1000000));
    }
    expect(nums.size).toBeGreaterThan(95);
  });
});
