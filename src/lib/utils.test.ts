import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Secure Random Utilities', () => {
  describe('generateSecureHex', () => {
    it('generates a hex string of the correct length', () => {
      const hex1 = generateSecureHex(4); // 8 hex chars
      const hex2 = generateSecureHex(12); // 24 hex chars

      expect(hex1).toHaveLength(8);
      expect(hex2).toHaveLength(24);
      expect(hex1).toMatch(/^[0-9a-f]+$/);
      expect(hex2).toMatch(/^[0-9a-f]+$/);
    });

    it('generates unique values', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureHex(8));
      }
      expect(values.size).toBe(100);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('generates numbers within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it('handles min equal to max', () => {
      expect(generateSecureRandomNumber(5, 5)).toBe(5);
    });

    it('throws error if min > max', () => {
      expect(() => generateSecureRandomNumber(10, 1)).toThrow();
    });

    it('handles large ranges', () => {
      const num = generateSecureRandomNumber(0, 0xffffffff);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(0xffffffff);
    });
  });
});
