import "@testing-library/jest-dom";

// Mock globalThis.crypto for Vitest/JSDOM environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    },
    writable: true,
  });
}
