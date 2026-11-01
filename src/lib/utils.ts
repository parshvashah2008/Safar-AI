import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
  locale: string = 'en-IN'
): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat(locale, options).format(
      new Date(`${dateStr}T12:00:00`)
    );
  } catch {
    return dateStr;
  }
}

export function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1);
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (d <= last) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export { formatTo12Hour, getCurrent12HourTime, getCurrent12HourDateTime, parseTimeToMinutes } from '@/lib/utils/time-format';
