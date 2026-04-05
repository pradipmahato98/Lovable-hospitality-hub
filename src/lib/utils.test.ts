import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Secure PRNG Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a string of the correct length', () => {
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(1)).toHaveLength(2);
      expect(generateSecureHex(0)).toHaveLength(0);
    });

    it('should generate valid hexadecimal strings', () => {
      const hex = generateSecureHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values', () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('should generate numbers within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(10, 20);
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThanOrEqual(20);
      }
    });

    it('should handle small ranges', () => {
      expect(generateSecureRandomNumber(5, 5)).toBe(5);
    });

    it('should handle large ranges', () => {
      const num = generateSecureRandomNumber(0, 1000000);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(1000000);
    });

    it('should return min if range is invalid', () => {
      expect(generateSecureRandomNumber(10, 5)).toBe(10);
    });
  });
});
