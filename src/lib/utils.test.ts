import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Secure Random Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a string of the correct length', () => {
      const hex = generateSecureHex(12);
      expect(hex).toHaveLength(24); // 12 bytes = 24 hex chars
    });

    it('should only contain hexadecimal characters', () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values on subsequent calls', () => {
      const hex1 = generateSecureHex(8);
      const hex2 = generateSecureHex(8);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it('should handle a single-value range', () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it('should handle large ranges', () => {
      const num = generateSecureNumber(0, 1000000);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(1000000);
    });
  });
});
