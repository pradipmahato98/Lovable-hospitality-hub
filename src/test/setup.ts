import "@testing-library/jest-dom";

// Mock globalThis.crypto for Vitest environment (Node.js/JSDOM)
// This is needed because JSDOM doesn't implement the Crypto API
if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          // Fill with random values - for testing purposes, Math.random is acceptable in the mock
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 4294967296 : 256));
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    },
    configurable: true,
    writable: true
  });
}
