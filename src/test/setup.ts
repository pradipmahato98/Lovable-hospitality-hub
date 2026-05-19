import "@testing-library/jest-dom";

// Mock globalThis.crypto for Vitest environment
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          if (arr instanceof Uint8Array) {
            arr[i] = Math.floor(Math.random() * 256);
          } else {
            arr[i] = Math.floor(Math.random() * 4294967296);
          }
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000",
    },
  });
}
