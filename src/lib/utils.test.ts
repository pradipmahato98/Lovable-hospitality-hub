import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
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
  });

  describe('generateSecureNumber', () => {
    it('should generate a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(100000, 999999);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });

    it('should throw an error if min > max', () => {
      expect(() => generateSecureNumber(10, 5)).toThrow();
    });

    it('should handle a single number range', () => {
      expect(generateSecureNumber(5, 5)).toBe(5);
    });
  });
});
