import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock global crypto for Node.js environments
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        const range = arr instanceof Uint32Array ? 4294967296 : 256;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * range);
        }
        return arr;
      },
      randomUUID: () => '00000000-0000-0000-0000-000000000000'
    }
  });
}

afterEach(() => {
  cleanup();
});
