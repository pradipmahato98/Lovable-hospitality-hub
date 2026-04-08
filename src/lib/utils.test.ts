import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Secure Random Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a hex string of correct length', () => {
      expect(generateSecureHex(4)).toHaveLength(8);
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(16)).toHaveLength(32);
    });

    it('should generate valid hexadecimal characters', () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique values', () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('should stay within the specified range [min, max]', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureRandomNumber(10, 20);
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThanOrEqual(20);
      }
    });

    it('should handle min === max', () => {
      expect(generateSecureRandomNumber(5, 5)).toBe(5);
    });

    it('should handle min > max by returning min', () => {
      expect(generateSecureRandomNumber(10, 5)).toBe(10);
    });

    it('should generate unique values over many iterations', () => {
      const values = new Set();
      for (let i = 0; i < 100; i++) {
        values.add(generateSecureRandomNumber(0, 1000000));
      }
      expect(values.size).toBeGreaterThan(95);
    });
  });
});
