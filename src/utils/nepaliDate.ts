/**
 * Simple Nepali Date (Bikram Sambat) Utility
 *
 * Note: This is a simplified implementation for the UI redesign.
 * In a production environment, a comprehensive library like 'nepali-date-converter'
 * or a full lookup table should be used for 100% accuracy across all years.
 */

// Offset between AD and BS (approximate)
// BS = AD + 56 years, 8 months, 17 days (varies)
const AD_BS_OFFSET_YEARS = 56;
const AD_BS_OFFSET_MONTHS = 8;
const AD_BS_OFFSET_DAYS = 17;

export function adToBs(date: Date | string): string {
  const adDate = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(adDate.getTime())) return "";

  // Simplified conversion for demonstration
  // Real BS conversion requires a lookup table for month lengths
  let year = adDate.getFullYear() + AD_BS_OFFSET_YEARS;
  let month = adDate.getMonth() + 1 + AD_BS_OFFSET_MONTHS;
  let day = adDate.getDate() + AD_BS_OFFSET_DAYS;

  if (day > 30) {
    day -= 30;
    month += 1;
  }
  if (month > 12) {
    month -= 12;
    year += 1;
  }

  return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

export function bsToAd(bsDate: string): string {
  // Regex to match YYYY/MM/DD or YYYY-MM-DD
  const match = bsDate.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return "";

  let year = parseInt(match[1]) - AD_BS_OFFSET_YEARS;
  let month = parseInt(match[2]) - 1 - AD_BS_OFFSET_MONTHS;
  let day = parseInt(match[3]) - AD_BS_OFFSET_DAYS;

  const adDate = new Date(year, month, day);
  if (isNaN(adDate.getTime())) return "";

  return adDate.toISOString().split('T')[0];
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
