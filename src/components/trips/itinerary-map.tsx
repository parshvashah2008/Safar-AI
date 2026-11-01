'use client';

import { useState, useEffect } from 'react';
import {
  Compass,
  ExternalLink,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Sparkles,
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

interface ItineraryMapProps {
  stops: ItineraryStop[];
  destination: string;
  activeDayTitle?: string | null;
  dayNumber?: number;
}

export function ItineraryMap({
  stops,
  destination,
  activeDayTitle,
  dayNumber = 1,
}: ItineraryMapProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(0);
  const [userGps, setUserGps] = useState<GpsCoordinate | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

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

  if (stops.length === 0) {
    return (
      <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-card text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
          <Compass className="w-5 h-5 text-teal-600" />
        </div>
        <h3 className="font-editorial text-base font-medium text-ink">Geospatial GPS Map</h3>
        <p className="text-xs text-ink-400 max-w-sm mx-auto">
          Add activities to your itinerary to view GPS waypoints, turn-by-turn navigation routes, and interactive satellite maps.
        </p>
      </div>
    );
  }

  const embedUrl = activeStop
    ? `https://maps.google.com/maps?q=${activeStop.resolvedLat},${activeStop.resolvedLng}+(${encodeURIComponent(
        activeStop.place_id || activeStop.title
      )})&t=${mapType === 'satellite' ? 'k' : ''}&z=15&ie=UTF8&iwloc=&output=embed`
    : getGoogleMapsEmbedUrl(destination);

  return (
    <div className="rounded-2xl border border-ivory-300 bg-white shadow-card overflow-hidden">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-ivory-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-ivory-50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
              <Compass className="w-4 h-4 text-teal-700" />
            </span>
            <h3 className="font-editorial text-lg font-medium text-ink">
              Geospatial GPS Waypoints
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              Live GPS Grounded
            </span>
          </div>
          <p className="text-xs text-ink-400 mt-1">
            {activeDayTitle ? `Day ${dayNumber}: ${activeDayTitle}` : `Itinerary for ${destination}`} · {stops.length} mapped stops
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Type Switcher */}
          <div className="inline-flex rounded-lg border border-ivory-300 bg-ivory-100 p-0.5 text-xs">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mapType === 'roadmap' ? 'bg-white text-teal-900 shadow-2xs font-semibold' : 'text-ink-400 hover:text-ink'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mapType === 'satellite' ? 'bg-white text-teal-900 shadow-2xs font-semibold' : 'text-ink-400 hover:text-ink'
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
            className="text-xs gap-1.5 border-ivory-300 hover:border-teal-500 h-8 text-ink-600"
            title="Calculate distance from your current location"
          >
            <LocateFixed className={`w-3.5 h-3.5 text-teal-700 ${locatingUser ? 'animate-spin' : ''}`} />
            <span>{locatingUser ? 'Locating...' : 'My GPS'}</span>
          </Button>
        </div>
      </div>

      {gpsError && (
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span>{gpsError}</span>
          <button onClick={() => setGpsError(null)} className="text-amber-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* Main Interactive Map Viewport */}
      <div className="relative w-full h-72 sm:h-80 bg-ivory-200 overflow-hidden">
        <iframe
          title="Itinerary Geospatial Map"
          src={embedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Active Stop Banner */}
        {activeStop && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md border border-ivory-300 rounded-xl p-3 shadow-elevated flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold text-white bg-teal-800 px-1.5 py-0.5 rounded">
                  0{selectedStopIndex + 1}
                </span>
                <span className="text-xs font-semibold text-ink truncate">
                  {activeStop.place_id || activeStop.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-ink-400 font-sans">
                <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="truncate">{activeStop.place_id || 'Verified Landmark'}</span>
                {userGps && (
                  <span className="text-teal-700 font-semibold font-sans">
                    · {computeDistanceKm(userGps.latitude, userGps.longitude, activeStop.resolvedLat, activeStop.resolvedLng)} km away
                  </span>
                )}
              </div>
            </div>

            <a
              href={getNavigationUrl(activeStop.resolvedLat, activeStop.resolvedLng, activeStop.place_id || activeStop.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-medium shrink-0 shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </a>
          </div>
        )}
      </div>

      {/* Sequential GPS Waypoints Route */}
      <div className="p-4 sm:p-5 border-t border-ivory-200 bg-ivory-50/50 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-ink-400">
          <span className="flex items-center gap-1.5 text-teal-800 font-semibold uppercase">
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
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/90 shadow-sm ring-1 ring-teal-500/30'
                    : 'border-ivory-200 bg-white hover:border-ivory-300 hover:bg-ivory-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                      0{idx + 1} · {stop.time}
                    </span>
                    <span className="capitalize text-[10px] font-mono text-ink-400">
                      {stop.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-xs text-ink line-clamp-1">
                    {stop.title}
                  </h4>
                  {stop.place_id && (
                    <p className="text-[11px] text-ink-400 truncate mt-0.5">
                      {stop.place_id}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-ivory-200/80 flex items-center justify-between text-[10px] font-sans text-ink-500">
                  <span className="truncate">
                    {stop.place_id || 'Verified Stop'}
                  </span>
                  {legDist !== null && (
                    <span className="text-teal-700 font-medium shrink-0 ml-1 font-mono">
                      +{legDist} km
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
