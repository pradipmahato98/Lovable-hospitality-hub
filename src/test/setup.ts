import { vi } from 'vitest';

// Mock window.crypto for tests
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array | Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 256));
      }
      return arr;
    },
  },
});
