import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from '../utils';

describe('Cryptographic Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a hex string of the correct length', () => {
      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars

      const hex16 = generateSecureHex(16);
      expect(hex16).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should only contain hex characters', () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should be reasonably unique (low chance of collision)', () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate a number within the specified range [min, max]', () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it('should handle a single value range', () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it('should work with large ranges', () => {
      const min = 0;
      const max = 1000000;
      const num = generateSecureNumber(min, max);
      expect(num).toBeGreaterThanOrEqual(min);
      expect(num).toBeLessThanOrEqual(max);
    });
  });
});
