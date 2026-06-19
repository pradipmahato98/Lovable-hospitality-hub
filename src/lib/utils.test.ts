import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  it('generateSecureHex should return a string of correct length', () => {
    const hex = generateSecureHex(12);
    expect(hex).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('generateSecureNumber should return a number within range', () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(100000, 999999);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });
});
