
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

// Data for number of days in each month of BS years from 2000 to 2100
// Each array represents a year, starting from month 1 (Baisakh) to 12 (Chaitra)
const nepaliMonthDays: Record<number, number[]> = {
  2000: [30, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2006: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 30],
  2008: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2009: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2010: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2011: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2012: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2013: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2014: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2015: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2016: [31, 31, 32, 31, 32, 31, 30, 29, 30, 29, 30, 30],
  2017: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2019: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 32, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2027: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2028: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2029: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2030: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2031: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2032: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2033: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2034: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2035: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2036: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2043: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2044: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2045: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2046: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2047: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2048: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2049: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2050: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2051: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2054: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2058: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2059: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2060: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2061: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2062: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2063: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2064: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2065: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2066: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2067: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2068: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2069: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2070: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2071: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2078: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2079: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2080: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2083: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2084: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2085: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2086: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2088: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2089: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2091: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2092: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2093: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2094: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2095: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2096: [31, 31, 32, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2097: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2098: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2099: [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 31],
  2100: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
};

const referenceAD = new Date(1943, 3, 14); // April 14, 1943 (Months are 0-indexed in JS)
const referenceBS: NepaliDate = { year: 2000, month: 1, day: 1 };

/**
 * Converts AD Date to BS Date
 */
export function adToBs(adDate: Date): NepaliDate {
  const diffTime = adDate.getTime() - referenceAD.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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

  // Handle negative difference if date is before reference
  if (diffDays < 0) {
    // This part is simplified, assuming we don't go before 2000 BS
    return referenceBS;
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

  const adDate = new Date(referenceAD);
  adDate.setDate(adDate.getDate() + totalDays);
  return adDate;
}

/**
 * Formats BS date to YYYY-MM-DD
 */
export function formatBsDate(date: NepaliDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

/**
 * Parses BS date from YYYY-MM-DD string
 */
export function parseBsDate(dateStr: string): NepaliDate | null {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return { year: parts[0], month: parts[1], day: parts[2] };
}

/**
 * Gets Fiscal Year from AD Date (Starts mid-July / approx. BS Shrawan 1)
 */
export function getFiscalYear(adDate: Date): string {
  const bsDate = adToBs(adDate);
  // Nepali FY starts in Shrawan (4th month)
  if (bsDate.month >= 4) {
    const nextYear = (bsDate.year + 1).toString().slice(-2);
    return `${bsDate.year}/${nextYear}`;
  } else {
    const currentYearShort = bsDate.year.toString().slice(-2);
    return `${bsDate.year - 1}/${currentYearShort}`;
  }
}

/**
 * Gets start and end AD dates for a given BS Fiscal Year (e.g., "80/81")
 */
export function getFiscalYearRange(fy: string): { start: Date; end: Date } {
  // Assume FY format "YY/YY" or "YYYY/YY"
  const parts = fy.split("/");
  let startYearBS = parseInt(parts[0]);
  if (startYearBS < 100) startYearBS += 2000; // Handle "80/81"

  const startDate = bsToAd(startYearBS, 4, 1); // Shrawan 1
  const endDate = bsToAd(startYearBS + 1, 3, nepaliMonthDays[startYearBS + 1][2]); // Chaitra end

  return { start: startDate, end: endDate };
}

/**
 * Returns names of months in Bikram Sambat
 */
export const BS_MONTH_NAMES = [
  "Baisakh", "Jestha", "Ashad", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

/**
 * Returns names of days in Bikram Sambat
 */
export const BS_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Gets number of days in a specific BS month
 */
export function getDaysInBsMonth(year: number, month: number): number {
  return nepaliMonthDays[year]?.[month - 1] || 30;
}
