import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a string of the correct length', () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values on subsequent calls', () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('should generate a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it('should handle min equals max', () => {
      const num = generateSecureRandomNumber(5, 5);
      expect(num).toBe(5);
    });

    it('should handle large ranges', () => {
      const num = generateSecureRandomNumber(0, 1000000);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(1000000);
    });

    it('should return min if range is invalid', () => {
      const num = generateSecureRandomNumber(10, 5);
      expect(num).toBe(10);
    });
  });
});
