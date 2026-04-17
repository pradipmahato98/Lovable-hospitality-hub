import { vi } from 'vitest';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint8Array | Uint32Array | Int8Array | Uint16Array | Int16Array | Int32Array | BigUint64Array | BigInt64Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          (arr as any)[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
  });
}
