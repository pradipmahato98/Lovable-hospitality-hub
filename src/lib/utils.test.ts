import { describe, it, expect, vi } from "vitest";
import { generateSecureNumber, generateSecureHex } from "./utils";

describe("generateSecureNumber", () => {
  it("should generate a number within the specified range", () => {
    const min = 10;
    const max = 20;
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    }
  });

  it("should handle min equal to max", () => {
    expect(generateSecureNumber(5, 5)).toBe(5);
  });

  it("should handle min greater than max", () => {
    expect(generateSecureNumber(10, 5)).toBe(10);
  });
});

describe("generateSecureHex", () => {
  it("should generate a hex string of the specified length", () => {
    expect(generateSecureHex(8)).toHaveLength(8);
    expect(generateSecureHex(16)).toHaveLength(16);
    expect(generateSecureHex(1)).toHaveLength(1);
  });

  it("should only contain hex characters", () => {
    const hex = generateSecureHex(100);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});
