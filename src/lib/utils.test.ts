import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const hex = generateSecureHex(16);
    expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it("should generate different values each time", () => {
    const hex1 = generateSecureHex(16);
    const hex2 = generateSecureHex(16);
    expect(hex1).not.toBe(hex2);
  });
});

describe("generateSecureNumber", () => {
  it("should generate a number within the specified range", () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(1000, 9999);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });

  it("should generate different numbers over multiple calls", () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateSecureNumber(0, 1000000));
    }
    expect(numbers.size).toBeGreaterThan(90);
  });
});
