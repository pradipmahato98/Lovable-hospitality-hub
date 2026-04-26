import "@testing-library/jest-dom";

// Mocking the browser's crypto object for Vitest in Node environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        const max = arr instanceof Uint32Array ? 0xffffffff : 256;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * max);
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    },
  });
}
