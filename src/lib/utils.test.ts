import { describe, it, expect } from 'vitest';
import { generateSecureHex, generateSecureNumber } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureHex', () => {
    it('should generate a string of the correct length', () => {
      const hex16 = generateSecureHex(16);
      expect(hex16).toHaveLength(32); // 16 bytes = 32 hex chars

      const hex8 = generateSecureHex(8);
      expect(hex8).toHaveLength(16);
    });

    it('should only contain valid hex characters', () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different values each time', () => {
      const hex1 = generateSecureHex(16);
      const hex2 = generateSecureHex(16);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('generateSecureNumber', () => {
    it('should generate numbers within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const num = generateSecureNumber(10, 20);
        expect(num).toBeGreaterThanOrEqual(10);
        expect(num).toBeLessThanOrEqual(20);
      }
    });

    it('should handle min = max', () => {
      const num = generateSecureNumber(5, 5);
      expect(num).toBe(5);
    });

    it('should throw error if min > max', () => {
      expect(() => generateSecureNumber(10, 5)).toThrow();
    });

    it('should generate different numbers over time', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateSecureNumber(0, 1000000));
      }
      expect(numbers.size).toBeGreaterThan(90);
    });
  });
});
