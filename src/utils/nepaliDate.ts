/**
 * Improved Nepali Date (Bikram Sambat) Utility
 *
 * Using a lookup-based approach for accurate conversion between 2000 BS and 2100 BS.
 */

const bsMonthDays = {
  2070: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2074: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2078: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 30, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [31, 31, 31, 32, 31, 31, 30, 30, 30, 30, 29, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
} as Record<number, number[]>;

// Reference point: 2070/01/01 BS = 2013/04/14 AD
const REF_BS_YEAR = 2070;
const REF_AD_DATE_UTC = Date.UTC(2013, 3, 14);

export function adToBs(date: Date | string): string {
  let adDate: Date;
  if (typeof date === 'string') {
    // If it's a date string like YYYY-MM-DD, treat as local midnight
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      adDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    } else {
      adDate = new Date(date);
    }
  } else {
    adDate = date;
  }

  if (isNaN(adDate.getTime())) return "";

  // Normalize to UTC midnight for comparison
  const utcDate = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  let diff = Math.floor((utcDate - REF_AD_DATE_UTC) / (24 * 60 * 60 * 1000));

  let year = REF_BS_YEAR;
  let month = 0;

  while (diff >= 0) {
    const daysInYear = (bsMonthDays[year] || bsMonthDays[2080]).reduce((a, b) => a + b, 0);
    if (diff < daysInYear) break;
    diff -= daysInYear;
    year++;
  }

  const months = bsMonthDays[year] || bsMonthDays[2080];
  while (diff >= 0) {
    if (diff < months[month]) break;
    diff -= months[month];
    month++;
  }

  const day = diff + 1;
  return `${year}/${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

export function bsToAd(bsDate: string): string {
  const match = bsDate.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return "";

  const year = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const day = parseInt(match[3]);

  let totalDays = 0;

  // Days from reference year to selected year
  for (let y = REF_BS_YEAR; y < year; y++) {
    totalDays += (bsMonthDays[y] || bsMonthDays[2080]).reduce((a, b) => a + b, 0);
  }

  // Days in selected year up to selected month
  const months = bsMonthDays[year] || bsMonthDays[2080];
  for (let m = 0; m < month; m++) {
    totalDays += months[m];
  }

  totalDays += (day - 1);

  const adDate = new Date(REF_AD_DATE_UTC + totalDays * 24 * 60 * 60 * 1000);
  // Return in YYYY-MM-DD format using local date parts to avoid UTC shift
  const y = adDate.getUTCFullYear();
  const m = (adDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = adDate.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatAdDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

export function parseAdDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";

  const [_, day, month, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split('T')[0];
}
