import { vi } from 'vitest';

// Mock crypto for vitest environment
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint32Array | Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});
