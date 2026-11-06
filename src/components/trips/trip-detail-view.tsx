'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  Plane,
  Plus,
  Printer,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
  Coins,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, formatDate, daysBetween } from '@/lib/utils';
import {
  getTripById,
  getTripItinerary,
  addItineraryStop,
  toggleStopCompleted,
  applyAIItinerary,
} from '@/lib/services/trip-service';
import { getExpenses } from '@/lib/services/budget-service';
import { getDestinationImage } from '@/lib/constants/destination-images';
import { analyzeTransitRoute } from '@/lib/services/transit-routing';
import { ItineraryMap } from '@/components/trips/itinerary-map';
import {
  formatGpsCoordinates,
  getNavigationUrl,
  getGoogleMapsSearchUrl,
  resolveStopCoordinates,
} from '@/lib/geo/gps';
import { formatTo12Hour, parseTimeToMinutes } from '@/lib/utils/time-format';
import { emitRouteChange } from '@/lib/services/sync-bus';
import { generateClientItinerary } from '@/lib/ai/client-ai-engine';
import type { Trip, ItineraryDay, ItineraryStop, StopCategory } from '@/types';

export function TripDetailView({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [activeDayId, setActiveDayId] = useState<string>('');
  const [spentTotal, setSpentTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitData, setTransitData] = useState<any>(null);
  const [activeRouteMode, setActiveRouteMode] = useState<'budget' | 'fastest'>('budget');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    time: '10:00',
    title: '',
    description: '',
    category: 'sightseeing' as StopCategory,
    estimated_cost: '',
  });

  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    setLoading(true);
    const tripData = await getTripById(tripId);
    if (!tripData) {
      setLoading(false);
      return;
    }
    setTrip(tripData);

    const { days: tripDays, stops: tripStops } = await getTripItinerary(tripId);

    // Auto-sanitize legacy placeholder names or lowercase titles
    const cleanStops = tripStops.map((s) => {
      let placeName = (s as any).place_name || (s as any).place_id || s.title || '';
      let placeId = (s as any).place_id || placeName;
      let title = s.title || '';
      let desc = s.description || '';
      const destLower = (tripData.destination || '').toLowerCase();
      const capitalDest = tripData.destination.charAt(0).toUpperCase() + tripData.destination.slice(1);

      // Fix lowercase destination prefix in placeName, placeId, or title
      if (placeName.toLowerCase().startsWith(destLower + ' ') || placeName.toLowerCase().startsWith(destLower.trim() + ' ')) {
        placeName = placeName.replace(new RegExp(`^${destLower}`, 'i'), capitalDest);
      }
      if (placeId.toLowerCase().startsWith(destLower + ' ') || placeId.toLowerCase().startsWith(destLower.trim() + ' ')) {
        placeId = placeId.replace(new RegExp(`^${destLower}`, 'i'), capitalDest);
      }
      if (title.toLowerCase().includes(destLower)) {
        title = title.replace(new RegExp(destLower, 'gi'), capitalDest);
      }
      if (desc.toLowerCase().includes(`streets of ${destLower}`)) {
        desc = desc.replace(new RegExp(`streets of ${destLower}`, 'gi'), `streets of ${capitalDest}`);
      }
      if (desc.toLowerCase().includes(`around ${destLower}`)) {
        desc = desc.replace(new RegExp(`around ${destLower}`, 'gi'), `around ${capitalDest}`);
      }
      if (desc.toLowerCase().includes(`across ${destLower}`)) {
        desc = desc.replace(new RegExp(`across ${destLower}`, 'gi'), `across ${capitalDest}`);
      }

      // Palitana legacy cleaning (replaces generic placeholders with authentic Shatrunjaya stops)
      if (destLower.includes('palitana')) {
        if (
          placeName.toLowerCase().includes('central heritage quarter') ||
          placeId.toLowerCase().includes('central heritage quarter') ||
          title.toLowerCase().includes('central district') ||
          title.toLowerCase().includes('central heritage')
        ) {
          title = 'Arrival & Taleti Sacred Foothills Orientation';
          placeName = 'Taleti Road Dharamshala Precinct, Palitana';
          placeId = 'Taleti Road Dharamshala Precinct, Palitana';
          desc = 'Arrive in Palitana, check in near Taleti Road, and take an orientation walk near the sacred foothills.';
        } else if (
          placeName.toLowerCase().includes('renowned local restaurant') ||
          placeId.toLowerCase().includes('renowned local restaurant') ||
          title.toLowerCase().includes('gastronomy lunch')
        ) {
          title = 'Traditional Pure Jain Satvik Lunch';
          placeName = 'Hotel Shravak Satvik Bhojanshala, Palitana';
          placeId = 'Hotel Shravak Satvik Bhojanshala, Palitana';
          desc = 'Wholesome, freshly prepared satvik Jain thali near Taleti gate.';
        } else if (
          placeName.toLowerCase().includes('scenic point') ||
          placeId.toLowerCase().includes('scenic point') ||
          title.toLowerCase().includes('scenic viewpoint')
        ) {
          title = 'Hastagiri Tirth & Shatrunji River Viewpoint';
          placeName = 'Hastagiri Jain Tirth Lookout, Palitana';
          placeId = 'Hastagiri Jain Tirth Lookout, Palitana';
          desc = 'Panoramic viewpoint overlooking the Shatrunjaya mountain range and Shetrunji river basin.';
        } else if (
          placeName.toLowerCase().includes('dining quarter') ||
          placeId.toLowerCase().includes('dining quarter') ||
          title.toLowerCase().includes('evening culinary') ||
          title.toLowerCase().includes('night walk')
        ) {
          title = 'Evening Taleti Bazaar & Satvik Dining Walk';
          placeName = 'Hotel Sumeru Heritage Dining Hall, Palitana';
          placeId = 'Hotel Sumeru Heritage Dining Hall, Palitana';
          desc = 'Peaceful evening stroll through the Taleti market with warm Gujarati satvik dining.';
        }
      } else {
        // Universal cleaning for any other city on Earth
        if (placeName.toLowerCase().includes('central heritage quarter') || placeId.toLowerCase().includes('central heritage quarter')) {
          placeName = `${capitalDest} Historic Old Town & Central Plaza`;
          placeId = placeName;
          title = `Arrival & Historic District Orientation in ${capitalDest}`;
        } else if (placeName.toLowerCase().includes('renowned local restaurant') || placeId.toLowerCase().includes('renowned local restaurant')) {
          placeName = `Authentic Heritage Bistro, ${capitalDest}`;
          placeId = placeName;
          title = `Authentic Regional Gastronomy Lunch`;
        } else if (placeName.toLowerCase().includes('scenic point') || placeId.toLowerCase().includes('scenic point')) {
          placeName = `${capitalDest} Panoramic Lookout & Viewpoint`;
          placeId = placeName;
          title = `Panoramic Scenic Viewpoint & Cultural Experience`;
        } else if (placeName.toLowerCase().includes('dining quarter') || placeId.toLowerCase().includes('dining quarter')) {
          placeName = `${capitalDest} Historic Dining Terrace`;
          placeId = placeName;
          title = `Evening Dinner & Atmospheric Night Walk`;
        }
      }

      return { ...s, title, place_name: placeName, place_id: placeId, description: desc };
    });

    setDays(tripDays);
    setStops(cleanStops);
    if (tripDays.length > 0) {
      setActiveDayId(tripDays[0].id);
    }

    const expenses = await getExpenses(tripId);
    const total = expenses.reduce((sum, e) => (e.is_refunded ? sum : sum + e.amount), 0);
    setSpentTotal(total);

    // Load transit routing data
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`safar_transit_${tripId}`);
        const pref = localStorage.getItem(`safar_route_pref_${tripId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTransitData(parsed);
          if (pref === 'budget' || pref === 'fastest') {
            setActiveRouteMode(pref);
          } else if (parsed.modeLabel) {
            setActiveRouteMode(parsed.modeLabel);
          }
        }
      } catch {}
    }

    setLoading(false);
  };

  const handleSwitchRouteMode = (mode: 'budget' | 'fastest') => {
    setActiveRouteMode(mode);
    if (trip) {
      emitRouteChange(mode, trip.id);
      try {
        localStorage.setItem(`safar_route_pref_${trip.id}`, mode);
      } catch (e) {}
    }
  };

  const handleRegenerateWithGemini = async () => {
    if (!trip) return;
    setRegenerating(true);
    try {
      // Use Client AI Engine with automatic Gemini 2.5 Flash -> Groq -> fallback cascade
      const res = await generateClientItinerary({
        origin: 'India',
        destination: trip.destination,
        startDate: trip.start_date,
        endDate: trip.end_date,
        travelers: trip.travelers,
        budget: trip.budget,
        currency: trip.currency,
        interests: trip.interests,
        dietary: trip.dietary || undefined,
        accessibility: trip.accessibility || undefined,
      });

      if (res.days && Array.isArray(res.days) && res.days.length > 0) {
        const applied = await applyAIItinerary(trip.id, res.days, trip.currency);
        setDays(applied.days);
        setStops(applied.stops);
        if (applied.days.length > 0) {
          setActiveDayId(applied.days[0].id);
        }
        if (res.corrected_destination && res.corrected_destination !== trip.destination) {
          setTrip((prev) => (prev ? { ...prev, destination: res.corrected_destination } : null));
        }
      }
    } catch (e) {
      console.error('Itinerary regeneration failed:', e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleDone = async (stopId: string) => {
    if (!trip) return;
    await toggleStopCompleted(stopId, trip.id);
    setStops((prev) =>
      prev.map((s) => (s.id === stopId ? { ...s, is_completed: !s.is_completed } : s))
    );
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !newActivity.title.trim() || !activeDayId) return;

    const stop = await addItineraryStop({
      day_id: activeDayId,
      trip_id: trip.id,
      time: formatTo12Hour(newActivity.time),
      title: newActivity.title.trim(),
      description: newActivity.description.trim() || null,
      place_id: null,
      latitude: null,
      longitude: null,
      duration_minutes: 60,
      estimated_cost: newActivity.estimated_cost ? Number(newActivity.estimated_cost) : null,
      currency: trip.currency,
      category: newActivity.category,
      is_optional: false,
      booking_ref: null,
    });

    setStops((prev) => [...prev, stop]);
    setNewActivity({ time: '10:00', title: '', description: '', category: 'sightseeing', estimated_cost: '' });
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-ink-400 flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
        <span>Opening itinerary…</span>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-medium">Trip not found</h2>
        <p className="text-xs text-ink-400">The journey you requested could not be located in your vault.</p>
        <Link href="/trips">
          <Button size="sm">Back to My Trips</Button>
        </Link>
      </div>
    );
  }

  const currentDayStops = stops
    .filter((s) => s.day_id === activeDayId)
    .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

  const budgetProgress = trip.budget > 0 ? Math.min(100, Math.round((spentTotal / trip.budget) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Trips</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 hidden sm:inline-flex"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>
          <Link href={`/wallet?tripId=${trip.id}`}>
            <Button size="sm" variant="secondary" className="text-xs gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-teal-600" />
              <span>Trip Wallet</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Banner with Destination Photography */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e8e6df] shadow-elevated">
        <img
          src={getDestinationImage(trip.destination)}
          alt={trip.destination}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07241c]/95 via-[#0b382c]/85 to-[#0b382c]/65 backdrop-blur-[2px]" />

        <div className="relative p-6 sm:p-8 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-amber-200 font-mono text-[10px] tracking-wider uppercase font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-sans text-[11px] font-semibold backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live AI Reasoning & GPS
                </span>
                <span>·</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{trip.country}</span>
                <span>·</span>
                <span>{daysBetween(trip.start_date, trip.end_date)} DAYS</span>
              </div>
              <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white drop-shadow-md">
                {trip.destination}
              </h1>
              <div className="flex items-center gap-4 text-xs text-white/90 pt-1 font-medium">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-amber-300" />
                  <span>{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-300" />
                  <span>{trip.travelers} Travelers</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#111a16]/60 backdrop-blur-xl p-4 sm:p-5 border border-white/20 min-w-[260px] shadow-lg">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-200 font-bold">
                <span>Budget Velocity</span>
                <span>{budgetProgress}% spent</span>
              </div>
              <div className="mt-1 font-semibold text-xl font-mono text-white">
                {formatMoney(spentTotal, trip.currency)}{' '}
                <span className="text-xs font-normal text-white/70">
                  / {formatMoney(trip.budget, trip.currency)}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${budgetProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transit & Gateway Routing Blueprint (Gemini Dual Route Enabled) */}
      {(() => {
        const dual = transitData?.dualComparison;
        const defaultTransit = analyzeTransitRoute('', trip.destination);
        const activeRoute = dual
          ? (activeRouteMode === 'budget' ? dual.budgetRoute : dual.fastestRoute)
          : null;

        return (
          <div className="rounded-2xl border border-teal-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-teal-50/70 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-amber-950/20 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 dark:border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-teal-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-ink dark:text-[#edf2ee]">
                  Multi-Modal Transit Blueprint:
                </span>
                <span className="text-xs text-teal-800 dark:text-emerald-300 font-medium">
                  {activeRoute?.summary || transitData?.summary || defaultTransit.summaryNote}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold w-fit">
                  LIVE INTELLIGENT ROUTING
                </span>
              </div>
            </div>

            {/* Dual Route Switcher (Budget vs Time-Saving) */}
            {dual && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleSwitchRouteMode('budget')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    activeRouteMode === 'budget'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 shadow-2xs'
                      : 'bg-white/80 dark:bg-[#0c1410]/70 border-sand-200 dark:border-[#1e2e26] hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                      <Coins className="w-3 h-3" />
                      BUDGET ROUTE
                    </span>
                    <span className="text-xs font-bold font-serif text-emerald-950 dark:text-emerald-300">
                      {dual.budgetRoute.formattedTotalCost}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-ink-900 dark:text-white mt-1.5">
                    {dual.budgetRoute.title}
                  </div>
                  <div className="text-[11px] text-ink-500 font-mono mt-0.5">
                    ⏱️ {dual.budgetRoute.totalDuration} • {dual.budgetRoute.advantageText}
                  </div>
                </div>

                <div
                  onClick={() => handleSwitchRouteMode('fastest')}
                  className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                    activeRouteMode === 'fastest'
                      ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 shadow-2xs'
                      : 'bg-white/80 dark:bg-[#0c1410]/70 border-sand-200 dark:border-[#1e2e26] hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded">
                      <Zap className="w-3 h-3 text-amber-500" />
                      TIME-SAVING ROUTE
                    </span>
                    <span className="text-xs font-bold font-serif text-sky-950 dark:text-sky-300">
                      {dual.fastestRoute.formattedTotalCost}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-ink-900 dark:text-white mt-1.5">
                    {dual.fastestRoute.title}
                  </div>
                  <div className="text-[11px] text-ink-500 font-mono mt-0.5">
                    ⏱️ {dual.fastestRoute.totalDuration} • {dual.fastestRoute.advantageText}
                  </div>
                </div>
              </div>
            )}

            {/* Transit Legs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(activeRoute
                ? activeRoute.legs.map((l: any) => ({
                    step: l.step,
                    from: l.from,
                    to: l.to,
                    duration: l.duration,
                    carrierOrOption: `${l.carrier} (Est: ${l.formattedCost})`,
                    advice: l.advice,
                  }))
                : transitData?.legs || defaultTransit.transitLegs
              ).map((leg: any) => (
                <div key={leg.step} className="rounded-xl border border-teal-100 dark:border-emerald-900/40 bg-white/90 dark:bg-[#0c1410]/90 p-3.5 space-y-1 text-xs">
                  <div className="font-semibold text-ink dark:text-[#edf2ee] flex items-center justify-between">
                    <span>Leg {leg.step}: {leg.from} ➔ {leg.to}</span>
                    <span className="font-mono text-[10px] text-teal-700 dark:text-emerald-400 font-bold">{leg.duration}</span>
                  </div>
                  <div className="text-[11px] text-teal-800 dark:text-emerald-300 font-medium">
                    {leg.carrierOrOption}
                  </div>
                  <p className="text-[11px] text-ink-400 dark:text-[#8ca397] leading-relaxed">
                    {leg.advice}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-ink-500 dark:text-ink-400 font-mono">
                💡 Real-time transit calculated for {trip.destination}
              </span>
              <Link
                href={`/bookings?tripId=${trip.id}&category=flight`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white shadow-2xs transition-colors"
              >
                <Plane className="w-3.5 h-3.5 text-amber-200" />
                <span>Check Real-Time Flights & Transit Passes</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Geospatial GPS Waypoints Map */}
      <ItineraryMap
        stops={currentDayStops.length > 0 ? currentDayStops : stops}
        destination={trip.destination}
        activeDayTitle={days.find((d) => d.id === activeDayId)?.title}
        dayNumber={days.find((d) => d.id === activeDayId)?.day_number || 1}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ivory-200 pb-3 gap-3">
            <div>
              <h2 className="font-editorial text-xl font-medium text-ink">Itinerary Timeline</h2>
              {days.find((d) => d.id === activeDayId)?.title && (
                <p className="text-xs text-teal-800 font-sans font-medium mt-0.5">
                  {days.find((d) => d.id === activeDayId)?.title}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={regenerating}
                onClick={handleRegenerateWithGemini}
                className="text-xs gap-1.5 border-teal-300 text-teal-800 hover:bg-teal-50"
              >
                {regenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                )}
                <span>{regenerating ? 'Synthesizing Itinerary…' : 'Regenerate Itinerary'}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs gap-1"
              >
                {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{showAddForm ? 'Cancel' : 'Add Activity'}</span>
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {days.map((day) => {
              const isActive = day.id === activeDayId;
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDayId(day.id)}
                  className={`flex flex-col items-start min-w-[110px] rounded-xl px-4 py-2.5 text-left transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#094032] to-[#0d5c48] text-white shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white hover:bg-[#f4f3ee] text-[#4d5c54] border border-[#e8e6df]'
                  }`}
                >
                  <span className={`font-mono text-[9px] uppercase tracking-wider font-bold ${isActive ? 'text-amber-200' : 'text-[#88968f]'}`}>
                    DAY 0{day.day_number}
                  </span>
                  <span className="font-semibold text-xs mt-0.5">{formatDate(day.date)}</span>
                </button>
              );
            })}
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddStop}
              className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-4"
            >
              <div className="font-semibold text-xs text-teal-800">New Activity for Selected Day</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="act-time">Time</Label>
                  <Input
                    id="act-time"
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="act-title">Activity Title</Label>
                  <Input
                    id="act-title"
                    required
                    placeholder="e.g. Walk to Sunset Point"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="act-desc">Notes</Label>
                  <Input
                    id="act-desc"
                    placeholder="Directions or ticket details"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="act-cost">Est. Cost (₹)</Label>
                  <Input
                    id="act-cost"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 500"
                    value={newActivity.estimated_cost}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      const clean = digitsOnly.replace(/^0+(?=\d)/, '');
                      setNewActivity({ ...newActivity, estimated_cost: clean });
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Activity
                </Button>
              </div>
            </form>
          )}

          {currentDayStops.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-400 space-y-2">
              <CalendarDays className="h-8 w-8 mx-auto text-ivory-400" />
              <p>No activities scheduled for this day yet.</p>
              <Button size="sm" variant="secondary" onClick={() => setShowAddForm(true)}>
                Add your first activity
              </Button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-ivory-300">
              {currentDayStops.map((stop) => (
                <div key={stop.id} className="relative group">
                  <button
                    onClick={() => handleToggleDone(stop.id)}
                    className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                      stop.is_completed
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-ivory-400 bg-white hover:border-teal-600'
                    }`}
                    title={stop.is_completed ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {stop.is_completed && <Check className="h-3 w-3" />}
                  </button>

                  <div
                    className={`rounded-xl border p-4 transition-all ${
                      stop.is_completed
                        ? 'border-ivory-200 bg-ivory-50/60 opacity-60'
                        : 'border-ivory-300 bg-white hover:border-teal-300 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                          {formatTo12Hour(stop.time)}
                        </span>
                        <h4
                          className={`font-semibold text-sm ${
                            stop.is_completed ? 'line-through text-ink-400' : 'text-ink'
                          }`}
                        >
                          {stop.title}
                        </h4>
                      </div>

                      {stop.estimated_cost !== null && stop.estimated_cost > 0 && (
                        <span className="font-mono text-xs text-sand-800 bg-sand-50 px-2 py-0.5 rounded-md">
                          Est. {formatMoney(stop.estimated_cost, stop.currency || trip.currency)}
                        </span>
                      )}
                    </div>

                    {stop.description && (
                      <p className="text-xs text-ink-400 mt-2 leading-relaxed">
                        {stop.description}
                      </p>
                    )}

                    {/* Verified Location & Live Maps Actions (Clean place names, no raw coordinates) */}
                    {(() => {
                      const coords = resolveStopCoordinates(stop, trip.destination);
                      const placeLabel = stop.place_id || stop.title;
                      return (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-ivory-200 dark:border-[#1e2e26]">
                          <div className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-teal-900 dark:text-emerald-300 bg-teal-50/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-teal-100 dark:border-emerald-800/40">
                            <MapPin className="w-3 h-3 text-teal-600 dark:text-emerald-400 shrink-0" />
                            <span className="truncate max-w-[200px] sm:max-w-[280px]">{placeLabel}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={getNavigationUrl(coords.latitude, coords.longitude, placeLabel)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-teal-800 hover:bg-teal-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                              title="Turn-by-turn Navigation in Google Maps"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Navigate</span>
                            </a>
                            <a
                              href={getGoogleMapsSearchUrl(coords.latitude, coords.longitude, placeLabel)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-600 dark:text-[#edf2ee] hover:text-teal-900 bg-ivory-100 hover:bg-ivory-200 dark:bg-[#18251f] dark:hover:bg-[#22352b] px-2.5 py-1 rounded-md transition-colors"
                              title="Inspect place on Google Maps"
                            >
                              <ExternalLink className="w-3 h-3 text-ink-400 dark:text-[#8ca397]" />
                              <span>Map</span>
                            </a>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-400 pt-2 border-t border-ivory-100">
                      <span className="capitalize font-mono text-[10px] text-teal-700">
                        {stop.category}
                      </span>
                      {stop.booking_ref && (
                        <span className="font-mono text-[10px]">Ref: {stop.booking_ref}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 rounded-xl bg-ivory-100 text-[11px] text-ink-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sand-600 flex-shrink-0" />
            <span>Itinerary suggestions are starting points. Always confirm opening hours and local conditions.</span>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-medium text-ink">Trip Budget</h3>
              <Link href={`/budget?tripId=${trip.id}`} className="text-xs text-teal-600 font-semibold hover:underline">
                View Ledger →
              </Link>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>Total Spent</span>
                <span className="font-semibold text-ink">{formatMoney(spentTotal, trip.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>Planned Cap</span>
                <span>{formatMoney(trip.budget, trip.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-teal-700 pt-1 border-t border-ivory-200">
                <span>Remaining</span>
                <span>{formatMoney(Math.max(0, trip.budget - spentTotal), trip.currency)}</span>
              </div>
            </div>

            <Link href={`/budget?tripId=${trip.id}`}>
              <Button size="sm" variant="secondary" className="w-full text-xs">
                Record New Expense
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-6 space-y-3">
            <div className="flex items-center gap-2 text-teal-800 font-semibold text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Ask Copilot about {trip.destination}</span>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              Have questions about local transport, rainy day alternatives, or vegetarian spots? Copilot is grounded in your trip dates.
            </p>
            <Link href={`/copilot?tripId=${trip.id}`}>
              <Button size="sm" className="w-full text-xs">
                Launch Copilot
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
