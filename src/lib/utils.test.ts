import { describe, it, expect } from "vitest";
import { generateSecureHex, generateSecureNumber } from "./utils";

describe("generateSecureHex", () => {
  it("generates a hex string of the correct length", () => {
    const hex8 = generateSecureHex(8);
    expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars
    expect(hex8).toMatch(/^[0-9a-f]+$/);

    const hex16 = generateSecureHex(16);
    expect(hex16).toHaveLength(32);
  });

  it("generates different values on subsequent calls", () => {
    const val1 = generateSecureHex(16);
    const val2 = generateSecureHex(16);
    expect(val1).not.toBe(val2);
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

  it("generates different values on subsequent calls", () => {
    const val1 = generateSecureNumber(0, 1000000);
    const val2 = generateSecureNumber(0, 1000000);
    expect(val1).not.toBe(val2);
  });
});
