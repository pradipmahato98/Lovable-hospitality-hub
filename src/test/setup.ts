import "@testing-library/jest-dom";

// Mock global crypto for Node environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
        const max = arr instanceof Uint8Array ? 256 : 4294967296;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * max);
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    },
    configurable: true,
    writable: true,
  });
}
