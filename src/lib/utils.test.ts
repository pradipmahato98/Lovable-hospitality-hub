import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a string of the correct length", () => {
    const hex = generateSecureHex(12);
    expect(hex).toHaveLength(24); // 12 bytes * 2 chars per byte
  });

  it("should only contain hexadecimal characters", () => {
    const hex = generateSecureHex(32);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateSecureNumber", () => {
  it("should generate a number within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(100000, 999999);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it("should work for small ranges", () => {
    const results = new Set();
    for (let i = 0; i < 50; i++) {
      results.add(generateSecureNumber(0, 1));
    }
    expect(results.has(0)).toBe(true);
    expect(results.has(1)).toBe(true);
    expect(results.size).toBe(2);
  });
});
