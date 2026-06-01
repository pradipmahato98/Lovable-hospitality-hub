import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('generates a string of the correct length', () => {
      const hex = generateSecureHex(16);
      expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('generates valid hex characters', () => {
      const hex = generateSecureHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('generates different values each time', () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureNumber', () => {
    it('generates a number within the specified range', () => {
      const min = 100;
      const max = 200;
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(min, max);
        expect(num).toBeGreaterThanOrEqual(min);
        expect(num).toBeLessThanOrEqual(max);
      }
    });

    it('handles a single value range', () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });
  });
});
