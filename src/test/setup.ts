import "@testing-library/jest-dom";

// Mock globalThis.crypto for browser-compatible utilities in JSDOM
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint8Array | Uint32Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
        }
        return arr;
      }
    }
  });
}
