import { describe, it, expect } from 'vitest';
import { adToBs, bsToAd, formatAdDate, parseAdDate } from './nepaliDate';

describe('nepaliDate utility', () => {
  it('converts AD to BS correctly (reference date)', () => {
    // 2013-04-14 AD is 2070-01-01 BS
    expect(adToBs('2013-04-14')).toBe('2070/01/01');
  });

  it('converts AD to BS correctly (current date)', () => {
    // 2024-04-13 AD is 2080-12-31 BS
    expect(adToBs('2024-04-13')).toBe('2080/12/31');
  });

  it('converts BS to AD correctly', () => {
    expect(bsToAd('2080/12/31')).toBe('2024-04-13');
  });

  it('formats AD date correctly', () => {
    expect(formatAdDate('2024-04-13')).toBe('13/04/2024');
  });

  it('parses AD date correctly', () => {
    expect(parseAdDate('13/04/2024')).toBe('2024-04-13');
  });
});
