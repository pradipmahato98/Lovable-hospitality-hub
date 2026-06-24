import '@testing-library/jest-dom';

// Mock Web Crypto API for jsdom
if (!globalThis.crypto) {
  const crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    }
  };
  Object.defineProperty(globalThis, 'crypto', {
    value: crypto,
    configurable: true,
    writable: true,
  });
}
