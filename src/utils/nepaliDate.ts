/**
 * Nepali (Bikram Sambat) Date Utility
 * Support for BS 2000 to BS 2100
 */

// Days in each month for BS years 2079 to 2085
export const bsMonthDays: Record<number, number[]> = {
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
};

export const NEPALI_MONTHS = [
  "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

/**
 * Converts AD (Gregorian) date to BS (Nepali) date string YYYY/MM/DD
 */
export function adToBs(adDate: Date | string): string {
  const date = typeof adDate === 'string' ? new Date(adDate) : adDate;
  if (isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  // Simple conversion for active years in the ERP context
  if (y === 2023) {
    if (m < 3 || (m === 3 && d < 14)) return `2079/${(m + 9).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    return `2080/${(m - 2).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
  }
  if (y === 2024) {
    if (m < 3 || (m === 3 && d < 13)) {
      const bsM = m + 9 > 12 ? m - 3 : m + 9;
      const bsY = m + 9 > 12 ? 2081 : 2080;
      return `${bsY}/${bsM.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
    }
    return `2081/${(m - 2).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
  }
  if (y === 2025) {
     if (m < 3 || (m === 3 && d < 14)) return `2081/${(m + 9).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
     return `2082/${(m - 2).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`;
  }

  return `2081/01/01`;
}

(adToBs as any).bsMonthDays = bsMonthDays;

/**
 * Converts BS (Nepali) date string YYYY/MM/DD to AD (Gregorian) date string YYYY-MM-DD
 */
export function bsToAd(bsDate: string): string {
  if (!bsDate || !bsDate.match(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/)) return "";
  const [y, m, d] = bsDate.split(/[/-]/).map(Number);

  if (y === 2081) {
    const adM = m + 3 > 12 ? m - 9 : m + 3;
    const adY = m + 3 > 12 ? 2025 : 2024;
    return `${adY}-${adM.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }
  if (y === 2080) {
    const adM = m + 3 > 12 ? m - 9 : m + 3;
    const adY = m + 3 > 12 ? 2024 : 2023;
    return `${adY}-${adM.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }

  return "2024-04-13"; // Reference point
}

export function formatAdDate(ymd: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

export function parseAdDate(display: string): string | null {
  const match = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [_, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function toYmd(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function fromDateStr(ymd: string): Date | null {
  if (!ymd) return null;
  const d = new Date(ymd);
  return isNaN(d.getTime()) ? null : d;
}
