'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarDays, Filter, Plus, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatMoney, formatDate, daysBetween } from '@/lib/utils';
import { getTrips, deleteTrip } from '@/lib/services/trip-service';
import { TripDetailView } from '@/components/trips/trip-detail-view';
import { getDestinationImage } from '@/lib/constants/destination-images';
import { SYNC_EVENTS, emitTripChange } from '@/lib/services/sync-bus';
import type { Trip } from '@/types';

function TripsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if a specific trip ID was requested (either via ?id=... or /trips/[id])
  let activeTripId = searchParams.get('id');
  if (!activeTripId && typeof window !== 'undefined') {
    const p = window.location.pathname;
    if (p.startsWith('/trips/') && p !== '/trips' && p !== '/trips/') {
      activeTripId = p.replace(/^\/trips\//, '').split('/')[0];
    }
  }

  if (activeTripId) {
    return <TripDetailView tripId={activeTripId} />;
  }

  return <TripsListView />;
}

function TripsListView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();

    const handleTripSync = () => {
      loadTrips();
    };
    window.addEventListener(SYNC_EVENTS.TRIP_CHANGED, handleTripSync);
    window.addEventListener('storage', handleTripSync);
    return () => {
      window.removeEventListener(SYNC_EVENTS.TRIP_CHANGED, handleTripSync);
      window.removeEventListener('storage', handleTripSync);
    };
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    const data = await getTrips();
    setTrips(data);
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete the ${name} trip?`)) {
      await deleteTrip(id);
      emitTripChange(id);
      loadTrips();
    }
  };

  const filtered = trips.filter(
    (t) =>
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 font-semibold">
            YOUR SAVED JOURNEYS
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink">
            My Trips
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Every journey planned, budgeted, and tracked — all safely in one place.
          </p>
        </div>

        <Link href="/plan">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Plan New Trip</span>
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destination or country..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-ivory-300 bg-white placeholder:text-ink-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-400 self-end sm:self-auto">
          <Filter className="h-3.5 w-3.5" />
          <span>{filtered.length} JOURNEYS FOUND</span>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-ink-400">Loading your travel itineraries...</div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-4 rounded-2xl border border-dashed border-ivory-300 bg-white/60 p-8">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-full w-fit mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-editorial text-xl font-medium text-ink">No trips matched your search</h3>
          <p className="text-xs text-ink-400 max-w-sm mx-auto">
            Ready to design a new journey? Safar AI creates bespoke day-by-day itineraries with verified local pacing.
          </p>
          <Link href="/plan">
            <Button size="sm">Start Planning Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trip, idx) => {
            const daysCount = daysBetween(trip.start_date, trip.end_date);
            const coverImg = getDestinationImage(trip.destination);
            return (
              <div
                key={trip.id}
                className="group overflow-hidden rounded-2xl border border-[#e8e6df] bg-white hover:border-[#0d5c48]/50 transition-all duration-300 shadow-card hover:shadow-elevated flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-200">
                    <img
                      src={coverImg}
                      alt={trip.destination}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111a16]/90 via-[#111a16]/30 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
                      <span className="bg-white/90 text-[#0d5c48] px-2.5 py-0.5 rounded-full backdrop-blur-md font-bold shadow-2xs">
                        0{idx + 1} · {trip.country}
                      </span>
                      <span className="bg-[#111a16]/60 text-amber-200 px-2 py-0.5 rounded-full backdrop-blur-md font-medium border border-white/20 capitalize">
                        {trip.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-amber-200/90 block font-semibold">
                        {daysCount} Days Journey
                      </span>
                      <h3 className="font-editorial text-2xl font-medium tracking-tight text-white drop-shadow-xs">
                        {trip.destination}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4 text-xs text-[#5f7067]">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[#0d5c48]" />
                        <span>{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#0d5c48]" />
                        <span>{trip.travelers} Pax</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#88968f] font-semibold">PLANNED CAP</span>
                      <span className="font-semibold text-sm text-[#111a16] font-mono">
                        {formatMoney(trip.budget, trip.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(trip.id, trip.destination)}
                    className="text-[#97a59d] hover:text-rose-600 hover:bg-rose-50 h-9 px-2.5 rounded-xl transition-colors"
                    title="Delete journey"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Link href={`/trips?id=${trip.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs h-9 rounded-xl bg-[#0d5c48] hover:bg-[#094032] text-white font-semibold shadow-2xs">
                      <span>View Itinerary & Map</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-ink-400">Loading your travel itineraries...</div>}>
      <TripsContent />
    </Suspense>
  );
}
