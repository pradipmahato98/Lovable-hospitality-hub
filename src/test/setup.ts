import "@testing-library/jest-dom";

// Mock crypto for environments that don't have it (like older jsdom)
if (typeof globalThis.crypto === "undefined") {
  const cryptoMock = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    },
    randomUUID: () => {
      return "12345678-1234-4234-8234-1234567890ab"; // Static UUID for testing
    }
  };

  Object.defineProperty(globalThis, "crypto", {
    value: cryptoMock,
    configurable: true,
    writable: true,
  });
}
