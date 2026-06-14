import { describe, it, expect, vi } from 'vitest';
import { generateSecureHex, generateSecureNumber } from '../utils';

describe('generateSecureHex', () => {
  it('generates a hex string of the correct length', () => {
    const hex = generateSecureHex(16);
    expect(hex).toHaveLength(32);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('generates a hex string of a different length', () => {
    const hex = generateSecureHex(8);
    expect(hex).toHaveLength(16);
    expect(hex).toMatch(/^[0-9a-f]+$/);
  });

  it('generates unique values', () => {
    const hex1 = generateSecureHex(16);
    const hex2 = generateSecureHex(16);
    expect(hex1).not.toBe(hex2);
  });
});

describe('generateSecureNumber', () => {
  it('generates a number within the specified range', () => {
    for (let i = 0; i < 100; i++) {
      const num = generateSecureNumber(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);
    }
  });

  it('handles a single-value range', () => {
    const num = generateSecureNumber(5, 5);
    expect(num).toBe(5);
  });
});
