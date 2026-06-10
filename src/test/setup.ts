import "@testing-library/jest-dom";

// Mocking crypto for Node.js environment
if (!globalThis.crypto) {
  (globalThis as unknown as { crypto: unknown }).crypto = {};
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
  globalThis.crypto.randomUUID = () => "00000000-0000-0000-0000-000000000000";
}
