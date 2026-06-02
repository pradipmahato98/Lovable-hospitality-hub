import "@testing-library/jest-dom";

// Mock for globalThis.crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint32Array | Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 4294967296 : 256));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000"
  }
});
