import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex } from './utils';

describe('generateSecureHex', () => {
  it('should generate a hex string of the correct length', () => {
    const bytes = 16;
    const result = generateSecureHex(bytes);
    // 16 bytes = 32 hex characters
    expect(result).toHaveLength(bytes * 2);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  it('should use a default length of 16 bytes', () => {
    const result = generateSecureHex();
    expect(result).toHaveLength(32);
  });

  it('should produce different values on subsequent calls', () => {
    const result1 = generateSecureHex(8);
    const result2 = generateSecureHex(8);
    expect(result1).not.toBe(result2);
  });
});
