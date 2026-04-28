import "@testing-library/jest-dom";

// Mock for crypto.getRandomValues and randomUUID to support vitest environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        // Use Math.random for test environment
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 4294967296 : 256));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  },
  writable: true,
});
