import "@testing-library/jest-dom";

// Mock globalThis.crypto for Vitest environment
if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error - Mocking global crypto
  globalThis.crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  };
}
