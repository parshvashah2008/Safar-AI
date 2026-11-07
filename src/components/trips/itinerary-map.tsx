'use client';

import { useState, useEffect } from 'react';
import {
  Compass,
  ExternalLink,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Plane,
  Route,
  Ship,
  Sparkles,
  Train,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  formatGpsCoordinates,
  getGoogleMapsEmbedUrl,
  getNavigationUrl,
  getGoogleMapsSearchUrl,
  computeDistanceKm,
  resolveStopCoordinates,
  GpsCoordinate,
} from '@/lib/geo/gps';
import type { ItineraryStop } from '@/types';

export interface TransitLegInfo {
  step: number;
  mode: string;
  from: string;
  to: string;
  duration: string;
  carrierOrOption?: string;
  formattedCost?: string;
  advice?: string;
}

export interface TransitRouteInfo {
  origin?: string;
  destination?: string;
  summary?: string;
  totalDuration?: string;
  legs?: TransitLegInfo[];
}

interface ItineraryMapProps {
  stops: ItineraryStop[];
  destination: string;
  activeDayTitle?: string | null;
  dayNumber?: number;
  transitRoute?: TransitRouteInfo | null;
}

export function ItineraryMap({
  stops,
  destination,
  activeDayTitle,
  dayNumber = 1,
  transitRoute,
}: ItineraryMapProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const [selectedTransitLegIndex, setSelectedTransitLegIndex] = useState<number>(0);
  const [userGps, setUserGps] = useState<GpsCoordinate | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const hasTransitLegs = Boolean(transitRoute?.legs && transitRoute.legs.length > 0);
  const [viewMode, setViewMode] = useState<'day_waypoints' | 'transit_corridor'>(
    stops.length > 0 ? 'day_waypoints' : hasTransitLegs ? 'transit_corridor' : 'day_waypoints'
  );

  // Reset selected stop index when stops array changes
  useEffect(() => {
    setSelectedStopIndex(0);
  }, [stops]);

  // Compute resolved coordinates for every stop
  const mappedStops = stops.map((stop, idx) => {
    const coords = resolveStopCoordinates(stop, destination, idx);
    return {
      ...stop,
      resolvedLat: coords.latitude,
      resolvedLng: coords.longitude,
    };
  });

  const activeStop = mappedStops[selectedStopIndex] || mappedStops[0];
  const activeTransitLeg = hasTransitLegs ? transitRoute!.legs![selectedTransitLegIndex] || transitRoute!.legs![0] : null;

  const handleGetLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGps({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('Could not retrieve current GPS position. Permissions may be denied.');
        setLocatingUser(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Build the appropriate Google Maps embed URL
  let embedUrl = '';
  if (viewMode === 'transit_corridor' && activeTransitLeg) {
    const cleanFrom = activeTransitLeg.from.replace(/\(.*?\)/g, '').trim();
    const cleanTo = activeTransitLeg.to.replace(/\(.*?\)/g, '').trim();
    embedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(cleanFrom)}&daddr=${encodeURIComponent(cleanTo)}&t=${mapType === 'satellite' ? 'k' : ''}&z=8&ie=UTF8&output=embed`;
  } else if (activeStop) {
    embedUrl = `https://maps.google.com/maps?q=${activeStop.resolvedLat},${activeStop.resolvedLng}+(${encodeURIComponent(
      activeStop.place_id || activeStop.title
    )})&t=${mapType === 'satellite' ? 'k' : ''}&z=15&ie=UTF8&iwloc=&output=embed`;
  } else {
    embedUrl = getGoogleMapsEmbedUrl(destination);
  }

  const getTransportIcon = (mode: string) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('flight') || m.includes('plane') || m.includes('air')) return <Plane className="w-3.5 h-3.5" />;
    if (m.includes('train') || m.includes('rail')) return <Train className="w-3.5 h-3.5" />;
    if (m.includes('ship') || m.includes('ferry') || m.includes('water')) return <Ship className="w-3.5 h-3.5" />;
    return <Car className="w-3.5 h-3.5" />;
  };

  return (
    <div className="rounded-3xl border border-sand-200 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] shadow-card overflow-hidden transition-colors">
      {/* Map Header with View Switcher */}
      <div className="p-4 sm:p-5 border-b border-sand-200 dark:border-[#1e2e26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sand-50/80 via-white to-white dark:from-[#15221b] dark:via-[#121c17] dark:to-[#121c17]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-emerald-950 text-teal-800 dark:text-emerald-300 border border-teal-100 dark:border-emerald-900/60">
              <Compass className="w-4 h-4 text-[#0d5c48] dark:text-emerald-400" />
            </span>
            <h3 className="font-editorial text-lg font-medium text-ink dark:text-[#edf2ee]">
              Geospatial Route & Navigation Map
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
              Live Satellite & Transit
            </span>
          </div>
          <p className="text-xs text-ink-400 dark:text-[#8ca397] mt-1">
            {viewMode === 'transit_corridor'
              ? `Inter-city transit corridor from ${transitRoute?.origin || 'Origin'} to ${destination}`
              : activeDayTitle
              ? `Day ${dayNumber}: ${activeDayTitle} · ${stops.length} mapped GPS waypoints`
              : `Itinerary for ${destination} · ${stops.length} mapped stops`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle: Day Waypoints vs Transit Corridor */}
          {hasTransitLegs && stops.length > 0 && (
            <div className="inline-flex rounded-xl border border-sand-300 dark:border-[#22352b] bg-sand-100 dark:bg-[#18261f] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('day_waypoints')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'day_waypoints'
                    ? 'bg-white dark:bg-[#0c1410] text-[#0d5c48] dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-ink-600 dark:text-sand-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                Day Waypoints
              </button>
              <button
                type="button"
                onClick={() => setViewMode('transit_corridor')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'transit_corridor'
                    ? 'bg-white dark:bg-[#0c1410] text-[#0d5c48] dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-ink-600 dark:text-sand-300 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                Transit Corridor
              </button>
            </div>
          )}

          {/* Map Type Switcher */}
          <div className="inline-flex rounded-xl border border-sand-300 dark:border-[#22352b] bg-sand-100 dark:bg-[#18261f] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                mapType === 'roadmap'
                  ? 'bg-white dark:bg-[#0c1410] text-teal-900 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-ink-400 hover:text-ink dark:text-sand-300'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                mapType === 'satellite'
                  ? 'bg-white dark:bg-[#0c1410] text-teal-900 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-ink-400 hover:text-ink dark:text-sand-300'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* User Location Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetLocation}
            disabled={locatingUser}
            className="text-xs gap-1.5 border-sand-300 dark:border-[#22352b] h-8 text-ink-600 dark:text-sand-200"
            title="Calculate distance from your current location"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-teal-700 dark:text-emerald-400 ${locatingUser ? 'animate-spin' : ''}`} />
            <span>{locatingUser ? 'Locating…' : 'My GPS'}</span>
          </Button>
        </div>
      </div>

      {gpsError && (
        <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-amber-900 dark:text-amber-200 font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full h-80 sm:h-96 bg-sand-100 dark:bg-[#0c1410] overflow-hidden">
        <iframe
          title="Itinerary Geospatial Map"
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Active Stop / Transit Banner */}
        {viewMode === 'transit_corridor' && activeTransitLeg ? (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md bg-white/95 dark:bg-[#121c17]/95 backdrop-blur-md border border-sand-300 dark:border-[#1e2e26] rounded-2xl p-3 shadow-elevated flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold text-white bg-[#0d5c48] px-2 py-0.5 rounded-md flex items-center gap-1">
                  {getTransportIcon(activeTransitLeg.mode)}
                  <span>Leg {activeTransitLeg.step}</span>
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white truncate">
                  {activeTransitLeg.from} ➔ {activeTransitLeg.to}
                </span>
              </div>
              <div className="text-[11px] text-teal-800 dark:text-emerald-400 font-medium">
                {activeTransitLeg.carrierOrOption || 'Commercial Transit'} • {activeTransitLeg.duration}
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(activeTransitLeg.from)}&destination=${encodeURIComponent(activeTransitLeg.to)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0d5c48] hover:bg-[#094032] text-white text-xs font-medium shrink-0 shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route</span>
            </a>
          </div>
        ) : activeStop ? (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md bg-white/95 dark:bg-[#121c17]/95 backdrop-blur-md border border-sand-300 dark:border-[#1e2e26] rounded-2xl p-3 shadow-elevated flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold text-white bg-teal-800 dark:bg-emerald-800 px-2 py-0.5 rounded-md">
                  0{selectedStopIndex + 1}
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white truncate">
                  {activeStop.place_id || activeStop.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-400 dark:text-[#8ca397] font-sans">
                <MapPin className="w-3 h-3 text-teal-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{activeStop.place_id || 'Verified Landmark'}</span>
                {userGps && (
                  <span className="text-teal-700 dark:text-emerald-400 font-semibold font-sans">
                    · {computeDistanceKm(userGps.latitude, userGps.longitude, activeStop.resolvedLat, activeStop.resolvedLng)} km away
                  </span>
                )}
              </div>
            </div>

            <a
              href={getNavigationUrl(activeStop.resolvedLat, activeStop.resolvedLng, activeStop.place_id || activeStop.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-medium shrink-0 shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </a>
          </div>
        ) : null}
      </div>

      {/* Transit Corridor Interactive Leg Selector */}
      {viewMode === 'transit_corridor' && hasTransitLegs && (
        <div className="p-4 sm:p-5 border-t border-sand-200 dark:border-[#1e2e26] bg-sand-50/60 dark:bg-[#0c1410]/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 dark:text-[#8ca397]">
            <span className="flex items-center gap-1.5 text-teal-800 dark:text-emerald-400 font-semibold uppercase">
              <Route className="w-3.5 h-3.5" />
              <span>Multi-Modal Feeder Corridor Sequence</span>
            </span>
            <span>Click any leg to center on map</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {transitRoute!.legs!.map((leg, idx) => {
              const isSelected = idx === selectedTransitLegIndex;
              return (
                <div
                  key={leg.step}
                  onClick={() => setSelectedTransitLegIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-sand-200 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] hover:border-emerald-400 dark:hover:border-emerald-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-teal-800 dark:text-emerald-300 font-bold bg-teal-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-emerald-800/40 flex items-center gap-1">
                      {getTransportIcon(leg.mode)}
                      <span>Leg {leg.step}</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 dark:text-emerald-400 font-bold">
                      {leg.duration}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-ink dark:text-white line-clamp-1">
                      {leg.from} ➔ {leg.to}
                    </h4>
                    <p className="text-[11px] text-ink-400 dark:text-[#8ca397] line-clamp-2 mt-0.5 leading-relaxed">
                      {leg.carrierOrOption || leg.advice || 'Direct Corridor Transit'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sequential GPS Waypoints Route (Day Waypoints View) */}
      {viewMode === 'day_waypoints' && mappedStops.length > 0 && (
        <div className="p-4 sm:p-5 border-t border-sand-200 dark:border-[#1e2e26] bg-sand-50/60 dark:bg-[#0c1410]/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-ink-500 dark:text-[#8ca397]">
            <span className="flex items-center gap-1.5 text-teal-800 dark:text-emerald-400 font-semibold uppercase">
              <Route className="w-3.5 h-3.5" />
              <span>Waypoints Route Sequence ({stops.length} stops)</span>
            </span>
            <span>Click any waypoint to center & inspect map</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {mappedStops.map((stop, idx) => {
              const isSelected = idx === selectedStopIndex;
              const prevStop = idx > 0 ? mappedStops[idx - 1] : null;
              const legDist = prevStop
                ? computeDistanceKm(prevStop.resolvedLat, prevStop.resolvedLng, stop.resolvedLat, stop.resolvedLng)
                : null;

              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-xs ring-1 ring-emerald-500/30'
                      : 'border-sand-200 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] hover:border-emerald-400 dark:hover:border-emerald-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] text-teal-700 dark:text-emerald-400 font-semibold bg-teal-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-teal-100 dark:border-emerald-800">
                        0{idx + 1} · {stop.time}
                      </span>
                      <span className="capitalize text-[10px] font-mono text-ink-400 dark:text-[#8ca397]">
                        {stop.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-ink dark:text-white line-clamp-1">
                      {stop.title}
                    </h4>
                    {stop.place_id && (
                      <p className="text-[11px] text-ink-400 dark:text-[#8ca397] truncate mt-0.5">
                        {stop.place_id}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-sand-200/80 dark:border-[#1e2e26] flex items-center justify-between text-[10px] font-sans text-ink-500 dark:text-[#8ca397]">
                    <span className="truncate">
                      {stop.place_id || 'Verified Stop'}
                    </span>
                    {legDist !== null && (
                      <span className="text-teal-700 dark:text-emerald-400 font-medium shrink-0 ml-1 font-mono">
                        +{legDist} km
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
