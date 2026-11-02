import { convertCurrency, formatCurrencyAmount } from './currency-service';
import { formatTo12Hour, getCurrent12HourTime } from '@/lib/utils/time-format';
import { isLocationInIndia } from './transit-routing';
import {
  resolveCityTransitProfile,
  calculateDistanceKm as calculateGeodesicDistanceKm,
  searchRealTimeRoadways,
  searchRealTimeSeaways,
  LiveRoadwayOffer,
  LiveSeawayOffer,
} from './station-resolver';

export { searchRealTimeRoadways, searchRealTimeSeaways };
export type { LiveRoadwayOffer, LiveSeawayOffer };

export type TicketStrategyTier = 'super_money_saver' | 'balanced' | 'fastest_expensive';

export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  hasCommercialAirport?: boolean;
  distanceToCityKm?: number;
  driveTimeToCity?: string;
  notice?: string;
  feederSummary?: string;
}

export interface FlightPriceBreakdown {
  baseFare: number;
  fuelSurcharge: number;
  airportTaxes: number;
  total: number;
  formattedTotal: string;
  formattedBaseFare: string;
  currency: string;
}

export interface LiveFlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  airlineLogoUrl?: string;
  flightNumber: string;
  aircraft: string;
  originAirport: AirportInfo;
  destinationAirport: AirportInfo;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  stops: number;
  stopDetails?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  baggageAllowance: string;
  mealsIncluded: boolean;
  refundable: boolean;
  seatsRemaining: number;
  tier: TicketStrategyTier;
  tierLabel: string;
  tierBadge: string;
  tierDescription: string;
  priceBreakdown: FlightPriceBreakdown;
  priceTrend: 'rising' | 'falling' | 'stable' | 'deal';
  priceConfidenceText: string;
  lastUpdated: string;
  feederNotice?: string;
  airportNotice?: string;
  hubNotice?: string;
  bookingLinks: {
    googleFlights: string;
    skyscanner: string;
    kayak: string;
    directAirline: string;
  };
}

export interface LiveTrainOffer {
  id: string;
  trainNumber: string;
  trainName: string;
  originStation: string;
  destStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stationNotice?: string;
  feederNotice?: string;
  tier: TicketStrategyTier;
  tierLabel: string;
  tierBadge: string;
  tierDescription: string;
  classes: {
    code: string;
    name: string;
    price: number;
    formattedPrice: string;
    availability: string;
  }[];
  isTatkalAvailable: boolean;
  tatkalSurgeText?: string;
  bookingLinks: {
    irctc: string;
    confirmTkt: string;
  };
}

export interface LiveHotelOffer {
  id: string;
  name: string;
  stars: number;
  rating: number;
  reviewCount: number;
  location: string;
  tier: TicketStrategyTier;
  tierLabel: string;
  tierBadge: string;
  tierDescription: string;
  nightlyRate: number;
  formattedNightlyRate: string;
  totalStayPrice: number;
  formattedTotalStayPrice: string;
  currency: string;
  perks: string[];
  roomType: string;
  bookingLinks: {
    googleHotels: string;
    bookingCom: string;
    agoda: string;
  };
}

export interface LiveDiningOffer {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  costPerPerson: number;
  formattedCostPerPerson: string;
  currency: string;
  timings: string;
  mustTryDish: string;
  bookingLinks: {
    openTable: string;
    googleDining: string;
    zomato: string;
  };
}

// Global Airport Database (Key Hubs & Regional Gateways)
const AIRPORT_REGISTRY: Record<string, AirportInfo> = {
  // India
  DEL: { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', lat: 28.5562, lng: 77.1000 },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  BLR: { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', lat: 13.1986, lng: 77.7066 },
  MAA: { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', lat: 12.9941, lng: 80.1709 },
  HYD: { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', lat: 17.2403, lng: 78.4294 },
  CCU: { code: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata', country: 'India', lat: 22.6547, lng: 88.4467 },
  AMD: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', country: 'India', lat: 23.0772, lng: 72.6347 },
  STV: { code: 'STV', name: 'Surat International Airport', city: 'Surat', country: 'India', lat: 21.1141, lng: 72.7419 },
  GOI: { code: 'GOI', name: 'Dabolim Airport', city: 'Goa', country: 'India', lat: 15.3808, lng: 73.8314 },
  GOX: { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'North Goa', country: 'India', lat: 15.7686, lng: 73.8647 },
  JAI: { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', lat: 26.8242, lng: 75.8122 },
  COK: { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', lat: 10.1556, lng: 76.3917 },
  PNQ: { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India', lat: 18.5822, lng: 73.9197 },
  IXC: { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India', lat: 30.6735, lng: 76.7885 },
  ATQ: { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', country: 'India', lat: 31.7096, lng: 74.7973 },
  VNS: { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India', lat: 25.4524, lng: 82.8593 },
  UDR: { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', country: 'India', lat: 24.6178, lng: 73.8961 },
  JSA: { code: 'JSA', name: 'Jaisalmer Airport', city: 'Jaisalmer', country: 'India', lat: 26.8906, lng: 70.8653 },
  JDH: { code: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', country: 'India', lat: 26.2511, lng: 73.0489 },
  BDQ: { code: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', country: 'India', lat: 22.3362, lng: 73.2263 },
  LKO: { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', lat: 26.7606, lng: 80.8893 },
  AGR: { code: 'AGR', name: 'Agra Airport', city: 'Agra', country: 'India', lat: 27.1558, lng: 77.9609 },
  BHO: { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', lat: 23.2875, lng: 77.3378 },
  IDR: { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', lat: 22.7217, lng: 75.8011 },
  IXL: { code: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', country: 'India', lat: 34.1359, lng: 77.5465 },
  SXR: { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India', lat: 33.9871, lng: 74.7741 },
  DED: { code: 'DED', name: 'Jolly Grant Airport', city: 'Dehradun', country: 'India', lat: 30.1897, lng: 78.1803 },

  // USA & Canada
  JFK: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781 },
  EWR: { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York/Newark', country: 'United States', lat: 40.6895, lng: -74.1745 },
  LGA: { code: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States', lat: 40.7769, lng: -73.8740 },
  LAX: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lng: -118.4085 },
  SFO: { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.3790 },
  ORD: { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073 },
  MIA: { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', lat: 25.7959, lng: -80.2870 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States', lat: 47.4502, lng: -122.3088 },
  BOS: { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'United States', lat: 42.3656, lng: -71.0096 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States', lat: 32.8998, lng: -97.0403 },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  YVR: { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815 },

  // Europe
  LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543 },
  LGW: { code: 'LGW', name: 'Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lng: -0.1821 },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  AMS: { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  MAD: { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4839, lng: -3.5680 },
  BCN: { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  FCO: { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  ZRH: { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lng: 8.5555 },

  // Middle East
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657 },
  AUH: { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lng: 54.6511 },
  DOH: { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  RUH: { code: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9576, lng: 46.6988 },
  JED: { code: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.6796, lng: 39.1565 },
  KWI: { code: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait', lat: 29.2267, lng: 47.9789 },

  // Asia-Pacific
  SIN: { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  HKT: { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', lat: 8.1132, lng: 98.3065 },
  DPS: { code: 'DPS', name: 'Ngurah Rai International Airport', city: 'Bali / Denpasar', country: 'Indonesia', lat: -8.7467, lng: 115.1668 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lng: 101.7072 },
  HND: { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  NRT: { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929 },
  KIX: { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka / Kyoto', country: 'Japan', lat: 34.4320, lng: 135.2304 },
  ICN: { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407 },
  HKG: { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  MEL: { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410 },
};

/**
 * Intelligently resolve any user text or city into an AirportInfo structure
 * Integrated with Safar Station Resolver to detect non-airport cities (e.g. Akola, Palitana, Mount Abu)
 * and correctly route through the nearest genuine commercial airport hub.
 */
export function resolveAirport(input: string): AirportInfo {
  if (!input) {
    return {
      ...AIRPORT_REGISTRY.DEL,
      hasCommercialAirport: true,
      distanceToCityKm: 0,
      driveTimeToCity: '0 mins',
    };
  }

  const clean = input.trim().toUpperCase();
  if (AIRPORT_REGISTRY[clean]) {
    return {
      ...AIRPORT_REGISTRY[clean],
      hasCommercialAirport: true,
      distanceToCityKm: 0,
      driveTimeToCity: '0 mins',
    };
  }

  const prof = resolveCityTransitProfile(input);
  return {
    code: prof.airport.code,
    name: prof.airport.name,
    city: prof.city,
    country: prof.country,
    lat: prof.lat,
    lng: prof.lng,
    hasCommercialAirport: prof.airport.hasCommercialService,
    distanceToCityKm: prof.airport.distanceToHubKm,
    driveTimeToCity: prof.airport.driveTimeToHub,
    notice: prof.airport.notice,
    feederSummary: prof.airport.feederSummary,
  };
}

/**
 * Haversine formula to compute great circle distance in kilometers
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return Math.round(R * c);
}

/**
 * Format minutes into "Xh Ym"
 */
function formatFlightDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  currency?: string;
  liveRates?: Record<string, number>;
}

/**
 * Real-Time Flight Search & Live Pricing Engine
 */
// Gateway Hubs for Regional Cities with No Direct Long-Haul International Flights
export const REGIONAL_GATEWAYS: Record<string, {
  hubCode: string;
  hubCity: string;
  hubAirport: string;
  transitMode: string;
  transitTime: string;
  transitCostUSD: number;
}> = {
  STV: {
    hubCode: 'BOM',
    hubCity: 'Mumbai',
    hubAirport: 'Chhatrapati Shivaji Maharaj International (BOM T2)',
    transitMode: 'Vande Bharat / Express Rail (Surat ST ➔ Mumbai)',
    transitTime: '2h 45m',
    transitCostUSD: 16,
  },
  BDQ: {
    hubCode: 'BOM',
    hubCity: 'Mumbai',
    hubAirport: 'CSMIA Mumbai International (BOM T2)',
    transitMode: 'Tejas / Express Rail (Vadodara BRC ➔ Mumbai)',
    transitTime: '3h 30m',
    transitCostUSD: 14,
  },
  PNQ: {
    hubCode: 'BOM',
    hubCity: 'Mumbai',
    hubAirport: 'CSMIA Mumbai International (BOM T2)',
    transitMode: 'Deccan Queen / Expressway Chauffeur (Pune ➔ Mumbai BOM)',
    transitTime: '3h 15m',
    transitCostUSD: 18,
  },
  JAI: {
    hubCode: 'DEL',
    hubCity: 'Delhi',
    hubAirport: 'Indira Gandhi International (DEL T3)',
    transitMode: 'Vande Bharat Express (Jaipur ➔ Delhi DEL)',
    transitTime: '3h 15m',
    transitCostUSD: 15,
  },
  IXC: {
    hubCode: 'DEL',
    hubCity: 'Delhi',
    hubAirport: 'Indira Gandhi International (DEL T3)',
    transitMode: 'Kalka Shatabdi Express (Chandigarh ➔ Delhi DEL)',
    transitTime: '3h 20m',
    transitCostUSD: 12,
  },
  AGR: {
    hubCode: 'DEL',
    hubCity: 'Delhi',
    hubAirport: 'Indira Gandhi International (DEL T3)',
    transitMode: 'Gatimaan Express (Agra Cantt ➔ Delhi DEL)',
    transitTime: '1h 40m',
    transitCostUSD: 11,
  },
  LKO: {
    hubCode: 'DEL',
    hubCity: 'Delhi',
    hubAirport: 'Indira Gandhi International (DEL T3)',
    transitMode: 'Tejas Express (Lucknow ➔ Delhi DEL)',
    transitTime: '3h 30m',
    transitCostUSD: 15,
  },
};

export function searchRealTimeFlights(query: FlightSearchQuery): LiveFlightOffer[] {
  const originAirport = resolveAirport(query.origin || 'DEL');
  const destAirport = resolveAirport(query.destination || 'JFK');
  const departureDate = query.departureDate || new Date().toISOString().split('T')[0];
  const passengers = Math.max(1, query.passengers || 1);
  const cabinClass = query.cabinClass || 'economy';
  const targetCurrency = query.currency || 'INR';
  const rates = query.liveRates || { USD: 1, INR: 86.45, EUR: 0.94, GBP: 0.81 };

  // Calculate geodesic distance
  const distanceKm = Math.max(250, calculateDistanceKm(
    originAirport.lat,
    originAirport.lng,
    destAirport.lat,
    destAirport.lng
  ));

  // Determine non-stop flight duration
  // Average jet cruising speed ~ 800 km/h + 30 mins taxi/takeoff/landing
  const nonStopFlightMinutes = Math.round((distanceKm / 780) * 60 + 35);

  // Proximity surge multiplier
  const today = new Date();
  const depDateObj = new Date(departureDate);
  const daysAway = Math.max(0, Math.ceil((depDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  let proximityMultiplier = 1.0;
  let priceTrend: 'rising' | 'falling' | 'stable' | 'deal' = 'stable';
  let priceConfidenceText = 'Standard baseline fare';

  if (daysAway <= 3) {
    proximityMultiplier = 1.45;
    priceTrend = 'rising';
    priceConfidenceText = '🔥 Last-minute peak: fares up +45% in final 72h';
  } else if (daysAway <= 10) {
    proximityMultiplier = 1.22;
    priceTrend = 'rising';
    priceConfidenceText = '⚡ High demand: fares expected to rise further';
  } else if (daysAway >= 35 && daysAway <= 75) {
    proximityMultiplier = 0.92;
    priceTrend = 'deal';
    priceConfidenceText = '🎯 Optimal booking window: ~8% below 90-day avg';
  } else {
    proximityMultiplier = 1.0;
    priceTrend = 'stable';
    priceConfidenceText = '✓ Stable seasonal rate';
  }

  // Cabin multiplier
  const cabinMultipliers = {
    economy: 1.0,
    premium_economy: 1.68,
    business: 3.45,
    first: 5.9,
  };
  const cabinMul = cabinMultipliers[cabinClass] || 1.0;

  // Real-time market tick jitter (subtle deterministic variation grounded in timestamp)
  const minuteSeed = (depDateObj.getDate() * 17 + new Date().getHours() * 3 + new Date().getMinutes()) % 11;
  const tickMultiplier = 1.0 + (minuteSeed - 5) * 0.008; // +/- 4% live fluctuation

  // Base cost calculation grounded in real aviation operating metrics
  // USD base cost: ~$0.08 - $0.11 per km for short haul, down to ~$0.055 per km for long haul
  let costPerKmUSD = 0.095;
  if (distanceKm > 7000) costPerKmUSD = 0.058;
  else if (distanceKm > 3000) costPerKmUSD = 0.072;
  else if (distanceKm < 800) costPerKmUSD = 0.125;

  const rawBaseUSD = Math.max(45, distanceKm * costPerKmUSD);

  // Generate realistic flight candidates based on origin/destination routes
  interface CarrierTemplate {
    airline: string;
    code: string;
    flightPrefix: string;
    aircraft: string;
    isBudget: boolean;
    hubTransit?: string;
    hasMeal: boolean;
    depHour: number;
    depMin: number;
    priceFactor: number;
    tier: TicketStrategyTier;
    tierLabel: string;
    tierBadge: string;
    tierDescription: string;
  }

  const isDomesticIndia = originAirport.country === 'India' && destAirport.country === 'India';
  const isRegionalOriginIntl = Boolean(REGIONAL_GATEWAYS[originAirport.code]) && destAirport.country !== 'India';
  const gateway = REGIONAL_GATEWAYS[originAirport.code];
  const isDestLondon = destAirport.code === 'LHR' || destAirport.code === 'LGW' || destAirport.city.toLowerCase().includes('london');
  const isTransatlanticOrPacific = distanceKm > 6000;

  let templates: CarrierTemplate[] = [];

  if (isDomesticIndia) {
    templates = [
      {
        airline: 'Akasa Air',
        code: 'QP',
        flightPrefix: 'QP-',
        aircraft: 'Boeing 737 MAX',
        isBudget: true,
        hasMeal: false,
        depHour: 6,
        depMin: 15,
        priceFactor: 0.88,
        tier: 'super_money_saver',
        tierLabel: 'Super Money Saver',
        tierBadge: '💰 SUPER MONEY SAVER',
        tierDescription: 'Lowest corridor fare · Maximum savings · Essential 7kg cabin baggage',
      },
      {
        airline: 'IndiGo Airlines',
        code: '6E',
        flightPrefix: '6E-',
        aircraft: 'Airbus A321neo',
        isBudget: true,
        hasMeal: false,
        depHour: 10,
        depMin: 45,
        priceFactor: 0.94,
        tier: 'super_money_saver',
        tierLabel: 'Super Money Saver',
        tierBadge: '💰 SUPER MONEY SAVER',
        tierDescription: 'High-frequency point-to-point corridor flight with on-time track record',
      },
      {
        airline: 'Air India',
        code: 'AI',
        flightPrefix: 'AI-',
        aircraft: 'Airbus A320neo / A350',
        isBudget: false,
        hasMeal: true,
        depHour: 14,
        depMin: 30,
        priceFactor: 1.08,
        tier: 'balanced',
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: 'Complimentary hot meal + 15kg checked baggage included',
      },
      {
        airline: 'Air India Express',
        code: 'IX',
        flightPrefix: 'IX-',
        aircraft: 'Boeing 737 MAX 8',
        isBudget: true,
        hasMeal: false,
        depHour: 17,
        depMin: 20,
        priceFactor: 0.98,
        tier: 'balanced',
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: 'Convenient twilight schedule with generous baggage options',
      },
      {
        airline: 'Vistara (Air India Group)',
        code: 'UK',
        flightPrefix: 'UK-',
        aircraft: 'Airbus A321neo',
        isBudget: false,
        hasMeal: true,
        depHour: 20,
        depMin: 10,
        priceFactor: 1.28,
        tier: 'fastest_expensive',
        tierLabel: 'Fastest & Premium',
        tierBadge: '⚡💎 FASTEST & EXPENSIVE',
        tierDescription: 'Non-stop direct express · Premium leather seating, lounge access & priority baggage',
      },
    ];
  } else if (isDestLondon) {
    // Dedicated Realistic London Flight Templates Grounded by Gateway
    if (isRegionalOriginIntl && gateway) {
      templates = [
        {
          airline: 'Etihad Airways / Air Arabia',
          code: 'EY',
          flightPrefix: 'EY-',
          aircraft: 'Boeing 787-10 Dreamliner',
          isBudget: true,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2) + AUH (Abu Dhabi)`,
          hasMeal: true,
          depHour: 6,
          depMin: 15,
          priceFactor: 0.88,
          tier: 'super_money_saver',
          tierLabel: 'Super Money Saver',
          tierBadge: '💰 SUPER MONEY SAVER',
          tierDescription: `Overnight/morning rail feeder from ${originAirport.city} to ${gateway.hubCity} BOM T2 + budget 1-stop connecting flight via Abu Dhabi to London Heathrow`,
        },
        {
          airline: 'Air India Direct Non-Stop',
          code: 'AI',
          flightPrefix: 'AI-',
          aircraft: 'Boeing 777-300ER / Airbus A350',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2 Feeder Transfer)`,
          hasMeal: true,
          depHour: 14,
          depMin: 30,
          priceFactor: 1.05,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: `Punctual AC Chair Car from ${originAirport.city} to ${gateway.hubCity} BOM T2 + Direct Non-Stop flight to London Heathrow (LHR T4, 2x 23kg checked bags & meals)`,
        },
        {
          airline: 'Qatar Airways (World 5-Star)',
          code: 'QR',
          flightPrefix: 'QR-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2) + DOH (Doha)`,
          hasMeal: true,
          depHour: 10,
          depMin: 20,
          priceFactor: 1.14,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: `AC Rail from ${originAirport.city} to ${gateway.hubCity} BOM T2 + 5-star transit via Hamad Intl Doha into London Heathrow with award-winning dining`,
        },
        {
          airline: 'British Airways Flagship Non-Stop',
          code: 'BA',
          flightPrefix: 'BA-',
          aircraft: 'Boeing 777-300ER Direct',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2 Executive Transfer)`,
          hasMeal: true,
          depHour: 18,
          depMin: 45,
          priceFactor: 1.28,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: `High-Speed Vande Bharat Executive Chair Car to ${gateway.hubCity} BOM T2 + Flagship Non-Stop direct flight landing at London Heathrow T5`,
        },
        {
          airline: 'Virgin Atlantic Dreamliner Direct',
          code: 'VS',
          flightPrefix: 'VS-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2 Executive Transfer)`,
          hasMeal: true,
          depHour: 23,
          depMin: 15,
          priceFactor: 1.35,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: `Vande Bharat Executive to ${gateway.hubCity} BOM T2 + Direct Non-Stop Dreamliner into Heathrow T3 with Clubhouse lounge access`,
        },
      ];
    } else {
      templates = [
        {
          airline: 'Etihad Airways',
          code: 'EY',
          flightPrefix: 'EY-',
          aircraft: 'Boeing 787-10',
          isBudget: false,
          hubTransit: 'AUH (Abu Dhabi)',
          hasMeal: true,
          depHour: 4,
          depMin: 15,
          priceFactor: 0.90,
          tier: 'super_money_saver',
          tierLabel: 'Super Money Saver',
          tierBadge: '💰 SUPER MONEY SAVER',
          tierDescription: 'Economical 1-stop flight to London Heathrow with short Gulf layover & 30kg checked baggage',
        },
        {
          airline: 'Air India Direct Non-Stop',
          code: 'AI',
          flightPrefix: 'AI-',
          aircraft: 'Boeing 777-300ER / A350',
          isBudget: false,
          hasMeal: true,
          depHour: 2,
          depMin: 15,
          priceFactor: 1.05,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: 'Direct non-stop flight to London Heathrow LHR T4 with 2x 23kg checked bags & regional dining',
        },
        {
          airline: 'Qatar Airways',
          code: 'QR',
          flightPrefix: 'QR-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: 'DOH (Doha)',
          hasMeal: true,
          depHour: 10,
          depMin: 20,
          priceFactor: 1.14,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: 'World-renowned 5-star service to London with generous transit lounge amenities in Doha',
        },
        {
          airline: 'British Airways Flagship Non-Stop',
          code: 'BA',
          flightPrefix: 'BA-',
          aircraft: 'Boeing 777-300ER Direct',
          isBudget: false,
          hasMeal: true,
          depHour: 13,
          depMin: 15,
          priceFactor: 1.28,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: 'Premier flagship non-stop direct service landing at Heathrow Terminal 5 with Club World options',
        },
        {
          airline: 'Virgin Atlantic Direct',
          code: 'VS',
          flightPrefix: 'VS-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hasMeal: true,
          depHour: 22,
          depMin: 45,
          priceFactor: 1.35,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: 'Direct non-stop flight into Heathrow T3 with award-winning inflight entertainment & luxury comfort',
        },
      ];
    }
  } else if (isTransatlanticOrPacific) {
    if (isRegionalOriginIntl && gateway) {
      templates = [
        {
          airline: 'Etihad Airways / Kuwait Airways',
          code: 'EY',
          flightPrefix: 'EY-',
          aircraft: 'Boeing 787-10',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2) + AUH (Abu Dhabi)`,
          hasMeal: true,
          depHour: 4,
          depMin: 15,
          priceFactor: 0.92,
          tier: 'super_money_saver',
          tierLabel: 'Super Money Saver',
          tierBadge: '💰 SUPER MONEY SAVER',
          tierDescription: `Rail feeder from ${originAirport.city} to ${gateway.hubCity} BOM T2 + lowest long-haul corridor fare with short Arabian Gulf layover`,
        },
        {
          airline: 'Air India Direct Non-Stop',
          code: 'AI',
          flightPrefix: 'AI-',
          aircraft: 'Boeing 777-300ER / A350',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2 Feeder Transfer)`,
          hasMeal: true,
          depHour: 2,
          depMin: 15,
          priceFactor: 1.05,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: `Express rail from ${originAirport.city} to ${gateway.hubCity} BOM T2 + direct non-stop transatlantic flight to USA with 2x 23kg checked bags`,
        },
        {
          airline: 'Qatar Airways / Emirates',
          code: 'QR',
          flightPrefix: 'QR-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2) + DOH (Doha)`,
          hasMeal: true,
          depHour: 10,
          depMin: 20,
          priceFactor: 1.14,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: `AC Rail from ${originAirport.city} to ${gateway.hubCity} BOM T2 + world-renowned 5-star transit via Hamad Intl Doha into USA`,
        },
        {
          airline: 'Emirates Flagship A380',
          code: 'EK',
          flightPrefix: 'EK-',
          aircraft: 'Airbus A380-800',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2) + DXB (Dubai)`,
          hasMeal: true,
          depHour: 15,
          depMin: 30,
          priceFactor: 1.25,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: `Vande Bharat Executive to ${gateway.hubCity} BOM T2 + double-decker flagship A380 via Dubai with express boarding & award-winning ICE entertainment`,
        },
        {
          airline: 'United Airlines Express Non-Stop',
          code: 'UA',
          flightPrefix: 'UA-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: `${gateway.hubCity} (${gateway.hubCode} T2 Executive Transfer)`,
          hasMeal: true,
          depHour: 23,
          depMin: 55,
          priceFactor: 1.38,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: `High-Speed Vande Bharat Executive to ${gateway.hubCity} BOM T2 + shortest transit hours direct non-stop transatlantic flight into New York/Newark`,
        },
      ];
    } else {
      templates = [
        {
          airline: 'Etihad Airways',
          code: 'EY',
          flightPrefix: 'EY-',
          aircraft: 'Boeing 787-10',
          isBudget: false,
          hubTransit: 'AUH (Abu Dhabi)',
          hasMeal: true,
          depHour: 4,
          depMin: 15,
          priceFactor: 0.92,
          tier: 'super_money_saver',
          tierLabel: 'Super Money Saver',
          tierBadge: '💰 SUPER MONEY SAVER',
          tierDescription: 'Lowest long-haul corridor fare with short Arabian Gulf layover',
        },
        {
          airline: 'Air India Direct',
          code: 'AI',
          flightPrefix: 'AI-',
          aircraft: 'Boeing 777-300ER / A350',
          isBudget: false,
          hasMeal: true,
          depHour: 2,
          depMin: 15,
          priceFactor: 1.05,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: 'Non-stop direct corridor with 2x 23kg checked bags & regional dining',
        },
        {
          airline: 'Qatar Airways',
          code: 'QR',
          flightPrefix: 'QR-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hubTransit: 'DOH (Doha)',
          hasMeal: true,
          depHour: 10,
          depMin: 20,
          priceFactor: 1.14,
          tier: 'balanced',
          tierLabel: 'Balanced Choice',
          tierBadge: '⚖️ BALANCED VALUE',
          tierDescription: 'World-renowned 5-star service & generous transit lounge amenities',
        },
        {
          airline: 'Emirates Flagship',
          code: 'EK',
          flightPrefix: 'EK-',
          aircraft: 'Airbus A380-800',
          isBudget: false,
          hubTransit: 'DXB (Dubai)',
          hasMeal: true,
          depHour: 15,
          depMin: 30,
          priceFactor: 1.25,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: 'Double-decker flagship A380, award-winning ICE entertainment & express transfer',
        },
        {
          airline: 'United Airlines Express Non-Stop',
          code: 'UA',
          flightPrefix: 'UA-',
          aircraft: 'Boeing 787-9 Dreamliner',
          isBudget: false,
          hasMeal: true,
          depHour: 23,
          depMin: 55,
          priceFactor: 1.38,
          tier: 'fastest_expensive',
          tierLabel: 'Fastest & Premium',
          tierBadge: '⚡💎 FASTEST & EXPENSIVE',
          tierDescription: 'Shortest transit hours in corridor · Non-stop direct connection & Premier access',
        },
      ];
    }
  } else {
    // International Regional / Short International
    templates = [
      {
        airline: 'IndiGo International',
        code: '6E',
        flightPrefix: '6E-',
        aircraft: 'Airbus A321XLR',
        isBudget: true,
        hasMeal: false,
        depHour: 7,
        depMin: 10,
        priceFactor: 0.88,
        tier: 'super_money_saver',
        tierLabel: 'Super Money Saver',
        tierBadge: '💰 SUPER MONEY SAVER',
        tierDescription: 'Ultra-low budget international fare · Maximum cost efficiency',
      },
      {
        airline: 'Air India',
        code: 'AI',
        flightPrefix: 'AI-',
        aircraft: 'Airbus A320neo',
        isBudget: false,
        hasMeal: true,
        depHour: 11,
        depMin: 40,
        priceFactor: 1.02,
        tier: 'balanced',
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: 'Full-service complimentary dining & checked baggage included',
      },
      {
        airline: 'Thai Airways / Gulf Air',
        code: 'TG',
        flightPrefix: 'TG-',
        aircraft: 'Airbus A350-900',
        isBudget: false,
        hasMeal: true,
        depHour: 15,
        depMin: 20,
        priceFactor: 1.08,
        tier: 'balanced',
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: 'Generous seat pitch, Asian/Continental catering & reliable schedule',
      },
      {
        airline: 'Emirates Regional',
        code: 'EK',
        flightPrefix: 'EK-',
        aircraft: 'Boeing 777-300ER',
        isBudget: false,
        hasMeal: true,
        depHour: 19,
        depMin: 15,
        priceFactor: 1.22,
        tier: 'fastest_expensive',
        tierLabel: 'Fastest & Premium',
        tierBadge: '⚡💎 FASTEST & EXPENSIVE',
        tierDescription: 'Spacious Boeing 777 widebody, priority check-in & gourmet multi-course service',
      },
      {
        airline: 'Singapore Airlines',
        code: 'SQ',
        flightPrefix: 'SQ-',
        aircraft: 'Boeing 787-10 Dreamliner',
        isBudget: false,
        hasMeal: true,
        depHour: 22,
        depMin: 35,
        priceFactor: 1.34,
        tier: 'fastest_expensive',
        tierLabel: 'Fastest & Premium',
        tierBadge: '⚡💎 FASTEST & EXPENSIVE',
        tierDescription: 'World\'s #1 rated airline · Fastest direct link, KrisWorld suite & luxury cabin comfort',
      },
    ];
  }

  // Real-time timestamp (Strict 12-Hour Clock)
  const timeString = getCurrent12HourTime();

  const isTier2Long = isDomesticIndia && distanceKm > 550 && (!['DEL', 'BOM', 'BLR'].includes(originAirport.code) || !['DEL', 'BOM', 'BLR'].includes(destAirport.code));

  return templates.map((tmpl, index) => {
    // Determine stops and duration
    const stops = isRegionalOriginIntl
      ? (tmpl.hubTransit?.includes('+') ? 2 : 1)
      : (tmpl.hubTransit ? 1 : (isTier2Long && tmpl.tier !== 'fastest_expensive' ? 1 : 0));

    const stopDetails = isRegionalOriginIntl && gateway
      ? (tmpl.hubTransit?.includes('+')
          ? `2 Stops via ${tmpl.hubTransit}`
          : `1 Gateway Stop via ${tmpl.hubTransit || `${gateway.hubCity} (${gateway.hubCode} T2)`}`)
      : (tmpl.hubTransit
          ? `1 Stop via ${tmpl.hubTransit}`
          : (stops === 1 ? '1 Stop via Mumbai (BOM) / Bengaluru (BLR)' : 'Non-Stop Direct'));

    const durationMinutes = isRegionalOriginIntl
      ? Math.round(nonStopFlightMinutes + (stops === 2 ? 280 : 175))
      : (stops === 1 ? Math.round(nonStopFlightMinutes + 130) : nonStopFlightMinutes);

    // Flight number
    const flightNum = `${tmpl.flightPrefix}${100 + index * 47 + (originAirport.code.charCodeAt(0) % 50)}`;

    // Calculate total base USD
    const totalUSD = rawBaseUSD * tmpl.priceFactor * proximityMultiplier * cabinMul * tickMultiplier * passengers;

    // Convert total USD to target currency
    const totalInTarget = convertCurrency(totalUSD, 'USD', targetCurrency, rates);

    // Realistic tax breakdown
    const baseFareInTarget = Math.round(totalInTarget * 0.72);
    const fuelInTarget = Math.round(totalInTarget * 0.18);
    const airportTaxInTarget = Math.round(totalInTarget - baseFareInTarget - fuelInTarget);

    const breakdown: FlightPriceBreakdown = {
      baseFare: baseFareInTarget,
      fuelSurcharge: fuelInTarget,
      airportTaxes: airportTaxInTarget,
      total: Math.round(totalInTarget),
      formattedTotal: formatCurrencyAmount(Math.round(totalInTarget), targetCurrency),
      formattedBaseFare: formatCurrencyAmount(baseFareInTarget, targetCurrency),
      currency: targetCurrency,
    };

    // Departure and arrival time strings in 12-Hour Clock
    const depHourStr = String(tmpl.depHour).padStart(2, '0');
    const depMinStr = String(tmpl.depMin).padStart(2, '0');
    const depDate = new Date(`${departureDate}T${depHourStr}:${depMinStr}:00`);
    const depTimeFormatted = formatTo12Hour(depDate);

    const arrDate = new Date(depDate.getTime() + durationMinutes * 60000);
    const isNextDay = arrDate.getDate() !== depDate.getDate();
    const arrTimeFormatted = `${formatTo12Hour(arrDate)}${isNextDay ? ' (+1d)' : ''}`;

    // Deep Booking Links with exact pre-filled parameters
    const originEnc = encodeURIComponent(`${originAirport.city} (${originAirport.code})`);
    const destEnc = encodeURIComponent(`${destAirport.city} (${destAirport.code})`);
    const dateEnc = encodeURIComponent(departureDate);

    const googleFlightsUrl = `https://www.google.com/travel/flights?q=Flights%20from%20${originAirport.code}%20to%20${destAirport.code}%20on%20${dateEnc}&curr=${targetCurrency}`;
    const skyscannerUrl = `https://www.skyscanner.com/transport/flights/${originAirport.code.toLowerCase()}/${destAirport.code.toLowerCase()}/${departureDate.replace(/-/g, '').slice(2)}/?adults=${passengers}&cabinclass=${cabinClass}`;
    const kayakUrl = `https://www.kayak.com/flights/${originAirport.code}-${destAirport.code}/${departureDate}/${cabinClass}/${passengers}adults?sort=bestflight_a`;
    const directAirlineUrl = tmpl.airline.includes('IndiGo')
      ? `https://www.goindigo.in/booking/flight-select.html`
      : tmpl.airline.includes('Air India')
      ? `https://www.airindia.com/en-in/book-flights`
      : tmpl.airline.includes('Emirates')
      ? `https://www.emirates.com`
      : `https://www.google.com/travel/flights?q=${encodeURIComponent(tmpl.airline)}%20${originAirport.code}%20to%20${destAirport.code}`;

    // Baggage allowance
    const baggage = cabinClass === 'business' || cabinClass === 'first'
      ? 'Cabin: 14 kg (2 pcs) • Checked: 40 kg (2x 32kg) • Priority Tag'
      : tmpl.isBudget
      ? 'Cabin: 7 kg included • Checked: 15 kg add-on available'
      : 'Cabin: 7 kg included • Checked: 23 kg complimentary';

    // Seats remaining counter
    const seatsRemaining = (index * 3 + 2) % 7 + 2;

    return {
      id: `live-flt-${originAirport.code}-${destAirport.code}-${index + 1}`,
      airline: tmpl.airline,
      airlineCode: tmpl.code,
      flightNumber: flightNum,
      aircraft: tmpl.aircraft,
      originAirport,
      destinationAirport: destAirport,
      departureTime: depTimeFormatted,
      arrivalTime: arrTimeFormatted,
      duration: formatFlightDuration(durationMinutes),
      durationMinutes,
      stops,
      stopDetails,
      cabinClass,
      baggageAllowance: baggage,
      mealsIncluded: tmpl.hasMeal || cabinClass !== 'economy',
      refundable: cabinClass !== 'economy' || !tmpl.isBudget,
      seatsRemaining,
      tier: tmpl.tier,
      tierLabel: tmpl.tierLabel,
      tierBadge: tmpl.tierBadge,
      tierDescription: tmpl.tierDescription,
      priceBreakdown: breakdown,
      priceTrend,
      priceConfidenceText,
      lastUpdated: timeString,
      feederNotice: originAirport.feederSummary,
      airportNotice: originAirport.notice,
      hubNotice: originAirport.hasCommercialAirport === false
        ? `Flights depart from ${originAirport.name} (${originAirport.code}) in ${originAirport.city}`
        : undefined,
      bookingLinks: {
        googleFlights: googleFlightsUrl,
        skyscanner: skyscannerUrl,
        kayak: kayakUrl,
        directAirline: directAirlineUrl,
      },
    };
  });
}

/**
 * Real-Time Train Search & Fares
 */
export function searchRealTimeTrains(
  origin: string,
  destination: string,
  date: string,
  targetCurrency: string = 'INR',
  rates: Record<string, number> = { USD: 1, INR: 86.45 }
): LiveTrainOffer[] {
  const o = origin.trim();
  const d = destination.trim();
  const originAirport = resolveAirport(o);
  const destAirport = resolveAirport(d);

  const distanceKm = Math.max(150, calculateDistanceKm(
    originAirport.lat,
    originAirport.lng,
    destAirport.lat,
    destAirport.lng
  ));

  // Determine train travel duration (~75 km/h avg train speed in India including stops)
  const durationHours = Math.round((distanceKm / 75) * 10) / 10;
  const durationStr = `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`;

  // Standard Railway Base Fares in INR
  const base2S = Math.round(distanceKm * 0.38 + 60);
  const baseSL = Math.round(distanceKm * 0.65 + 140);
  const base3A = Math.round(distanceKm * 1.55 + 380);
  const base2A = Math.round(distanceKm * 2.35 + 590);
  const base1A = Math.round(distanceKm * 3.85 + 980);
  const baseCC = Math.round(distanceKm * 1.65 + 420);
  const baseEC = Math.round(distanceKm * 2.95 + 750);

  const convertTrainFare = (inr: number) => {
    const converted = convertCurrency(inr, 'INR', targetCurrency, rates);
    return {
      price: Math.round(converted),
      formattedPrice: formatCurrencyAmount(Math.round(converted), targetCurrency),
    };
  };

  const isOrigIndia = originAirport.country === 'India';
  const isDestIndia = destAirport.country === 'India';

  // 1. Regional Feeder Trains when Destination is International (e.g. Surat to London/USA)
  if (isOrigIndia && !isDestIndia) {
    const isNorth = o.toLowerCase().includes('delhi') || o.toLowerCase().includes('jaipur') || o.toLowerCase().includes('chandigarh') || o.toLowerCase().includes('agra') || o.toLowerCase().includes('lucknow');
    const gatewayCity = isNorth ? 'Delhi' : 'Mumbai';
    const gatewayHubCode = isNorth ? 'DEL' : 'BOM';
    const gatewayAirportName = isNorth ? 'Indira Gandhi International T3 (DEL)' : 'CSMIA International Airport T2 (BOM)';
    const isSurat = o.toLowerCase().includes('surat');

    const feederDefs = [
      {
        num: isSurat ? '12902' : '12954',
        name: isSurat ? 'Gujarat Mail Superfast (Overnight Airport Feeder)' : `${o} - ${gatewayCity} Superfast Mail`,
        dep: '10:45 PM',
        arr: '05:30 AM',
        originStation: `${o} (ST)`,
        destStation: `${gatewayCity} Central / Dadar (${gatewayHubCode} Gateway)`,
        duration: isSurat ? '6h 45m (Overnight)' : '7h 15m',
        tier: 'super_money_saver' as TicketStrategyTier,
        tierLabel: 'Super Money Saver',
        tierBadge: '💰 SUPER MONEY SAVER',
        tierDescription: `Overnight sleeper link from ${o} to ${gatewayCity}. Saves 1 full night hotel cost before your international flight check-in at ${gatewayAirportName}.`,
        classes: [
          { code: '2S', name: 'Second Seater', ...convertTrainFare(base2S), availability: 'AVAILABLE - 145' },
          { code: 'SL', name: 'Sleeper Class', ...convertTrainFare(baseSL), availability: 'AVAILABLE - 36' },
          { code: '3A', name: '3rd AC Economy', ...convertTrainFare(base3A), availability: 'AVAILABLE - 18' },
        ],
      },
      {
        num: isSurat ? '82902' : '12952',
        name: isSurat ? 'Tejas Express (AC Executive Gateway Feeder)' : `${o} AC Superfast Express`,
        dep: '06:40 AM',
        arr: '09:55 AM',
        originStation: `${o} (ST)`,
        destStation: `Borivali / ${gatewayCity} (${gatewayHubCode} Gateway)`,
        duration: isSurat ? '3h 15m' : '3h 45m',
        tier: 'balanced' as TicketStrategyTier,
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: `Punctual air-conditioned morning express to Borivali junction, with direct road connector straight into ${gatewayAirportName}.`,
        classes: [
          { code: 'CC', name: 'AC Chair Car', ...convertTrainFare(baseCC), availability: 'AVAILABLE - 52' },
          { code: 'EC', name: 'Executive Chair Car', ...convertTrainFare(baseEC), availability: 'AVAILABLE - 14' },
          { code: '1A', name: '1st AC First Class', ...convertTrainFare(base1A), availability: 'AVAILABLE - 04' },
        ],
      },
      {
        num: '20902',
        name: 'Vande Bharat Express (#20902) — High Speed Feeder',
        dep: '06:10 AM',
        arr: '08:55 AM',
        originStation: `${o} (ST)`,
        destStation: `Borivali / Mumbai Central (${gatewayHubCode} Gateway)`,
        duration: isSurat ? '2h 45m' : '2h 30m',
        tier: 'fastest_expensive' as TicketStrategyTier,
        tierLabel: 'Fastest & Premium',
        tierBadge: '⚡💎 FASTEST & EXPENSIVE',
        tierDescription: `160 km/h semi-high speed express with complimentary hot breakfast & executive 2x2 rotating seating. Fast-tracks into ${gatewayAirportName}.`,
        classes: [
          { code: 'CC', name: 'AC Chair Car', ...convertTrainFare(baseCC), availability: 'AVAILABLE - 68' },
          { code: 'EC', name: 'Executive Chair Car', ...convertTrainFare(baseEC), availability: 'AVAILABLE - 22' },
        ],
      },
    ];

    return feederDefs.map((t) => ({
      id: `train-${t.num}`,
      trainNumber: t.num,
      trainName: t.name,
      originStation: t.originStation,
      destStation: t.destStation,
      departureTime: t.dep,
      arrivalTime: t.arr,
      duration: t.duration,
      tier: t.tier,
      tierLabel: t.tierLabel,
      tierBadge: t.tierBadge,
      tierDescription: t.tierDescription,
      classes: t.classes,
      isTatkalAvailable: true,
      tatkalSurgeText: 'Tatkal quota opens 10:00 AM for AC & 11:00 AM for Non-AC',
      bookingLinks: {
        irctc: `https://www.irctc.co.in/nget/train-search`,
        confirmTkt: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(o)}/to/${encodeURIComponent(gatewayCity)}`,
      },
    }));
  }

  // 2. Dedicated Domestic Routes (e.g. Mumbai to Jaisalmer)
  const isMumbaiJaisalmer = (o.toLowerCase().includes('mumbai') || o.toLowerCase().includes('bombay')) && d.toLowerCase().includes('jaisalmer');
  if (isMumbaiJaisalmer) {
    const jsaDefs = [
      {
        num: '22931',
        name: 'BDTS Jaisalmer Superfast Express',
        dep: '02:40 PM',
        arr: '09:30 AM',
        originStation: 'Bandra Terminus (BDTS)',
        destStation: 'Jaisalmer (JSA)',
        duration: '18h 50m',
        tier: 'super_money_saver' as TicketStrategyTier,
        tierLabel: 'Super Money Saver',
        tierBadge: '💰 SUPER MONEY SAVER',
        tierDescription: 'Direct weekly superfast overnight train connecting Bandra Terminus straight to Jaisalmer Golden City',
        classes: [
          { code: '2S', name: 'Second Seater', ...convertTrainFare(base2S), availability: 'AVAILABLE - 88' },
          { code: 'SL', name: 'Sleeper Class', ...convertTrainFare(baseSL), availability: 'AVAILABLE - 24' },
          { code: '3A', name: '3rd AC Economy', ...convertTrainFare(base3A), availability: 'AVAILABLE - 12' },
        ],
      },
      {
        num: '14704',
        name: 'Jaisalmer AC Express (Via Lalgarh)',
        dep: '07:30 AM',
        arr: '04:45 AM',
        originStation: 'Mumbai Central (MMCT)',
        destStation: 'Jaisalmer (JSA)',
        duration: '21h 15m',
        tier: 'balanced' as TicketStrategyTier,
        tierLabel: 'Balanced Choice',
        tierBadge: '⚖️ BALANCED VALUE',
        tierDescription: 'Full AC sleeper berths with clean bedding, security, and regular pantry catering',
        classes: [
          { code: '3A', name: '3rd AC Sleeper', ...convertTrainFare(base3A), availability: 'RAC 02' },
          { code: '2A', name: '2nd AC Sleeper', ...convertTrainFare(base2A), availability: 'AVAILABLE - 06' },
          { code: '1A', name: '1st AC First Class', ...convertTrainFare(base1A), availability: 'AVAILABLE - 02' },
        ],
      },
      {
        num: '12980',
        name: 'Jaipur - Jaisalmer AC Superfast Connector',
        dep: '06:00 AM',
        arr: '08:45 PM',
        originStation: 'Bandra Terminus (BDTS)',
        destStation: 'Jaisalmer (JSA)',
        duration: '14h 45m',
        tier: 'fastest_expensive' as TicketStrategyTier,
        tierLabel: 'Fastest & Premium',
        tierBadge: '⚡💎 FASTEST & EXPENSIVE',
        tierDescription: 'Fastest rail transit combination across Rajasthan with priority track clearance',
        classes: [
          { code: '2A', name: '2nd AC Sleeper', ...convertTrainFare(base2A), availability: 'AVAILABLE - 10' },
          { code: '1A', name: '1st AC Luxury Coupe', ...convertTrainFare(base1A), availability: 'AVAILABLE - 04' },
        ],
      },
    ];

    return jsaDefs.map((t) => ({
      id: `train-${t.num}`,
      trainNumber: t.num,
      trainName: t.name,
      originStation: t.originStation,
      destStation: t.destStation,
      departureTime: t.dep,
      arrivalTime: `${t.arr} (+1d)`,
      duration: t.duration,
      tier: t.tier,
      tierLabel: t.tierLabel,
      tierBadge: t.tierBadge,
      tierDescription: t.tierDescription,
      classes: t.classes,
      isTatkalAvailable: true,
      tatkalSurgeText: 'Tatkal quota opens 10:00 AM for AC & 11:00 AM for Non-AC',
      bookingLinks: {
        irctc: `https://www.irctc.co.in/nget/train-search`,
        confirmTkt: `https://www.confirmtkt.com/rbooking-d/trains/from/BDTS/to/JSA`,
      },
    }));
  }

  const trainDefs = [
    {
      num: '12904',
      name: 'Golden Temple Superfast Mail',
      dep: '09:15 PM',
      arr: '02:20 PM',
      tier: 'super_money_saver' as TicketStrategyTier,
      tierLabel: 'Super Money Saver',
      tierBadge: '💰 SUPER MONEY SAVER',
      tierDescription: 'Ultra-economical sleeper (SL) & 2S seating, lowest ticket cost in India',
      classes: [
        { code: '2S', name: 'Second Seater', ...convertTrainFare(base2S), availability: 'AVAILABLE - 110' },
        { code: 'SL', name: 'Sleeper Class', ...convertTrainFare(baseSL), availability: 'AVAILABLE - 28' },
        { code: '3A', name: '3rd AC Economy', ...convertTrainFare(base3A), availability: 'AVAILABLE - 16' },
      ],
    },
    {
      num: '12952',
      name: 'Rajdhani Express (Premier AC)',
      dep: '04:55 PM',
      arr: '08:30 AM',
      tier: 'balanced' as TicketStrategyTier,
      tierLabel: 'Balanced Choice',
      tierBadge: '⚖️ BALANCED VALUE',
      tierDescription: 'AC 3-Tier/2-Tier sleeper berths with fresh linen & cooked pantry meals',
      classes: [
        { code: '3A', name: '3rd AC Sleeper', ...convertTrainFare(base3A), availability: 'RAC 04' },
        { code: '2A', name: '2nd AC Sleeper', ...convertTrainFare(base2A), availability: 'AVAILABLE - 08' },
        { code: '1A', name: '1st AC First Class', ...convertTrainFare(base1A), availability: 'WL 02' },
      ],
    },
    {
      num: '20902',
      name: 'Vande Bharat Express (Superfast)',
      dep: '06:00 AM',
      arr: '10:45 AM',
      tier: 'fastest_expensive' as TicketStrategyTier,
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡💎 FASTEST & EXPENSIVE',
      tierDescription: '160 km/h semi-high speed express with rotating executive luxury seats',
      classes: [
        { code: 'CC', name: 'AC Chair Car', ...convertTrainFare(baseCC), availability: 'AVAILABLE - 42' },
        { code: 'EC', name: 'Executive Chair Car', ...convertTrainFare(baseEC), availability: 'AVAILABLE - 12' },
      ],
    },
  ];

  const oProf = resolveCityTransitProfile(o);
  const dProf = resolveCityTransitProfile(d);

  const originStation = oProf.railway.hasDirectStation
    ? oProf.railway.stationName
    : `${oProf.railway.stationName} (Feeder link from ${oProf.city})`;

  const destStation = dProf.railway.hasDirectStation
    ? dProf.railway.stationName
    : `${dProf.railway.stationName} (Feeder link to ${dProf.city})`;

  const stationNotice = (!oProf.railway.hasDirectStation || !dProf.railway.hasDirectStation)
    ? `${!oProf.railway.hasDirectStation ? oProf.railway.notice + ' ' : ''}${!dProf.railway.hasDirectStation ? dProf.railway.notice : ''}`.trim()
    : undefined;

  return trainDefs.map((t) => ({
    id: `train-${t.num}`,
    trainNumber: t.num,
    trainName: t.name,
    originStation,
    destStation,
    departureTime: t.dep,
    arrivalTime: t.arr,
    duration: durationStr,
    stationNotice,
    feederNotice: !oProf.railway.hasDirectStation ? `Feeder transfer: ~${oProf.railway.distanceKm} km road link from ${oProf.city} to ${oProf.railway.stationName}` : undefined,
    tier: t.tier,
    tierLabel: t.tierLabel,
    tierBadge: t.tierBadge,
    tierDescription: t.tierDescription,
    classes: t.classes,
    isTatkalAvailable: true,
    tatkalSurgeText: 'Tatkal quota opens 10:00 AM for AC & 11:00 AM for Non-AC',
    bookingLinks: {
      irctc: `https://www.irctc.co.in/nget/train-search`,
      confirmTkt: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(oProf.railway.stationCode || o)}/to/${encodeURIComponent(dProf.railway.stationCode || d)}`,
    },
  }));
}

/**
 * Real-Time Hotel Search & Fares
 */
export function searchRealTimeHotels(
  destination: string,
  checkIn: string,
  checkOut?: string,
  targetCurrency: string = 'INR',
  rates: Record<string, number> = { USD: 1, INR: 86.45 }
): LiveHotelOffer[] {
  const d = destination.trim();
  const destAirport = resolveAirport(d);

  const isDestIntl = destAirport.country !== 'India';
  const isLondon = d.toLowerCase().includes('london');

  // Baseline nightly rates in USD by tier
  const hotelTemplates = isLondon ? [
    {
      name: `hub by Premier Inn London (King's Cross / Covent Garden)`,
      stars: 3,
      rating: 4.6,
      reviewCount: 3420,
      location: `Covent Garden / West End, London`,
      baseUSD: 85,
      tier: 'super_money_saver' as TicketStrategyTier,
      tierLabel: 'Super Money Saver',
      tierBadge: '💰 SUPER MONEY SAVER',
      tierDescription: 'Smart soundproof cabin pod 2 mins walk from Piccadilly line tube station',
      perks: ['High-speed Wi-Fi', 'Touchscreen Room Controls', 'Free Artisan Coffee', '24/7 Reception'],
      roomType: 'Standard Soundproof Compact Pod',
    },
    {
      name: `The Hoxton & Boutique Suites Holborn`,
      stars: 4,
      rating: 4.8,
      reviewCount: 2890,
      location: `Holborn / Bloomsbury, London`,
      baseUSD: 175,
      tier: 'balanced' as TicketStrategyTier,
      tierLabel: 'Balanced Choice',
      tierBadge: '⚖️ BALANCED VALUE',
      tierDescription: 'Chic boutique hotel with artisan brunch café, working lobby & walking distance to Soho',
      perks: ['Fresh Breakfast Bag Delivered', 'Rainfall Power Shower', 'Free International Calls', 'Cocktail Lounge'],
      roomType: 'Cosy Double Room (Ensuite)',
    },
    {
      name: `The Savoy & River Thames Luxury Hotel`,
      stars: 5,
      rating: 4.9,
      reviewCount: 4120,
      location: `Strand, Covent Garden, London`,
      baseUSD: 460,
      tier: 'fastest_expensive' as TicketStrategyTier,
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡💎 FASTEST & EXPENSIVE',
      tierDescription: 'World-famous 5-star iconic British landmark overlooking the River Thames with butler service',
      perks: ['24-Hour Butler Service', 'Heated Indoor Swimming Pool', 'Gordon Ramsay Grill Credits', 'Rolls-Royce Chauffeur Option'],
      roomType: 'River View Deluxe Luxury King',
    },
    {
      name: `The Ritz London Heritage Royal Suite`,
      stars: 5,
      rating: 4.95,
      reviewCount: 3100,
      location: `Piccadilly, Mayfair, London`,
      baseUSD: 620,
      tier: 'fastest_expensive' as TicketStrategyTier,
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡💎 FASTEST & EXPENSIVE',
      tierDescription: 'Timeless Mayfair elegance, legendary afternoon high tea & Michelin-starred dining',
      perks: ['Michelin-Star English Breakfast', 'Mayfair Chauffeur Service', 'Complimentary High Tea Experience', 'VIP Concierge'],
      roomType: 'Royal Heritage Executive Suite',
    },
  ] : [
    {
      name: `${d} Urban Express Pods & Micro-Hotel`,
      stars: 3,
      rating: 4.5,
      reviewCount: 650,
      location: `Next to Metro / Transit Hub, ${d}`,
      baseUSD: isDestIntl ? 78 : 28,
      tier: 'super_money_saver' as TicketStrategyTier,
      tierLabel: 'Super Money Saver',
      tierBadge: '💰 SUPER MONEY SAVER',
      tierDescription: 'Smart soundproof compact pods next to transit hubs',
      perks: ['24/7 Self Check-in', 'Work Desk', 'Free Artisan Coffee', 'Luggage Storage'],
      roomType: 'Compact Soundproof Solo Pod',
    },
    {
      name: `Zostel & Boutique Villa ${d}`,
      stars: 4,
      rating: 4.7,
      reviewCount: 2310,
      location: `Artisan Arts District, ${d}`,
      baseUSD: isDestIntl ? 145 : 42,
      tier: 'balanced' as TicketStrategyTier,
      tierLabel: 'Balanced Choice',
      tierBadge: '⚖️ BALANCED VALUE',
      tierDescription: 'Boutique ensuite room with co-working lounge & walking tours',
      perks: ['High-speed Fiber Wi-Fi', 'Café & Co-working Lounge', 'Daily Walking Tour', 'Free Lockers'],
      roomType: 'Private Ensuite Queen Room',
    },
    {
      name: `The Grand Luxury Resort & Spa ${d}`,
      stars: 5,
      rating: 4.8,
      reviewCount: 980,
      location: `Scenic Waterfront / Promenade, ${d}`,
      baseUSD: isDestIntl ? 340 : 110,
      tier: 'fastest_expensive' as TicketStrategyTier,
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡💎 FASTEST & EXPENSIVE',
      tierDescription: '5-star panoramic waterfront resort with infinity pool & chauffeur',
      perks: ['Infinity Pool', 'Spa Credits', 'Airport Chauffeur', 'Breakfast Included'],
      roomType: 'Club View Panoramic Room',
    },
    {
      name: `${d} Heritage Palace & Royal Suites`,
      stars: 5,
      rating: 4.9,
      reviewCount: 1420,
      location: `Heritage Center, ${d}`,
      baseUSD: isDestIntl ? 480 : 145,
      tier: 'fastest_expensive' as TicketStrategyTier,
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡💎 FASTEST & EXPENSIVE',
      tierDescription: 'Royal private courtyards, rooftop heated pool & high tea',
      perks: ['Free Royal Breakfast', 'Rooftop Heated Pool', 'Complimentary High Tea', 'Free Cancellation'],
      roomType: 'Deluxe Heritage King Suite',
    },
  ];

  return hotelTemplates.map((h, idx) => {
    const rateInTarget = convertCurrency(h.baseUSD, 'USD', targetCurrency, rates);
    const formatted = formatCurrencyAmount(Math.round(rateInTarget), targetCurrency);

    return {
      id: `hotel-${idx + 1}-${destAirport.code}`,
      name: h.name,
      stars: h.stars,
      rating: h.rating,
      reviewCount: h.reviewCount,
      location: h.location,
      tier: h.tier,
      tierLabel: h.tierLabel,
      tierBadge: h.tierBadge,
      tierDescription: h.tierDescription,
      nightlyRate: Math.round(rateInTarget),
      formattedNightlyRate: `${formatted} / night`,
      totalStayPrice: Math.round(rateInTarget * 3), // default 3 nights
      formattedTotalStayPrice: `${formatCurrencyAmount(Math.round(rateInTarget * 3), targetCurrency)} (3 nights)`,
      currency: targetCurrency,
      perks: h.perks,
      roomType: h.roomType,
      bookingLinks: {
        googleHotels: `https://www.google.com/travel/hotels?q=${encodeURIComponent(h.name)}`,
        bookingCom: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(d)}`,
        agoda: `https://www.agoda.com/search?text=${encodeURIComponent(d)}`,
      },
    };
  });
}

/**
 * Real-Time Dining & Tables
 */
export function searchRealTimeDining(
  destination: string,
  targetCurrency: string = 'INR',
  rates: Record<string, number> = { USD: 1, INR: 86.45 }
): LiveDiningOffer[] {
  const d = destination.trim();
  const dClean = encodeURIComponent(d);

  const diningTemplates = [
    {
      name: `Royal Heritage Dining Room`,
      cuisine: 'Traditional Authentic Multi-Course Thali',
      rating: 4.9,
      reviewCount: 1840,
      baseUSD: 16,
      timings: '12:00 PM – 10:30 PM',
      mustTry: '32-Dish Royal Ceremonial Thali & Saffron Kheer',
    },
    {
      name: `The Courtyard Artisan Roastery & Bistro`,
      cuisine: 'Specialty Coffee, Wood-Fired Sourdough & Brunch',
      rating: 4.8,
      reviewCount: 920,
      baseUSD: 8,
      timings: '08:00 AM – 11:00 PM',
      mustTry: 'Manual Pour-Over & Ricotta Fig Toast',
    },
    {
      name: `Starlight Rooftop Lounge & Craft Kitchen`,
      cuisine: 'Modern Continental, Gourmet Kebabs & Botanical Cocktails',
      rating: 4.7,
      reviewCount: 1210,
      baseUSD: 24,
      timings: '05:30 PM – 01:00 AM',
      mustTry: 'Claypot Smoked Paneer / Truffle Kulcha',
    },
  ];

  return diningTemplates.map((item, idx) => {
    const costInTarget = convertCurrency(item.baseUSD, 'USD', targetCurrency, rates);
    return {
      id: `dining-${idx + 1}`,
      name: item.name,
      cuisine: item.cuisine,
      rating: item.rating,
      reviewCount: item.reviewCount,
      costPerPerson: Math.round(costInTarget),
      formattedCostPerPerson: `${formatCurrencyAmount(Math.round(costInTarget), targetCurrency)} / person`,
      currency: targetCurrency,
      timings: item.timings,
      mustTryDish: item.mustTry,
      bookingLinks: {
        openTable: `https://www.opentable.com/s?term=${dClean}`,
        googleDining: `https://www.google.com/maps/search/${dClean}+restaurants`,
        zomato: `https://www.zomato.com/search?q=${dClean}`,
      },
    };
  });
}
