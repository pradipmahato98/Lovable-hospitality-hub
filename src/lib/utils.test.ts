import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a hex string of the correct length', () => {
      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars
      expect(hex8).toMatch(/^[0-9a-f]+$/);

      const hex12 = generateSecureHex(12);
      expect(hex12).toHaveLength(24);
      expect(hex12).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values on subsequent calls', () => {
      const val1 = generateSecureHex(10);
      const val2 = generateSecureHex(10);
      expect(val1).not.toBe(val2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1000, 9999);
        expect(num).toBeGreaterThanOrEqual(1000);
        expect(num).toBeLessThanOrEqual(9999);
      }
    });

    it('should handle small ranges', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(generateSecureNumber(1, 5));
      }
      expect(results.size).toBeGreaterThan(1);
      results.forEach(val => {
        expect(val as number).toBeGreaterThanOrEqual(1);
        expect(val as number).toBeLessThanOrEqual(5);
      });
    });
  });
});
