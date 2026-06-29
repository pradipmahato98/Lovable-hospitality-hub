import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a hex string of the correct length', () => {
      const hex8 = generateSecureHex(4);
      expect(hex8).toHaveLength(8);
      expect(hex8).toMatch(/^[0-9a-f]{8}$/);

      const hex32 = generateSecureHex(16);
      expect(hex32).toHaveLength(32);
      expect(hex32).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate unique strings', () => {
      const s1 = generateSecureHex(16);
      const s2 = generateSecureHex(16);
      expect(s1).not.toBe(s2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate numbers within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it('should work with a single-number range', () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it('should throw if min > max', () => {
      expect(() => generateSecureNumber(10, 1)).toThrow('min must be less than or equal to max');
    });
  });
});
