import "@testing-library/jest-dom";

// Mock global crypto for tests
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  },
  configurable: true,
  writable: true,
});
