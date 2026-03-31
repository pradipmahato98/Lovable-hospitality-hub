import { describe, it, expect, vi } from 'vitest';
import { generateSecureRandomNumber, generateSecureHex } from './utils';

describe('Security Utilities', () => {
  describe('generateSecureRandomNumber', () => {
    it('should generate numbers within the specified range [min, max]', () => {
      for (let i = 0; i < 100; i++) {
        const val = generateSecureRandomNumber(1, 10);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(10);
      }
    });

    it('should return min if range is <= 0', () => {
      expect(generateSecureRandomNumber(10, 5)).toBe(10);
      expect(generateSecureRandomNumber(5, 5)).toBe(5);
    });

    it('should use window.crypto.getRandomValues', () => {
      const spy = vi.spyOn(window.crypto, 'getRandomValues');
      generateSecureRandomNumber(1, 100);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('generateSecureHex', () => {
    it('should generate a hex string of correct length', () => {
      expect(generateSecureHex(12)).toHaveLength(24);
      expect(generateSecureHex(4)).toHaveLength(8);
    });

    it('should only contain valid hex characters', () => {
      const hex = generateSecureHex(32);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    it('should use window.crypto.getRandomValues', () => {
      const spy = vi.spyOn(window.crypto, 'getRandomValues');
      generateSecureHex(12);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
