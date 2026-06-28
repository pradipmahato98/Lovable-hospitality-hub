import { vi } from 'vitest';

if (!globalThis.crypto) {
  const cryptoMock = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'mocked-uuid'
  };
  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoMock,
    configurable: true,
    writable: true
  });
}
