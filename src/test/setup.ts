import "@testing-library/jest-dom";

// Mock window.crypto for tests
if (typeof window !== "undefined" && !window.crypto) {
  Object.defineProperty(window, "crypto", {
    value: {
      getRandomValues: (arr: Uint8Array | Uint32Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * (arr instanceof Uint8Array ? 256 : 4294967296));
        }
        return arr;
      },
    },
  });
}
