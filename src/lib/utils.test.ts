import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('generates a hex string of the correct length', () => {
      const bytes = 12;
      const hex = generateSecureHex(bytes);
      expect(hex).toHaveLength(bytes * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('generates unique strings', () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('generates a number within the specified range', () => {
      const min = 0;
      const max = 9999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it('handles a range of 1 correctly', () => {
      const num = generateSecureRandomNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
