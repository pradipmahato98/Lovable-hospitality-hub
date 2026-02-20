import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});
