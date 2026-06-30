/**
 * Vitest Setup File
 *
 * Provides global mocks and environment configuration for tests.
 */
import "@testing-library/jest-dom";

// Mock crypto for environments like jsdom that may not have it
if (!globalThis.crypto) {
  const cryptoMock = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  };

  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoMock,
    configurable: true,
    writable: true,
  });
}
