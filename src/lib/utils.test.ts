import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSecureHex, generateSecureRandomNumber } from './utils';

describe('Security Utilities', () => {
  beforeEach(() => {
    // Mock window.crypto
    const cryptoMock = {
      getRandomValues: vi.fn((buffer) => {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * (buffer instanceof Uint8Array ? 256 : 4294967296));
        }
        return buffer;
      }),
    };
    vi.stubGlobal('window', { crypto: cryptoMock });
  });

  describe('generateSecureHex', () => {
    it('should generate a hex string of the correct length', () => {
      const length = 12;
      const result = generateSecureHex(length);
      expect(result).toHaveLength(length * 2);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different strings on subsequent calls', () => {
      const s1 = generateSecureHex(8);
      const s2 = generateSecureHex(8);
      expect(s1).not.toBe(s2);
    });
  });

  describe('generateSecureRandomNumber', () => {
    it('should generate a number within the specified range', () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 100; i++) {
        const result = generateSecureRandomNumber(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }
    });

    it('should handle a range of 0', () => {
      const val = 5;
      expect(generateSecureRandomNumber(val, val)).toBe(val);
    });

    it('should return min if range is negative', () => {
      expect(generateSecureRandomNumber(20, 10)).toBe(20);
    });
  });
});
