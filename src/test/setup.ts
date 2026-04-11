import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto for Node.js environment in Vitest
if (!globalThis.crypto) {
  const { webcrypto } = await import("node:crypto");
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: true,
  });
}
