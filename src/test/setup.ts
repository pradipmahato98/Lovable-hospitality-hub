import "@testing-library/jest-dom";

// Mock globalThis.crypto for environments where it is missing (like jsdom)
if (!globalThis.crypto) {
  const cryptoMock = {
    getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        if (arr instanceof Uint8Array) {
           arr[i] = Math.floor(Math.random() * 256);
        } else if (arr instanceof Uint32Array) {
           arr[i] = Math.floor(Math.random() * 4294967296);
        }
      }
      return arr;
    },
  };

  Object.defineProperty(globalThis, "crypto", {
    value: cryptoMock,
    configurable: true,
    writable: true,
  });
}
