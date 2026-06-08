import "@testing-library/jest-dom";

// Mock global crypto for environments where it's not available (like jsdom in some cases)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: unknown }).crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        // Use Math.random as a fallback for testing ONLY
        if (arr instanceof Uint8Array) {
          arr[i] = Math.floor(Math.random() * 256);
        } else if (arr instanceof Uint32Array) {
          arr[i] = Math.floor(Math.random() * 4294967296);
        }
      }
      return arr;
    },
    randomUUID: () => '00000000-0000-0000-0000-000000000000'
  };
} else if (typeof (globalThis.crypto as any).randomUUID === 'undefined') {
    (globalThis.crypto as unknown as { randomUUID: unknown }).randomUUID = () => '00000000-0000-0000-0000-000000000000';
}
