import { describe, it, expect } from 'vitest';
import { generateSecureHex } from './utils';

describe('generateSecureHex', () => {
  it('should generate a hex string of the correct length', () => {
    const bytes = 12;
    const hex = generateSecureHex(bytes);
    expect(hex).toHaveLength(bytes * 2);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('should generate different strings on subsequent calls', () => {
    const hex1 = generateSecureHex(12);
    const hex2 = generateSecureHex(12);
    expect(hex1).not.toBe(hex2);
  });
});
