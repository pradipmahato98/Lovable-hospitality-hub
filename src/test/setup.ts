import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest with matchers from jest-dom
expect.extend(matchers);

// Mocking crypto since jsdom doesn't provide it by default
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
        }
        return arr;
      }
    }
  });
}

afterEach(() => {
  cleanup();
});
