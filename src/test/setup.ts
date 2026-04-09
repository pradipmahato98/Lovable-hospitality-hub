import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock globalThis.crypto for Vitest/JSDOM environment
if (!globalThis.crypto) {
  (globalThis as any).crypto = {
    getRandomValues: <T extends Uint32Array | Uint8Array>(arr: T): T => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * (arr instanceof Uint32Array ? 0xffffffff : 0xff));
      }
      return arr;
    },
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
  };
}
