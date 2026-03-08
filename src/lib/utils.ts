import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as fnsFormat } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Standard AD date format: dd/MM/yyyy */
export const AD_DATE_FORMAT = "dd/MM/yyyy";

/** Standard AD datetime format: dd/MM/yyyy HH:mm */
export const AD_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

/** Standard AD datetime with seconds: dd/MM/yyyy HH:mm:ss */
export const AD_DATETIME_SEC_FORMAT = "dd/MM/yyyy HH:mm:ss";

/** Format a date in standard AD format (dd/MM/yyyy) */
export function formatAD(date: Date | string, withTime?: "time" | "seconds"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (withTime === "seconds") return fnsFormat(d, AD_DATETIME_SEC_FORMAT);
  if (withTime === "time") return fnsFormat(d, AD_DATETIME_FORMAT);
  return fnsFormat(d, AD_DATE_FORMAT);
}
