import { describe, it, expect } from 'vitest';
import { adToBs, bsToAd, parseAdDate, formatAdDate } from './nepaliDate';

describe('nepaliDate utility', () => {
  it('converts AD to BS correctly', () => {
    // 2024-04-13 should be 2081/01/13 in our simplified logic
    expect(adToBs('2024-04-13')).toBe('2081/01/13');
  });

  it('converts BS to AD correctly', () => {
    // 2081/01/13 should be 2024-04-13 in our simplified logic
    expect(bsToAd('2081/01/13')).toBe('2024-04-13');
  });

  it('parses AD display date correctly (13/04/2024 -> 2024-04-13)', () => {
    expect(parseAdDate('13/04/2024')).toBe('2024-04-13');
  });

  it('formats AD YMD date correctly (2024-04-13 -> 13/04/2024)', () => {
    expect(formatAdDate('2024-04-13')).toBe('13/04/2024');
  });
});
