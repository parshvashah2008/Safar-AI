import { generateId, daysBetween, dateRange } from '@/lib/utils';
import { formatTo12Hour } from '@/lib/utils/time-format';
import type { Trip, ItineraryDay, ItineraryStop, AIItineraryDay } from '@/types';

const STORAGE_KEY_TRIPS = 'safar_trips_v1';
const STORAGE_KEY_DAYS = 'safar_days_v1';
const STORAGE_KEY_STOPS = 'safar_stops_v1';
const STORAGE_KEY_INITIALIZED = 'safar_trips_initialized_v2';

// In-memory cache
const memoryTrips = new Map<string, Trip>();
const memoryDays = new Map<string, ItineraryDay[]>();
const memoryStops = new Map<string, ItineraryStop[]>();

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

function persistAll() {
  const storage = getStorage();
  if (!storage) return;
  try {
    const tripsArr = Array.from(memoryTrips.values());
    const daysObj: Record<string, ItineraryDay[]> = {};
    const stopsObj: Record<string, ItineraryStop[]> = {};

    memoryDays.forEach((v, k) => { daysObj[k] = v; });
    memoryStops.forEach((v, k) => { stopsObj[k] = v; });

    storage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(tripsArr));
    storage.setItem(STORAGE_KEY_DAYS, JSON.stringify(daysObj));
    storage.setItem(STORAGE_KEY_STOPS, JSON.stringify(stopsObj));
  } catch (err) {
    console.warn('Failed to persist to localStorage:', err);
  }
}

function syncFromStorage() {
  const storage = getStorage();
  if (!storage) return;
  try {
    const tripsRaw = storage.getItem(STORAGE_KEY_TRIPS);
    if (tripsRaw) {
      const tripsArr: Trip[] = JSON.parse(tripsRaw);
      if (Array.isArray(tripsArr)) {
        tripsArr.forEach((t) => memoryTrips.set(t.id, t));
      }
    }

    const daysRaw = storage.getItem(STORAGE_KEY_DAYS);
    if (daysRaw) {
      const daysObj: Record<string, ItineraryDay[]> = JSON.parse(daysRaw);
      Object.entries(daysObj).forEach(([k, v]) => memoryDays.set(k, v));
    }

    const stopsRaw = storage.getItem(STORAGE_KEY_STOPS);
    if (stopsRaw) {
      const stopsObj: Record<string, ItineraryStop[]> = JSON.parse(stopsRaw);
      Object.entries(stopsObj).forEach(([k, v]) => memoryStops.set(k, v));
    }
  } catch (err) {
    console.warn('Failed to read from localStorage:', err);
  }
}

function initializeDemoData() {
  syncFromStorage();
  // Cleanse any old legacy dummy IDs if they were stored previously
  const legacyIds = ['demo-jaipur-2026', 'demo-bali-2026', 'demo-kyoto-2026'];
  let cleansed = false;
  for (const id of legacyIds) {
    if (memoryTrips.has(id)) {
      memoryTrips.delete(id);
      memoryDays.delete(id);
      memoryStops.delete(id);
      cleansed = true;
    }
  }
  if (cleansed) {
    persistAll();
  }
}

export function createLocalStarterItinerary(
  tripId: string,
  destination: string,
  startDate: string,
  endDate: string,
  interests: string[]
): { days: ItineraryDay[]; stops: ItineraryStop[] } {
  const dates = dateRange(startDate, endDate);

  const days: ItineraryDay[] = dates.map((date, index) => ({
    id: generateId(),
    trip_id: tripId,
    date,
    day_number: index + 1,
    title: index === 0 ? `Arrival in ${destination}` : `Day ${index + 1} in ${destination}`,
    notes: null,
  }));

  // No fake or canned dummy stops. Real stops are generated on-demand by live Gemini/Groq LLMs.
  const stops: ItineraryStop[] = [];

  return { days, stops };
}

export async function getTrips(userId?: string): Promise<Trip[]> {
  initializeDemoData();
  syncFromStorage();
  const all = Array.from(memoryTrips.values());
  // Sort descending by created_at so the latest trip always comes first!
  all.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  if (!userId) return all;
  return all.filter((t) => t.user_id === userId);
}

export async function getTripById(tripId: string): Promise<Trip | null> {
  initializeDemoData();
  syncFromStorage();

  let found: Trip | null = null;
  if (memoryTrips.has(tripId)) {
    found = memoryTrips.get(tripId)!;
  } else {
    // Direct check in localStorage if memory misses
    const storage = getStorage();
    if (storage) {
      try {
        const tripsRaw = storage.getItem(STORAGE_KEY_TRIPS);
        if (tripsRaw) {
          const tripsArr: Trip[] = JSON.parse(tripsRaw);
          const match = tripsArr.find((t) => t.id === tripId);
          if (match) {
            memoryTrips.set(match.id, match);
            found = match;
          }
        }
      } catch {}
    }
  }

  if (found && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('safar_last_active_trip_id', found.id);
    } catch {}
  }

  return found;
}

export async function createTrip(
  data: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'user_id'> & { user_id?: string },
  initialAIDays?: AIItineraryDay[]
): Promise<Trip> {
  initializeDemoData();
  syncFromStorage();

  const id = generateId();
  const now = new Date().toISOString();
  const trip: Trip = {
    user_id: 'usr_me',
    ...data,
    id,
    created_at: now,
    updated_at: now,
  };

  memoryTrips.set(id, trip);

  if (initialAIDays && initialAIDays.length > 0) {
    await applyAIItinerary(id, initialAIDays, trip.currency);
  } else {
    const { days, stops } = createLocalStarterItinerary(id, trip.destination, trip.start_date, trip.end_date, trip.interests);
    memoryDays.set(id, days);
    memoryStops.set(id, stops);
  }

  persistAll();

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem('safar_last_active_trip_id', trip.id);
    } catch {}
  }

  return trip;
}

export async function applyAIItinerary(
  tripId: string,
  aiDays: AIItineraryDay[],
  currency: string = 'INR'
): Promise<{ days: ItineraryDay[]; stops: ItineraryStop[] }> {
  // NOTE: Do not clear memoryTrips here!
  const days: ItineraryDay[] = [];
  const stops: ItineraryStop[] = [];

  aiDays.forEach((aiDay, dayIndex) => {
    const dayId = generateId();
    days.push({
      id: dayId,
      trip_id: tripId,
      date: aiDay.date,
      day_number: dayIndex + 1,
      title: aiDay.title || `Day ${dayIndex + 1}`,
      notes: null,
    });

    if (Array.isArray(aiDay.activities)) {
      aiDay.activities.forEach((act, actIndex) => {
        stops.push({
          id: generateId(),
          day_id: dayId,
          trip_id: tripId,
          time: formatTo12Hour(act.time || '10:00 AM'),
          title: act.title,
          description: act.description || null,
          place_id: act.place_name || null,
          latitude: act.latitude ?? null,
          longitude: act.longitude ?? null,
          duration_minutes: act.duration_minutes ?? 60,
          estimated_cost: act.estimated_cost ?? null,
          currency: currency as any,
          category: act.category,
          is_optional: Boolean(act.is_optional),
          is_completed: false,
          booking_ref: null,
          sort_order: actIndex + 1,
        });
      });
    }
  });

  memoryDays.set(tripId, days);
  memoryStops.set(tripId, stops);
  persistAll();

  return { days, stops };
}

export async function getTripItinerary(tripId: string): Promise<{
  days: ItineraryDay[];
  stops: ItineraryStop[];
}> {
  initializeDemoData();
  syncFromStorage();
  return {
    days: memoryDays.get(tripId) ?? [],
    stops: memoryStops.get(tripId) ?? [],
  };
}

export async function addItineraryStop(
  tripIdOrStop: string | Omit<ItineraryStop, 'id' | 'is_completed' | 'sort_order'>,
  maybeStop?: Omit<ItineraryStop, 'id' | 'is_completed' | 'sort_order'>
): Promise<ItineraryStop> {
  initializeDemoData();
  syncFromStorage();
  const stop = typeof tripIdOrStop === 'string' ? maybeStop! : tripIdOrStop;
  const tripStops = memoryStops.get(stop.trip_id) ?? [];
  const newStop: ItineraryStop = {
    ...stop,
    id: generateId(),
    is_completed: false,
    sort_order: tripStops.length + 1,
  };
  tripStops.push(newStop);
  memoryStops.set(stop.trip_id, tripStops);
  persistAll();
  return newStop;
}

export async function toggleStopCompleted(arg1: string, arg2?: string): Promise<boolean> {
  initializeDemoData();
  syncFromStorage();
  const allStops = Array.from(memoryStops.values()).flat();
  const stop = allStops.find((s) => s.id === arg1 || s.id === arg2);
  if (!stop) return false;
  stop.is_completed = !stop.is_completed;
  persistAll();
  return stop.is_completed;
}

export async function deleteTrip(tripId: string): Promise<boolean> {
  initializeDemoData();
  syncFromStorage();
  const existed = memoryTrips.delete(tripId);
  memoryDays.delete(tripId);
  memoryStops.delete(tripId);
  persistAll();
  return existed;
}
