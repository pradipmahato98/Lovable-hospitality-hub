import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global crypto for environments where it's not available (like older Node.js versions in some test environments)
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
        const isUint32 = arr instanceof Uint32Array;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (isUint32 ? 4294967296 : 256));
        }
        return arr;
      },
      randomUUID: () => "00000000-0000-0000-0000-000000000000"
    },
  });
}
