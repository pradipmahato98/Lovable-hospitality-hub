import { describe, it, expect } from 'vitest';
import { adToBs, bsToAd, formatAdDate, parseAdDate } from './nepaliDate';

describe('nepaliDate utility', () => {
  it('converts AD to BS correctly (reference date)', () => {
    // 1943-04-14 AD is 2000-01-01 BS
    expect(adToBs('1943-04-14')).toBe('2000/01/01');
  });

  it('converts AD to BS correctly (recent date)', () => {
    // 2013-04-14 AD is 2070-01-01 BS
    expect(adToBs('2013-04-14')).toBe('2070/01/01');
  });

  it('converts AD to BS correctly (current date)', () => {
    // 2024-04-13 AD is 2081-01-01 BS (New Year)
    expect(adToBs('2024-04-13')).toBe('2081/01/01');
  });

  it('converts BS to AD correctly', () => {
    expect(bsToAd('2081/01/01')).toBe('2024-04-13');
  });

  it('converts end of month correctly', () => {
    // 2081 Baisakh has 31 days. 2081-01-31 BS should be 2024-05-13 AD
    expect(bsToAd('2081/01/31')).toBe('2024-05-13');
    expect(adToBs('2024-05-13')).toBe('2081/01/31');
  });

  it('converts Leap Year month ends correctly (AD side)', () => {
    // 2024 is a leap year. Feb 29, 2024
    const bs = adToBs('2024-02-29');
    expect(bs).toBe('2080/11/17');
    expect(bsToAd('2080/11/17')).toBe('2024-02-29');
  });

  it('formats AD date correctly', () => {
    expect(formatAdDate('2024-04-13')).toBe('13/04/2024');
  });

  it('parses AD date correctly', () => {
    expect(parseAdDate('13/04/2024')).toBe('2024-04-13');
  });
});
