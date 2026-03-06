import nepaliCalendarData from './nepaliCalendarData.json';

/**
 * Nepali Date Utility (AD to BS and BS to AD)
 * Reference: BS 2000-01-01 is equivalent to AD 1943-04-14
 * Supported Range: BS 2000 to 2100
 */

interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

const nepaliMonthDays: Record<number, number[]> = nepaliCalendarData as any;

const referenceAD = new Date(1943, 3, 14); // April 14, 1943
const referenceBS: NepaliDate = { year: 2000, month: 1, day: 1 };

/**
 * Converts AD Date to BS Date
 */
export function adToBs(adDate: Date): NepaliDate {
  // Use UTC to avoid timezone issues when calculating differences
  const adYear = adDate.getFullYear();
  const adMonth = adDate.getMonth() + 1;
  const adDay = adDate.getDate();

  const date1 = Date.UTC(1943, 3, 14);
  const date2 = Date.UTC(adYear, adMonth - 1, adDay);

  let diffDays = Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return referenceBS;

  let bsYear = referenceBS.year;
  let bsMonth = referenceBS.month;
  let bsDay = referenceBS.day;

  while (diffDays > 0) {
    const daysInMonth = nepaliMonthDays[bsYear][bsMonth - 1];
    if (diffDays >= daysInMonth) {
      diffDays -= daysInMonth;
      bsMonth++;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    } else {
      bsDay += diffDays;
      diffDays = 0;
    }
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Converts BS Date to AD Date
 */
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  let totalDays = 0;

  // Add days for years
  for (let y = referenceBS.year; y < bsYear; y++) {
    for (let m = 0; m < 12; m++) {
      totalDays += nepaliMonthDays[y][m];
    }
  }

  // Add days for months in current year
  for (let m = 0; m < bsMonth - 1; m++) {
    totalDays += nepaliMonthDays[bsYear][m];
  }

  // Add days for current month
  totalDays += bsDay - 1;

  const adDate = new Date(1943, 3, 14);
  adDate.setDate(adDate.getDate() + totalDays);
  return adDate;
}

/**
 * Formats BS date to YYYY/MM/DD with dynamic separator
 */
export function formatBsDate(date: NepaliDate, separator: string = "/"): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}${separator}${month}${separator}${day}`;
}

/**
 * Parses BS date from YYYY/MM/DD or YYYY-MM-DD string
 */
export function parseBsDate(dateStr: string): NepaliDate | null {
  const parts = dateStr.split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  const maxDays = getDaysInBsMonth(year, month);
  if (day < 1 || day > maxDays) return null;
  return { year, month, day };
}

/**
 * Formats AD date to DD/MM/YYYY with dynamic separator
 */
export function formatAdDate(date: Date, separator: string = "/"): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${separator}${month}${separator}${year}`;
}

/**
 * Parses AD date from DD/MM/YYYY or DD-MM-YYYY string
 */
export function parseAdDate(dateStr: string): Date | null {
  const parts = dateStr.split(/[-/]/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [day, month, year] = parts;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/**
 * Gets Fiscal Year from AD Date
 */
export function getFiscalYear(adDate: Date): string {
  const bsDate = adToBs(adDate);
  if (bsDate.month >= 4) {
    const nextYear = (bsDate.year + 1).toString().slice(-2);
    return `${bsDate.year}/${nextYear}`;
  } else {
    const currentYearShort = bsDate.year.toString().slice(-2);
    return `${bsDate.year - 1}/${currentYearShort}`;
  }
}

/**
 * Gets start and end AD dates for a given BS Fiscal Year
 */
export function getFiscalYearRange(fy: string): { start: Date; end: Date } {
  const parts = fy.split("/");
  let startYearBS = parseInt(parts[0]);
  if (startYearBS < 100) startYearBS += 2000;

  const startDate = bsToAd(startYearBS, 4, 1);
  let endDate = bsToAd(startYearBS + 1, 3, getDaysInBsMonth(startYearBS + 1, 3));

  const today = new Date();
  if (endDate > today) {
    endDate = today;
  }

  return { start: startDate, end: endDate };
}

export const BS_MONTH_NAMES = [
  "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export const BS_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getDaysInBsMonth(year: number, month: number): number {
  return nepaliMonthDays[year]?.[month - 1] || 30;
}
