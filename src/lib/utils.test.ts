import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex } from './utils';

describe('generateSecureHex', () => {
  it('should generate a hex string of the correct length', () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    expect(hex).toHaveLength(bytes * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('should generate different strings on subsequent calls', () => {
    const hex1 = generateSecureHex(8);
    const hex2 = generateSecureHex(8);
    expect(hex1).not.toBe(hex2);
  });

  it('should use crypto.getRandomValues', () => {
    const getRandomValuesSpy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    generateSecureHex(16);
    expect(getRandomValuesSpy).toHaveBeenCalled();
    getRandomValuesSpy.mockRestore();
  });
});
