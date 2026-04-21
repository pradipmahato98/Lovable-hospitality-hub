import { describe, it, expect, vi } from "vitest";
import { generateSecureHex } from "./utils";

describe("generateSecureHex", () => {
  it("should generate a hex string of the correct length", () => {
    const bytes = 12;
    const result = generateSecureHex(bytes);
    expect(result).toHaveLength(bytes * 2);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it("should use globalThis.crypto.getRandomValues", () => {
    const spy = vi.spyOn(globalThis.crypto, "getRandomValues");
    generateSecureHex(8);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should generate different values on subsequent calls", () => {
    const result1 = generateSecureHex(16);
    const result2 = generateSecureHex(16);
    expect(result1).not.toBe(result2);
  });
});
