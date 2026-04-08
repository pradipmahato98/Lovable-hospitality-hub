import { vi } from 'vitest';

// Mock globalThis.crypto for Vitest environment
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          if (arr instanceof Uint32Array) {
            arr[i] = Math.floor(Math.random() * 0xffffffff);
          } else {
            arr[i] = Math.floor(Math.random() * 256);
          }
        }
        return arr;
      },
    },
  });
}
