import "@testing-library/jest-dom";

// Mock global crypto for Vitest environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {},
    writable: true,
    configurable: true
  });
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = <T extends Uint32Array | Uint8Array>(arr: T): T => {
    for (let i = 0; i < arr.length; i++) {
      if (arr instanceof Uint8Array) {
        arr[i] = Math.floor(Math.random() * 256);
      } else if (arr instanceof Uint32Array) {
        arr[i] = Math.floor(Math.random() * 4294967296);
      }
    }
    return arr;
  };
}

if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => '00000000-0000-0000-0000-000000000000',
    writable: true,
    configurable: true
  });
}
