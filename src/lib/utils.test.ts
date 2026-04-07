import { describe, it, expect } from "vitest";
import { generateSecureRandomNumber, generateSecureHex } from "./utils";

describe("generateSecureRandomNumber", () => {
  it("generates a number within the specified range [min, max]", () => {
    const min = 10;
    const max = 20;
    for (let i = 0; i < 100; i++) {
      const result = generateSecureRandomNumber(min, max);
      expect(result).toBeGreaterThanOrEqual(min);
      expect(result).toBeLessThanOrEqual(max);
    }
  });

  it("handles min and max being the same", () => {
    const min = 5;
    const max = 5;
    const result = generateSecureRandomNumber(min, max);
    expect(result).toBe(5);
  });

  it("handles min being greater than max by swapping them", () => {
    const min = 20;
    const max = 10;
    const result = generateSecureRandomNumber(min, max);
    expect(result).toBeGreaterThanOrEqual(10);
    expect(result).toBeLessThanOrEqual(20);
  });

  it("generates numbers that appear reasonably distributed", () => {
    const min = 0;
    const max = 9;
    const counts: Record<number, number> = {};
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const num = generateSecureRandomNumber(min, max);
      counts[num] = (counts[num] || 0) + 1;
    }

    // Every number should have been picked at least once in 1000 iterations for range of 10
    Object.keys(counts).forEach((key) => {
        expect(counts[Number(key)]).toBeGreaterThan(0);
    });
    expect(Object.keys(counts).length).toBe(10);
  });
});

describe("generateSecureHex", () => {
  it("generates a hex string of the correct length", () => {
    const bytes = 16;
    const result = generateSecureHex(bytes);
    expect(result).toHaveLength(bytes * 2);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("generates different strings on subsequent calls", () => {
    const result1 = generateSecureHex(16);
    const result2 = generateSecureHex(16);
    expect(result1).not.toBe(result2);
  });

  it("handles different byte lengths", () => {
    expect(generateSecureHex(4)).toHaveLength(8);
    expect(generateSecureHex(8)).toHaveLength(16);
    expect(generateSecureHex(32)).toHaveLength(64);
  });
});
