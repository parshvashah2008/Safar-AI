/**
 * SAFAR AI Trip Export Suite
 * Provides publication-grade export, RFC 5545 iCalendar (.ics) generation,
 * WhatsApp/Email sharing summary, and offline passbook archiving.
 */

import { formatMoney, formatDate } from '@/lib/utils';
import type { Trip, ItineraryDay, ItineraryStop } from '@/types';

/**
 * Format a Date object or ISO string into iCalendar date-time string (UTC): YYYYMMDDTHHMMSSZ
 */
function toIcsDateTime(dateStr: string, timeStr?: string | null): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  let hours = 10;
  let minutes = 0;

  if (timeStr) {
    // Parse formats like "10:00 AM", "2:30 PM", "14:30", "10:00"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;

      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      hours = h;
      minutes = m;
    }
  }

  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Add minutes to an iCalendar date-time string
 */
function addMinutesToIcs(icsDateStr: string, minutesToAdd: number): string {
  // icsDateStr: YYYYMMDDTHHMMSSZ
  const year = parseInt(icsDateStr.slice(0, 4), 10);
  const month = parseInt(icsDateStr.slice(4, 6), 10) - 1;
  const day = parseInt(icsDateStr.slice(6, 8), 10);
  const hour = parseInt(icsDateStr.slice(9, 11), 10);
  const min = parseInt(icsDateStr.slice(11, 13), 10);
  const sec = parseInt(icsDateStr.slice(13, 15), 10);

  const d = new Date(Date.UTC(year, month, day, hour, min, sec));
  d.setUTCMinutes(d.getUTCMinutes() + (minutesToAdd || 60));
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Sanitize text for iCalendar format (escape commas, semicolons, backslashes)
 */
function escapeIcsText(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate RFC 5545 compliant iCalendar string
 */
export function generateIcsCalendar(
  trip: Trip,
  days: ItineraryDay[],
  stops: ItineraryStop[]
): string {
  const nowIcs = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const calendarName = `SAFAR AI - Journey to ${trip.destination}`;

  const dayMap = new Map<string, ItineraryDay>();
  days.forEach((d) => dayMap.set(d.id, d));

  let eventsIcs = '';

  stops.forEach((stop, index) => {
    const parentDay = dayMap.get(stop.day_id) || days[0];
    const eventDate = parentDay?.date || trip.start_date;
    const startIcs = toIcsDateTime(eventDate, stop.time);
    const endIcs = addMinutesToIcs(startIcs, stop.duration_minutes || 90);
    const uid = `safar-${stop.id || index}-${nowIcs}@safar.ai`;

    const categoryLabel = stop.category ? stop.category.toUpperCase() : 'ACTIVITY';
    const costText = stop.estimated_cost ? ` • Est: ${formatMoney(stop.estimated_cost, trip.currency)}` : '';
    const description = `${stop.description || ''}\\n\\n[Category: ${categoryLabel}${costText}]\\nCurated by SAFAR AI`;
    const location = stop.place_id || `${trip.destination}, ${trip.country}`;

    eventsIcs += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${nowIcs}
DTSTART:${startIcs}
DTEND:${endIcs}
SUMMARY:[Safar AI] ${escapeIcsText(stop.title)}
DESCRIPTION:${escapeIcsText(description)}
LOCATION:${escapeIcsText(location)}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeIcsText(stop.title)} in 1 hour
END:VALARM
END:VEVENT
`;
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Safar AI//Personal Travel Assistant//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeIcsText(calendarName)}
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Curated travel itinerary for ${escapeIcsText(trip.destination)} engineered with SAFAR AI.
${eventsIcs}END:VCALENDAR`;
}

/**
 * Trigger download of the .ics file directly in browser
 */
export function downloadIcsFile(
  trip: Trip,
  days: ItineraryDay[],
  stops: ItineraryStop[]
): void {
  if (typeof window === 'undefined') return;

  const icsData = generateIcsCalendar(trip, days, stops);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanDest = trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.setAttribute('download', `safar-${cleanDest}-itinerary.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format a WhatsApp and Email friendly Markdown itinerary summary
 */
export function generateShareSummary(
  trip: Trip,
  days: ItineraryDay[],
  stops: ItineraryStop[],
  transitSummary?: string | null
): string {
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number);
  const stopsByDay = new Map<string, ItineraryStop[]>();

  stops.forEach((s) => {
    const list = stopsByDay.get(s.day_id) || [];
    list.push(s);
    stopsByDay.set(s.day_id, list);
  });

  let text = `✈️ *SAFAR AI JOURNEY DOSSIER: ${trip.destination.toUpperCase()}*\n`;
  text += `📅 *Dates:* ${formatDate(trip.start_date)} to ${formatDate(trip.end_date)} (${days.length || 1} Days)\n`;
  text += `👥 *Travelers:* ${trip.travelers} pax\n`;
  text += `💰 *Planned Budget:* ${formatMoney(trip.budget, trip.currency)}\n`;

  if (transitSummary) {
    text += `\n🚆 *Transit Corridor:* ${transitSummary}\n`;
  }

  text += `\n──────────────────────────────\n*DAILY ITINERARY:*\n`;

  sortedDays.forEach((day) => {
    text += `\n📍 *Day ${day.day_number}: ${day.title || `Exploring ${trip.destination}`}* (${formatDate(day.date)})\n`;
    const dayStops = stopsByDay.get(day.id) || [];
    if (dayStops.length === 0) {
      text += `  • Free discovery, local markets & relaxed evening walk\n`;
    } else {
      dayStops.forEach((st) => {
        text += `  • *${st.time || '10:00 AM'}* — ${st.title}`;
        if (st.estimated_cost) text += ` (${formatMoney(st.estimated_cost, trip.currency)})`;
        text += `\n`;
        if (st.description) text += `    _${st.description.slice(0, 120)}..._\n`;
      });
    }
  });

  text += `\n──────────────────────────────\n`;
  text += `✨ Engineered with Safar AI · Your world. Your budget. Your journey.\n`;
  text += `🔗 View live at: https://parshvashah2008.github.io/Safar-AI/trips?id=${trip.id}\n`;

  return text;
}

/**
 * Download a standalone offline travel passbook (.json)
 */
export function downloadOfflineDossierJson(
  trip: Trip,
  days: ItineraryDay[],
  stops: ItineraryStop[],
  transitNotes?: any
): void {
  if (typeof window === 'undefined') return;

  const bundle = {
    app: 'SAFAR AI Travel Platform',
    version: '2.0-offline',
    exportedAt: new Date().toISOString(),
    trip,
    days,
    stops,
    transitNotes: transitNotes || null,
  };

  const jsonStr = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanDest = trip.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.setAttribute('download', `safar-${cleanDest}-offline-passbook.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
