import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a hex string of the correct length', () => {
      const length = 12;
      const hex = generateSecureHex(length);
      expect(hex).toHaveLength(length * 2);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different strings', () => {
      const hex1 = generateSecureHex(12);
      const hex2 = generateSecureHex(12);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate a number within the specified range', () => {
      const min = 100000;
      const max = 999999;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it('should handle small ranges', () => {
      const min = 0;
      const max = 1;
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(generateSecureNumber(min, max));
      }
      expect(results.has(0)).toBe(true);
      expect(results.has(1)).toBe(true);
      expect(results.size).toBe(2);
    });
  });
});
