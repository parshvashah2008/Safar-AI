/**
 * SAFAR AI Unified 12-Hour Clock & Synchronization Utility
 * Enforces strict 12-hour clock formatting (hh:mm AM/PM) across all components,
 * with chronological sorting, timestamp normalization, and zero 24-hr leakage.
 */

/**
 * Formats any input (Date, ISO string, 24-hour "HH:mm", or mixed string) into clean 12-hour format:
 * e.g. "09:30 AM", "02:15 PM", "12:00 AM", "11:45 PM (+1d)"
 */
export function formatTo12Hour(input: Date | string | number | null | undefined): string {
  if (!input) return '--:-- --';

  // If input is already a Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return '--:-- --';
    return input.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  const str = String(input).trim();

  // Check for next-day indicator (+1d, +2d)
  const nextDayMatch = str.match(/\(\+\d+d\)/i);
  const nextDaySuffix = nextDayMatch ? ` ${nextDayMatch[0]}` : '';
  const cleanStr = str.replace(/\(\+\d+d\)/i, '').trim();

  // If already standard 12-hour (e.g. "09:30 AM", "2:15 pm", "10:00am")
  const standard12Regex = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i;
  const match12 = cleanStr.match(standard12Regex);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2].padStart(2, '0');
    const meridian = match12[3].toUpperCase();
    if (hours > 12) hours = hours % 12 || 12; // sanitize if someone wrote 14:00 PM
    const hoursStr = String(hours).padStart(2, '0');
    return `${hoursStr}:${minutes} ${meridian}${nextDaySuffix}`;
  }

  // If pure 24-hour time string (e.g. "14:30", "09:15", "23:59:00", "0:00")
  const standard24Regex = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const match24 = cleanStr.match(standard24Regex);
  if (match24) {
    const rawHours = parseInt(match24[1], 10);
    const minutes = match24[2].padStart(2, '0');
    const meridian = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 || 12;
    const hoursStr = String(hours12).padStart(2, '0');
    return `${hoursStr}:${minutes} ${meridian}${nextDaySuffix}`;
  }

  // If ISO 8601 string or date parseable string (e.g. "2026-10-31T14:30:00Z")
  const parsedDate = new Date(cleanStr);
  if (!isNaN(parsedDate.getTime()) && (cleanStr.includes('T') || cleanStr.includes('-'))) {
    return (
      parsedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + nextDaySuffix
    );
  }

  // Fallback: return as-is
  return str;
}

/**
 * Returns current timestamp in synchronized 12-hour format
 * e.g. "12:15 PM"
 */
export function getCurrent12HourTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns full current date & time in 12-hour format
 * e.g. "Oct 31, 2026, 12:15 PM"
 */
export function getCurrent12HourDateTime(): string {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Converts any time string (12-hour or 24-hour) into minutes from midnight (0..1439).
 * Crucial for sorting itinerary activities chronologically rather than alphabetically!
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();

  // Check 12-hour format
  const m12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (m12) {
    let hours = parseInt(m12[1], 10);
    const minutes = parseInt(m12[2], 10);
    const meridian = m12[3].toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check 24-hour format
  const m24 = clean.match(/^(\d{1,2}):(\d{2})/);
  if (m24) {
    const hours = parseInt(m24[1], 10);
    const minutes = parseInt(m24[2], 10);
    return hours * 60 + minutes;
  }

  return 0;
}
