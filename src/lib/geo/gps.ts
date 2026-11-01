export interface GpsCoordinate {
  latitude: number;
  longitude: number;
}

export const DESTINATION_GPS_CENTERS: Record<string, GpsCoordinate> = {
  manali: { latitude: 32.2396, longitude: 77.1887 },
  shimla: { latitude: 31.1048, longitude: 77.1734 },
  dharamshala: { latitude: 32.2190, longitude: 76.3234 },
  srinagar: { latitude: 34.0837, longitude: 74.7973 },
  gulmarg: { latitude: 34.0484, longitude: 74.3805 },
  kashmir: { latitude: 34.0837, longitude: 74.7973 },
  ladakh: { latitude: 34.1526, longitude: 77.5771 },
  leh: { latitude: 34.1526, longitude: 77.5771 },
  goa: { latitude: 15.2993, longitude: 74.1240 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
  udaipur: { latitude: 24.5854, longitude: 73.7125 },
  jodhpur: { latitude: 26.2389, longitude: 73.0243 },
  jaisalmer: { latitude: 26.9157, longitude: 70.9083 },
  varanasi: { latitude: 25.3176, longitude: 82.9739 },
  benares: { latitude: 25.3176, longitude: 82.9739 },
  kashi: { latitude: 25.3176, longitude: 82.9739 },
  sundarbans: { latitude: 21.9497, longitude: 89.1833 },
  sunderbans: { latitude: 21.9497, longitude: 89.1833 },
  hampi: { latitude: 15.3350, longitude: 76.4600 },
  kochi: { latitude: 9.9312, longitude: 76.2673 },
  kerala: { latitude: 9.9312, longitude: 76.2673 },
  munnar: { latitude: 10.0889, longitude: 77.0595 },
  alleppey: { latitude: 9.4981, longitude: 76.3388 },
  rishikesh: { latitude: 30.0869, longitude: 78.2676 },
  amritsar: { latitude: 31.6340, longitude: 74.8723 },
  delhi: { latitude: 28.6139, longitude: 77.2090 },
  'new delhi': { latitude: 28.6139, longitude: 77.2090 },
  mumbai: { latitude: 19.0760, longitude: 72.8777 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  nepal: { latitude: 27.7172, longitude: 85.3240 },
  kathmandu: { latitude: 27.7172, longitude: 85.3240 },
  pokhara: { latitude: 28.2096, longitude: 83.9856 },
  kyoto: { latitude: 35.0116, longitude: 135.7681 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  osaka: { latitude: 34.6937, longitude: 135.5023 },
  bali: { latitude: -8.5069, longitude: 115.2625 },
  ubud: { latitude: -8.5069, longitude: 115.2625 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  rome: { latitude: 41.9028, longitude: 12.4964 },
  italy: { latitude: 41.9028, longitude: 12.4964 },
  london: { latitude: 51.5074, longitude: -0.1278 },
  uk: { latitude: 51.5074, longitude: -0.1278 },
  unitedkingdom: { latitude: 51.5074, longitude: -0.1278 },
  england: { latitude: 51.5074, longitude: -0.1278 },
  britain: { latitude: 51.5074, longitude: -0.1278 },
  greatbritain: { latitude: 51.5074, longitude: -0.1278 },
  scotland: { latitude: 55.9533, longitude: -3.1883 },
  edinburgh: { latitude: 55.9533, longitude: -3.1883 },
  ireland: { latitude: 53.3498, longitude: -6.2603 },
  dublin: { latitude: 53.3498, longitude: -6.2603 },
  usa: { latitude: 40.7128, longitude: -74.0060 },
  us: { latitude: 40.7128, longitude: -74.0060 },
  unitedstates: { latitude: 40.7128, longitude: -74.0060 },
  america: { latitude: 40.7128, longitude: -74.0060 },
  newyork: { latitude: 40.7128, longitude: -74.0060 },
  germany: { latitude: 52.5200, longitude: 13.4050 },
  berlin: { latitude: 52.5200, longitude: 13.4050 },
  spain: { latitude: 40.4168, longitude: -3.7038 },
  madrid: { latitude: 40.4168, longitude: -3.7038 },
  barcelona: { latitude: 41.3879, longitude: 2.1699 },
  amsterdam: { latitude: 52.3676, longitude: 4.9041 },
  netherlands: { latitude: 52.3676, longitude: 4.9041 },
  zermatt: { latitude: 45.9763, longitude: 7.7491 },
  switzerland: { latitude: 46.8182, longitude: 8.2275 },
  swiss: { latitude: 46.8182, longitude: 8.2275 },
  zurich: { latitude: 47.3769, longitude: 8.5417 },
  geneva: { latitude: 46.2044, longitude: 6.1432 },
  amalfi: { latitude: 40.6340, longitude: 14.6027 },
  singapore: { latitude: 1.3521, longitude: 103.8198 },
  dubai: { latitude: 25.2048, longitude: 55.2708 },
  bangkok: { latitude: 13.7563, longitude: 100.5018 },
  thailand: { latitude: 13.7563, longitude: 100.5018 },
  phuket: { latitude: 7.8804, longitude: 98.3923 },
  hanoi: { latitude: 21.0285, longitude: 105.8542 },
  vietnam: { latitude: 21.0285, longitude: 105.8542 },
};

/**
 * Returns formatted GPS string, e.g. "32.2396° N, 77.1887° E"
 */
export function formatGpsCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Generates an interactive Google Maps embed URL
 */
export function getGoogleMapsEmbedUrl(
  queryOrLat: string | number,
  lng?: number,
  zoom: number = 15
): string {
  if (typeof queryOrLat === 'number' && typeof lng === 'number') {
    return `https://maps.google.com/maps?q=${queryOrLat},${lng}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }
  return `https://maps.google.com/maps?q=${encodeURIComponent(String(queryOrLat))}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
}

/**
 * Generates external GPS Navigation link for Google Maps app / web
 */
export function getNavigationUrl(
  lat: number,
  lng: number,
  placeName?: string
): string {
  if (placeName) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
      placeName
    )}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * Generates external Google Maps Search link
 */
export function getGoogleMapsSearchUrl(lat: number, lng: number, placeName?: string): string {
  if (placeName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}+${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Computes Haversine great-circle distance in kilometers
 */
export function computeDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolves GPS coordinates for a stop.
 * If stop already has lat/lng, returns them.
 * Otherwise, resolves from destination center with a deterministic spread offset.
 */
export function resolveStopCoordinates(
  stop: { latitude?: number | null; longitude?: number | null; place_id?: string | null; title: string },
  destination: string,
  index: number = 0
): GpsCoordinate {
  if (
    typeof stop.latitude === 'number' &&
    typeof stop.longitude === 'number' &&
    !isNaN(stop.latitude) &&
    !isNaN(stop.longitude) &&
    (stop.latitude !== 0 || stop.longitude !== 0)
  ) {
    return { latitude: stop.latitude, longitude: stop.longitude };
  }

  const cleanDest = (destination || '').toLowerCase().replace(/[^a-z]/g, '');

  const applyOffset = (center: GpsCoordinate): GpsCoordinate => {
    // Deterministic slight offset based on stop index so pins don't overlap exactly
    const angle = (index * 60 * Math.PI) / 180;
    const radiusKm = 0.8 + (index % 4) * 0.4;
    const dLat = (radiusKm * Math.cos(angle)) / 111.32;
    const dLng = (radiusKm * Math.sin(angle)) / (111.32 * Math.cos((center.latitude * Math.PI) / 180));
    return {
      latitude: parseFloat((center.latitude + dLat).toFixed(4)),
      longitude: parseFloat((center.longitude + dLng).toFixed(4)),
    };
  };

  // 1. Direct exact key match (highest precedence)
  if (DESTINATION_GPS_CENTERS[cleanDest]) {
    return applyOffset(DESTINATION_GPS_CENTERS[cleanDest]);
  }

  // 2. Direct exact country / regional alias map
  const ALIAS_MAP: Record<string, string> = {
    uk: 'london',
    unitedkingdom: 'london',
    england: 'london',
    britain: 'london',
    greatbritain: 'london',
    usa: 'newyork',
    us: 'newyork',
    unitedstates: 'newyork',
    america: 'newyork',
    swiss: 'switzerland',
    thai: 'bangkok',
    thailand: 'bangkok',
    in: 'delhi',
    india: 'delhi',
  };

  if (ALIAS_MAP[cleanDest] && DESTINATION_GPS_CENTERS[ALIAS_MAP[cleanDest]]) {
    return applyOffset(DESTINATION_GPS_CENTERS[ALIAS_MAP[cleanDest]]);
  }

  // 3. Check if cleanDest contains known city name (e.g. "london, uk" -> contains "london")
  for (const [key, center] of Object.entries(DESTINATION_GPS_CENTERS)) {
    if (key.length >= 3 && cleanDest.includes(key)) {
      return applyOffset(center);
    }
  }

  // 4. Safe prefix matching ONLY if cleanDest has at least 4 letters
  if (cleanDest.length >= 4) {
    for (const [key, center] of Object.entries(DESTINATION_GPS_CENTERS)) {
      if (key.startsWith(cleanDest)) {
        return applyOffset(center);
      }
    }
  }

  // Default coordinate (India centroid if unmatched)
  return { latitude: 20.5937, longitude: 78.9629 };
}
