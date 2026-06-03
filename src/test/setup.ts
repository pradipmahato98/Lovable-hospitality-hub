import "@testing-library/jest-dom";

// Mock global crypto for Vitest environment
if (!globalThis.crypto) {
  const cryptoMock = {
    getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        // Use Math.random as a fallback for the mock, knowing this is only for tests
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  };

  Object.defineProperty(globalThis, "crypto", {
    value: cryptoMock,
    writable: true,
  });
}
