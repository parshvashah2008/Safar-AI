/**
 * Real-Time Gemini Dual Route Intelligence (Budget vs Time-Saving Route)
 * Uses Google Gemini AI in real time to calculate and compare:
 * 1. Budget Route (Maximum money savings, budget trains/flights, shared transit)
 * 2. Time-Saving Route (Fastest transit hours, non-stop flights, high-speed rail)
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { requireGeminiKey, getGeminiModel } from '@/lib/config';
import { convertCurrency, formatCurrencyAmount } from './currency-service';
import { analyzeTransitRoute, isLocationInIndia, getNearestTransitHub } from './transit-routing';
import { getCurrent12HourTime } from '@/lib/utils/time-format';

export interface RouteLeg {
  step: number;
  mode: 'flight' | 'train' | 'drive' | 'transit' | 'local';
  from: string;
  to: string;
  duration: string;
  carrier: string;
  estimatedCost: number;
  formattedCost: string;
  advice: string;
  bookingUrl?: string;
  bookingLabel?: string;
  secondaryBookingUrl?: string;
  secondaryBookingLabel?: string;
}

/**
 * Creates direct, actionable booking links for any transit leg
 */
export function createLegBookingLinks(
  mode: 'flight' | 'train' | 'drive' | 'transit' | 'local',
  from: string,
  to: string,
  carrier: string = '',
  departureDate?: string,
  currency: string = 'INR'
): { bookingUrl: string; bookingLabel: string; secondaryBookingUrl?: string; secondaryBookingLabel?: string } {
  const depDate = departureDate || new Date().toISOString().split('T')[0];
  const cleanFrom = from.replace(/\(.*?\)/g, '').trim();
  const cleanTo = to.replace(/\(.*?\)/g, '').trim();

  if (mode === 'flight') {
    const flightQuery = encodeURIComponent(`Flights from ${cleanFrom} to ${cleanTo} on ${depDate}`);
    const directUrl = carrier.toLowerCase().includes('swiss')
      ? 'https://www.swiss.com'
      : carrier.toLowerCase().includes('air india')
      ? 'https://www.airindia.com/en-in/book-flights'
      : carrier.toLowerCase().includes('british airways')
      ? 'https://www.britishairways.com'
      : carrier.toLowerCase().includes('etihad')
      ? 'https://www.etihad.com'
      : carrier.toLowerCase().includes('emirates')
      ? 'https://www.emirates.com'
      : carrier.toLowerCase().includes('lufthansa')
      ? 'https://www.lufthansa.com'
      : carrier.toLowerCase().includes('qatar')
      ? 'https://www.qatarairways.com'
      : carrier.toLowerCase().includes('virgin')
      ? 'https://www.virginatlantic.com'
      : `https://www.google.com/travel/flights?q=${flightQuery}&curr=${currency}`;

    return {
      bookingUrl: `https://www.google.com/travel/flights?q=${flightQuery}&curr=${currency}`,
      bookingLabel: 'Book Flight (Google Flights Live)',
      secondaryBookingUrl: directUrl,
      secondaryBookingLabel: directUrl.includes('google') ? 'View Skyscanner Rates' : 'Official Airline Direct',
    };
  }

  if (mode === 'train') {
    const fromStation = cleanFrom.split(/\s+/)[0] || cleanFrom;
    const toStation = cleanTo.split(/\s+/)[0] || cleanTo;
    return {
      bookingUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(fromStation)}/to/${encodeURIComponent(toStation)}`,
      bookingLabel: 'Book Train on ConfirmTkt (Instant PNR)',
      secondaryBookingUrl: 'https://www.irctc.co.in/nget/train-search',
      secondaryBookingLabel: 'IRCTC Official Portal',
    };
  }

  if (mode === 'drive') {
    return {
      bookingUrl: `https://m.uber.com/looking?drop[0]={"addressLine1":"${encodeURIComponent(cleanTo)}"}&pickup={"addressLine1":"${encodeURIComponent(cleanFrom)}"}`,
      bookingLabel: 'Book Ride on Uber',
      secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}`,
      secondaryBookingLabel: 'Open Google Maps Navigation',
    };
  }

  // transit or local
  return {
    bookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}&travelmode=transit`,
    bookingLabel: 'View Live Transit Schedules on Maps',
  };
}

export interface RouteOption {
  title: string;
  modeLabel: 'budget' | 'balanced' | 'fastest';
  totalDuration: string;
  totalCost: number;
  formattedTotalCost: string;
  currency: string;
  summary: string;
  advantageText: string;
  legs: RouteLeg[];
  proTips: string[];
}

export interface CompareRoutesResult {
  origin: string;
  destination: string;
  currency: string;
  budgetRoute: RouteOption;
  balancedRoute: RouteOption;
  fastestRoute: RouteOption;
  isRealTimeGemini: boolean;
  generatedAt: string;
}

export interface CompareRoutesInput {
  origin: string;
  destination: string;
  departureDate?: string;
  travelers?: number;
  budget?: number;
  currency?: string;
  customGeminiKey?: string;
  liveRates?: Record<string, number>;
}

export async function compareRoutesWithGemini(input: CompareRoutesInput): Promise<CompareRoutesResult> {
  const origin = (input.origin || 'Surat').trim();
  const destination = (input.destination || 'USA').trim();
  const currency = input.currency || 'INR';
  const travelers = Math.max(1, input.travelers || 1);
  const plannedBudget = input.budget || 50000;
  const departureDate = input.departureDate || new Date().toISOString().split('T')[0];
  const apiKey = input.customGeminiKey || requireGeminiKey();

  // Try live Gemini call if API key is available
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = getGeminiModel() || 'gemini-2.5-flash';

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `You are an elite multi-modal transportation engineer and global route planner.
Your goal is to compare realistic transportation from ORIGIN to DESTINATION and provide THREE distinct real-world routes:
1. "budgetRoute" (💰 Super Money Saver): Lowest corridor fare, overnight express rail, 1-stop budget airlines, and public transit connections.
2. "balancedRoute" (⚖️ Balanced Choice): Sweet spot for time & value, confirmed AC 3-Tier/Chair Car rail + full-service direct/short-layover flights with checked 20kg baggage and meals.
3. "fastestRoute" (⚡💎 Fastest & Premium): Express direct non-stop transit, high-speed Vande Bharat Executive rail / VIP express highway links, and flagship direct non-stop flights.

CRITICAL GEOGRAPHICAL GROUNDING RULES:
- Smaller Cities, Towns & Regional Reality: Smaller towns and regional cities (e.g. Bardoli, Vyara, Bilimora, Chikhli, Ankleshwar, Palitana, Mount Abu, Surat, Vadodara, Pune, Agra, etc.) DO NOT operate direct flights to London, UK, Europe, USA, or long-haul destinations.
- NEVER hallucinate a direct international flight from a smaller city or town.
- When origin is a smaller town or regional city traveling to an international destination:
  - If a smaller town (e.g. Bardoli, Bilimora, Vyara), Leg 1 MUST be feeder transit (cab/bus) to the nearest mainline railhead (e.g. Surat or Navsari), Leg 2 is express rail to the international airport hub (Mumbai CSMIA BOM T2 or Delhi IGI DEL T3), and Leg 3 is the international flight.
  - If a regional mainline city (e.g. Surat, Navsari, Pune), Leg 1 is express rail (Vande Bharat/Gujarat Mail) to Mumbai BOM T2 / Delhi DEL T3, and Leg 2 is the international flight.
- For domestic trips from/to smaller cities (e.g. Bardoli to Jaisalmer, or Bilimora to Delhi):
  - Leg 1 is feeder cab/bus to the nearest mainline railway junction, Leg 2 is the direct Superfast Express train or domestic flight to the destination.
- For short-distance regional journeys (< 80 km, e.g. Surat to Bardoli, Navsari to Bilimora):
  - Direct highway express bus, regional rail, or cab (35-50 mins) with realistic low fares.
- If origin and destination are the same city, suggest local metro/auto/subway vs express cab.
- Provide costs estimated realistically in ${currency}.
- Output JSON adhering strictly to the schema.`,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              budgetRoute: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  totalDuration: { type: SchemaType.STRING },
                  totalCost: { type: SchemaType.NUMBER },
                  summary: { type: SchemaType.STRING },
                  advantageText: { type: SchemaType.STRING },
                  proTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  legs: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        step: { type: SchemaType.INTEGER },
                        mode: { type: SchemaType.STRING, enum: ['flight', 'train', 'drive', 'transit', 'local'] },
                        from: { type: SchemaType.STRING },
                        to: { type: SchemaType.STRING },
                        duration: { type: SchemaType.STRING },
                        carrier: { type: SchemaType.STRING },
                        estimatedCost: { type: SchemaType.NUMBER },
                        advice: { type: SchemaType.STRING },
                      },
                      required: ['step', 'mode', 'from', 'to', 'duration', 'carrier', 'estimatedCost', 'advice'],
                    },
                  },
                },
                required: ['title', 'totalDuration', 'totalCost', 'summary', 'advantageText', 'legs', 'proTips'],
              },
              balancedRoute: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  totalDuration: { type: SchemaType.STRING },
                  totalCost: { type: SchemaType.NUMBER },
                  summary: { type: SchemaType.STRING },
                  advantageText: { type: SchemaType.STRING },
                  proTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  legs: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        step: { type: SchemaType.INTEGER },
                        mode: { type: SchemaType.STRING, enum: ['flight', 'train', 'drive', 'transit', 'local'] },
                        from: { type: SchemaType.STRING },
                        to: { type: SchemaType.STRING },
                        duration: { type: SchemaType.STRING },
                        carrier: { type: SchemaType.STRING },
                        estimatedCost: { type: SchemaType.NUMBER },
                        advice: { type: SchemaType.STRING },
                      },
                      required: ['step', 'mode', 'from', 'to', 'duration', 'carrier', 'estimatedCost', 'advice'],
                    },
                  },
                },
                required: ['title', 'totalDuration', 'totalCost', 'summary', 'advantageText', 'legs', 'proTips'],
              },
              fastestRoute: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  totalDuration: { type: SchemaType.STRING },
                  totalCost: { type: SchemaType.NUMBER },
                  summary: { type: SchemaType.STRING },
                  advantageText: { type: SchemaType.STRING },
                  proTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                  legs: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        step: { type: SchemaType.INTEGER },
                        mode: { type: SchemaType.STRING, enum: ['flight', 'train', 'drive', 'transit', 'local'] },
                        from: { type: SchemaType.STRING },
                        to: { type: SchemaType.STRING },
                        duration: { type: SchemaType.STRING },
                        carrier: { type: SchemaType.STRING },
                        estimatedCost: { type: SchemaType.NUMBER },
                        advice: { type: SchemaType.STRING },
                      },
                      required: ['step', 'mode', 'from', 'to', 'duration', 'carrier', 'estimatedCost', 'advice'],
                    },
                  },
                },
                required: ['title', 'totalDuration', 'totalCost', 'summary', 'advantageText', 'legs', 'proTips'],
              },
            },
            required: ['budgetRoute', 'balancedRoute', 'fastestRoute'],
          },
        },
      });

      const prompt = `Plan real-time routing from "${origin}" to "${destination}".
Departure Date: ${departureDate}.
Travelers: ${travelers}.
Target Budget: ${currency} ${plannedBudget}.
Calculate realistic real-time route comparisons:
1. Budget Route (Maximum money saved, overland train/transit to major airport hub if regional origin, 1-stop budget flights)
2. Balanced Route (Confirmed AC rail to hub + full-service scheduled flight with 20kg baggage and meals)
3. Fastest Route (High-speed Vande Bharat Executive rail to hub + direct flagship express flight)`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const data = JSON.parse(text);

      if (data.budgetRoute && data.fastestRoute) {
        return {
          origin,
          destination,
          currency,
          budgetRoute: {
            ...data.budgetRoute,
            modeLabel: 'budget',
            formattedTotalCost: formatCurrencyAmount(data.budgetRoute.totalCost, currency),
            legs: data.budgetRoute.legs.map((l: any) => ({
              ...l,
              formattedCost: formatCurrencyAmount(l.estimatedCost, currency),
              ...createLegBookingLinks(l.mode, l.from, l.to, l.carrier, departureDate, currency),
            })),
          },
          balancedRoute: data.balancedRoute ? {
            ...data.balancedRoute,
            modeLabel: 'balanced',
            formattedTotalCost: formatCurrencyAmount(data.balancedRoute.totalCost, currency),
            legs: data.balancedRoute.legs.map((l: any) => ({
              ...l,
              formattedCost: formatCurrencyAmount(l.estimatedCost, currency),
              ...createLegBookingLinks(l.mode, l.from, l.to, l.carrier, departureDate, currency),
            })),
          } : {
            title: `Balanced Route via Smart Connecting Hub (${origin} ➔ ${destination})`,
            modeLabel: 'balanced',
            totalDuration: data.budgetRoute.totalDuration,
            totalCost: Math.round((data.budgetRoute.totalCost + data.fastestRoute.totalCost) / 2),
            formattedTotalCost: formatCurrencyAmount(Math.round((data.budgetRoute.totalCost + data.fastestRoute.totalCost) / 2), currency),
            summary: `Optimum balance between price and travel duration with confirmed baggage and meals.`,
            advantageText: 'Checked 20kg baggage + hot meal included. No extreme redeye layovers.',
            proTips: ['Ideal trade-off between ticket cost and travel comfort.'],
            legs: data.budgetRoute.legs.map((l: any) => ({
              ...l,
              formattedCost: formatCurrencyAmount(l.estimatedCost, currency),
              ...createLegBookingLinks(l.mode, l.from, l.to, l.carrier, departureDate, currency),
            })),
          },
          fastestRoute: {
            ...data.fastestRoute,
            modeLabel: 'fastest',
            formattedTotalCost: formatCurrencyAmount(data.fastestRoute.totalCost, currency),
            legs: data.fastestRoute.legs.map((l: any) => ({
              ...l,
              formattedCost: formatCurrencyAmount(l.estimatedCost, currency),
              ...createLegBookingLinks(l.mode, l.from, l.to, l.carrier, departureDate, currency),
            })),
          },
          isRealTimeGemini: true,
          generatedAt: getCurrent12HourTime(),
        };
      }
    } catch (err) {
      console.warn('Gemini route comparison call failed, switching to resilient fallback:', err);
    }
  }

  // Resilient High-Intelligence Fallback
  return generateDeterministicRouteComparison(origin, destination, currency, travelers, departureDate);
}

/**
 * Resilient deterministic multi-modal route comparison generator
 */
function generateDeterministicRouteComparison(
  origin: string,
  destination: string,
  currency: string,
  travelers: number,
  departureDate?: string
): CompareRoutesResult {
  const transitAnalysis = analyzeTransitRoute(origin, destination);
  const isSame = transitAnalysis.isSameCity;
  const isIntl = transitAnalysis.tier === 'long_haul_intl' || transitAnalysis.tier === 'short_haul_intl';

  // 1. Same City (e.g. New York to New York, Paris to Paris)
  if (isSame) {
    const budgetCost = convertCurrency(3.5 * travelers, 'USD', currency);
    const balancedCost = convertCurrency(14.0 * travelers, 'USD', currency);
    const expressCost = convertCurrency(38.0 * travelers, 'USD', currency);

    return {
      origin,
      destination,
      currency,
      budgetRoute: {
        title: 'Super Money Saver Route (Public Metro & City Transit)',
        modeLabel: 'budget',
        totalDuration: '25 - 40 mins',
        totalCost: Math.round(budgetCost),
        formattedTotalCost: formatCurrencyAmount(Math.round(budgetCost), currency),
        currency,
        summary: `Use city metro/subway system across ${destination} with unlimited transit day pass.`,
        advantageText: `Saves up to 85% compared to hailing on-demand private cabs.`,
        proTips: [
          'Purchase a 1-Day or Multi-Ride Metrocard for unlimited rides.',
          'Off-peak subway travel avoids rush-hour congestion.',
        ],
        legs: [
          {
            step: 1,
            mode: 'transit',
            from: origin,
            to: `${destination} Central Stations`,
            duration: '25 mins',
            carrier: 'City Rapid Transit / Metro Subway',
            estimatedCost: Math.round(budgetCost),
            formattedCost: formatCurrencyAmount(Math.round(budgetCost), currency),
            advice: 'Clean, reliable, and zero road traffic delays.',
            ...createLegBookingLinks('transit', origin, destination, 'City Transit', departureDate, currency),
          },
        ],
      },
      balancedRoute: {
        title: 'Balanced Route (Express City Bus & Shared Shuttle)',
        modeLabel: 'balanced',
        totalDuration: '20 - 30 mins',
        totalCost: Math.round(balancedCost),
        formattedTotalCost: formatCurrencyAmount(Math.round(balancedCost), currency),
        currency,
        summary: `Dedicated airport/city express shuttle or shared on-demand van.`,
        advantageText: `Direct seating with dedicated luggage space at a fraction of private cab rates.`,
        proTips: ['Pre-book online for guaranteed seat reservation.'],
        legs: [
          {
            step: 1,
            mode: 'transit',
            from: origin,
            to: destination,
            duration: '20 mins',
            carrier: 'City Express Shuttle Bus / Shared Ride',
            estimatedCost: Math.round(balancedCost),
            formattedCost: formatCurrencyAmount(Math.round(balancedCost), currency),
            advice: 'Curbside luggage loading with comfortable AC seating.',
            ...createLegBookingLinks('transit', origin, destination, 'City Express Shuttle', departureDate, currency),
          },
        ],
      },
      fastestRoute: {
        title: 'Fastest & Premium Route (Direct VIP Chauffeur / Cab)',
        modeLabel: 'fastest',
        totalDuration: '15 - 20 mins',
        totalCost: Math.round(expressCost),
        formattedTotalCost: formatCurrencyAmount(Math.round(expressCost), currency),
        currency,
        summary: `Door-to-door on-demand express rideshare or private vehicle.`,
        advantageText: `Saves 20 mins with direct door-to-door luggage drop-off.`,
        proTips: ['Use bus-lane priority corridors during morning peak.'],
        legs: [
          {
            step: 1,
            mode: 'drive',
            from: origin,
            to: destination,
            duration: '15 mins',
            carrier: 'Express Private Cab / Uber Black',
            estimatedCost: Math.round(expressCost),
            formattedCost: formatCurrencyAmount(Math.round(expressCost), currency),
            advice: 'Direct pickup from your doorstep.',
            ...createLegBookingLinks('drive', origin, destination, 'Uber Black / Cab', departureDate, currency),
          },
        ],
      },
      isRealTimeGemini: false,
      generatedAt: getCurrent12HourTime(),
    };
  }

  // 2. Multi-Modal Gateway Routing (Supports Any Small City, Town, or Regional Hub)
  const normOrigin = origin.toLowerCase().trim();
  const normDest = destination.toLowerCase().trim();
  const isOrigIndia = isLocationInIndia(normOrigin);
  const isDestIndia = isLocationInIndia(normDest);

  // If transitAnalysis produced structured legs (e.g. for small towns, regional hubs, or domestic routes)
  if (transitAnalysis.transitLegs && transitAnalysis.transitLegs.length > 0) {
    const rawLegs = transitAnalysis.transitLegs;

    // Check if it's a short regional trip (<80 km, e.g. Surat to Bardoli, Navsari to Bilimora)
    const isShortRegional = !isIntl && rawLegs.length === 1 && (rawLegs[0].mode === 'drive' || rawLegs[0].mode === 'local');

    if (isShortRegional) {
      const saverFareINR = 120 * travelers;
      const balancedFareINR = 350 * travelers;
      const fastestFareINR = 650 * travelers;

      return {
        origin,
        destination,
        currency,
        budgetRoute: {
          title: 'Super Money Saver Route (GSRTC Express Bus / Shared Transit)',
          modeLabel: 'budget',
          totalDuration: '45 - 55 mins',
          totalCost: Math.round(convertCurrency(saverFareINR, 'INR', currency)),
          formattedTotalCost: formatCurrencyAmount(Math.round(convertCurrency(saverFareINR, 'INR', currency)), currency),
          currency,
          summary: `Economical state transport bus or shared highway shuttle from ${origin} to ${destination}.`,
          advantageText: `Saves up to 80% with frequent departures throughout the day.`,
          proTips: ['Buses depart every 10-15 minutes from central bus station.', 'No advance booking required; tickets available on-board.'],
          legs: [
            {
              step: 1,
              mode: 'drive',
              from: origin,
              to: destination,
              duration: '50 mins',
              carrier: 'GSRTC / State Transport Express Bus',
              estimatedCost: Math.round(convertCurrency(saverFareINR, 'INR', currency)),
              formattedCost: formatCurrencyAmount(Math.round(convertCurrency(saverFareINR, 'INR', currency)), currency),
              advice: 'Direct highway transit via main express corridor.',
              bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(destination)}"}`,
              bookingLabel: 'Book Ride on Uber',
              secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
              secondaryBookingLabel: 'Google Maps Route Guidance',
            },
          ],
        },
        balancedRoute: {
          title: 'Balanced Route (Direct AC Cab / Uber Intercity)',
          modeLabel: 'balanced',
          totalDuration: '35 - 45 mins',
          totalCost: Math.round(convertCurrency(balancedFareINR, 'INR', currency)),
          formattedTotalCost: formatCurrencyAmount(Math.round(convertCurrency(balancedFareINR, 'INR', currency)), currency),
          currency,
          summary: `Comfortable on-demand AC cab directly from pickup to doorstep destination.`,
          advantageText: `Door-to-door convenience with dedicated trunk space for luggage.`,
          proTips: ['Ideal for travelers with family or multiple bags.'],
          legs: [
            {
              step: 1,
              mode: 'drive',
              from: origin,
              to: destination,
              duration: '40 mins',
              carrier: 'AC Sedan / Uber Intercity',
              estimatedCost: Math.round(convertCurrency(balancedFareINR, 'INR', currency)),
              formattedCost: formatCurrencyAmount(Math.round(convertCurrency(balancedFareINR, 'INR', currency)), currency),
              advice: 'Direct highway drive without intermediate stops.',
              bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(destination)}"}`,
              bookingLabel: 'Book Ride on Uber',
              secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
              secondaryBookingLabel: 'Google Maps Navigation',
            },
          ],
        },
        fastestRoute: {
          title: 'Fastest & Premium Route (Express Private Chauffeur)',
          modeLabel: 'fastest',
          totalDuration: '30 - 35 mins',
          totalCost: Math.round(convertCurrency(fastestFareINR, 'INR', currency)),
          formattedTotalCost: formatCurrencyAmount(Math.round(convertCurrency(fastestFareINR, 'INR', currency)), currency),
          currency,
          summary: `Express private vehicle or VIP chauffeured sedan.`,
          advantageText: `Fastest highway transit with priority pickup.`,
          proTips: ['Fast-track highway drive.'],
          legs: [
            {
              step: 1,
              mode: 'drive',
              from: origin,
              to: destination,
              duration: '35 mins',
              carrier: 'Express Private Cab / VIP Sedan',
              estimatedCost: Math.round(convertCurrency(fastestFareINR, 'INR', currency)),
              formattedCost: formatCurrencyAmount(Math.round(convertCurrency(fastestFareINR, 'INR', currency)), currency),
              advice: 'Priority highway routing.',
              bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(destination)}"}`,
              bookingLabel: 'Book Ride on Uber',
              secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
              secondaryBookingLabel: 'Google Maps Navigation',
            },
          ],
        },
        isRealTimeGemini: false,
        generatedAt: getCurrent12HourTime(),
      };
    }

    // Multi-leg journey (e.g. Smaller town to International OR Smaller town to Domestic)
    // Scale costs according to tier
    const isLondon = normDest.includes('london') || normDest.includes('uk') || normDest.includes('england');
    const isUSA = normDest.includes('usa') || normDest.includes('united states') || normDest.includes('new york');
    const isSwiss = normDest.includes('switzerland') || normDest.includes('zurich') || normDest.includes('geneva') || normDest.includes('interlaken') || normDest.includes('lucerne') || normDest.includes('basel') || normDest.includes('swiss');
    const isEurope = normDest.includes('uk') || normDest.includes('london') || normDest.includes('paris') || normDest.includes('france') || normDest.includes('italy') || normDest.includes('germany') || normDest.includes('spain') || isSwiss;

    let baseSaverUSD = isIntl ? (isLondon ? 630 : isSwiss ? 610 : isUSA ? 620 : 540) : 18;
    let baseBalancedUSD = isIntl ? (isLondon ? 790 : isSwiss ? 780 : isUSA ? 850 : 720) : 32;
    let baseFastestUSD = isIntl ? (isLondon ? 1060 : isSwiss ? 1040 : isUSA ? 1180 : 960) : 65;

    const budgetTotal = convertCurrency(baseSaverUSD * travelers, 'USD', currency);
    const balancedTotal = convertCurrency(baseBalancedUSD * travelers, 'USD', currency);
    const fastestTotal = convertCurrency(baseFastestUSD * travelers, 'USD', currency);

    // Build Leg items dynamically
    const buildLegsForMode = (mode: 'budget' | 'balanced' | 'fastest') => {
      return rawLegs.map((leg, index) => {
        const isFlight = leg.mode === 'flight';
        const isTrain = leg.mode === 'train';

        let carrier = leg.carrierOrOption;
        let duration = leg.duration;
        let advice = leg.advice;

        if (mode === 'budget') {
          if (isFlight) {
            carrier = isSwiss
              ? 'Etihad Airways / Qatar Airways / Gulf Air (1-Stop Saver to Zurich ZRH)'
              : isLondon
              ? 'Etihad Airways / Air Arabia (1-Stop Saver)'
              : 'Connecting 1-Stop Budget Airline';
            duration = isSwiss ? '14h - 16h (1-Stop Saver)' : isLondon ? '15h - 18h (1-Stop Saver)' : duration;
            advice = isSwiss ? 'Economy saver fare via Middle East hub with checked 20kg baggage.' : advice;
          }
          if (isTrain) {
            carrier = normOrigin.includes('latur')
              ? 'Latur-CSMT Express (Sleeper Class #22108)'
              : carrier.includes('Vande Bharat')
              ? 'Sleeper / 3-Tier AC Rail'
              : 'Sleeper / 3-Tier AC Superfast Express';
          }
        } else if (mode === 'balanced') {
          if (isFlight) {
            carrier = isSwiss
              ? 'Air India / Emirates / Lufthansa (Scheduled Full-Service)'
              : isLondon
              ? 'Air India Direct Non-Stop (Boeing 777/787)'
              : 'Full-Service Direct / Short Connection Airline';
            duration = isSwiss ? '11h - 13h (Short Hub Connection)' : isLondon ? '10h 30m' : duration;
            advice = isSwiss ? 'Full-service international flights with meals, seat selection, and 25kg luggage.' : advice;
          }
          if (isTrain) {
            carrier = normOrigin.includes('latur')
              ? 'Latur-Mumbai CSMT Superfast Express (AC 3-Tier #22108)'
              : 'AC 3-Tier / Chair Car Superfast Express';
          }
        } else {
          // fastest
          if (isFlight) {
            carrier = isSwiss
              ? 'SWISS International Air Lines (LX155 Direct Non-Stop BOM ➔ ZRH)'
              : isLondon
              ? 'British Airways / Virgin Atlantic Flagship Direct'
              : 'Flagship Non-Stop Direct Express';
            duration = isSwiss ? '9h 00m (Direct Flagship Non-Stop)' : isLondon ? '9h 30m (Direct Flagship)' : duration;
            advice = isSwiss
              ? 'Direct non-stop Boeing/Airbus flagship flight from Mumbai CSMIA T2 to Zurich Airport (ZRH).'
              : advice;
          }
          if (isTrain) {
            carrier = normOrigin.includes('latur')
              ? 'Latur-Mumbai CSMT AC Superfast Express (AC 2-Tier / 1st AC #22108)'
              : normOrigin.includes('surat') || normOrigin.includes('navsari')
              ? 'Vande Bharat Executive Chair Car (#20902)'
              : 'Vande Bharat Executive / AC Express';
          }
        }

        const legCostFraction = isFlight ? 0.85 : (rawLegs.length > 2 ? 0.08 : 0.15);
        const legTotalForMode = mode === 'budget' ? budgetTotal : mode === 'balanced' ? balancedTotal : fastestTotal;
        const legCost = Math.round(legTotalForMode * (rawLegs.length === 1 ? 1 : legCostFraction));

        return {
          step: leg.step,
          mode: leg.mode,
          from: leg.from,
          to: leg.to,
          duration,
          carrier,
          estimatedCost: legCost,
          formattedCost: formatCurrencyAmount(legCost, currency),
          advice,
          bookingUrl: leg.bookingUrl,
          bookingLabel: leg.bookingLabel,
          secondaryBookingUrl: leg.secondaryBookingUrl,
          secondaryBookingLabel: leg.secondaryBookingLabel,
        };
      });
    };

    return {
      origin,
      destination,
      currency,
      budgetRoute: {
        title: isIntl
          ? 'Super Money Saver Route (Feeder Transit + Rail + Budget Flight)'
          : 'Super Money Saver Route (Feeder Transit + Sleeper/Express Rail)',
        modeLabel: 'budget',
        totalDuration: isIntl ? '16h - 22h Total' : '10h - 18h Total',
        totalCost: Math.round(budgetTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(budgetTotal), currency),
        currency,
        summary: `Cost-optimized route from ${origin} to ${destination} saving up to 45% in fare.`,
        advantageText: `Saves ~${formatCurrencyAmount(Math.round(fastestTotal - budgetTotal), currency)} over express travel.`,
        proTips: [
          `No direct international flights operate from regional airports or smaller towns; routes connect through major transit junctions.`,
          `Overnight or early morning train departures provide lowest base fares and save hotel night stays.`,
        ],
        legs: buildLegsForMode('budget'),
      },
      balancedRoute: {
        title: isIntl
          ? 'Balanced Route (Feeder Cab + AC Express Rail + Direct Flight)'
          : 'Balanced Route (Feeder Cab + AC Superfast Express Rail)',
        modeLabel: 'balanced',
        totalDuration: isIntl ? '13h - 17h Total' : '6h - 12h Total',
        totalCost: Math.round(balancedTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(balancedTotal), currency),
        currency,
        summary: `Confirmed AC comfort with full luggage allowance and scheduled departures.`,
        advantageText: `Optimal balance of speed and convenience with confirmed seats and zero red-eye delays.`,
        proTips: ['Ideal trade-off between price and comfort.'],
        legs: buildLegsForMode('balanced'),
      },
      fastestRoute: {
        title: isIntl
          ? 'Fastest & Premium Route (Vande Bharat / AC Express + Flagship Flight)'
          : 'Fastest & Premium Route (Express Direct / Vande Bharat Executive)',
        modeLabel: 'fastest',
        totalDuration: isIntl ? '11h - 14h Total' : '3h - 6h Total',
        totalCost: Math.round(fastestTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(fastestTotal), currency),
        currency,
        summary: isIntl
          ? `Priority express route with Vande Bharat / AC overnight express to international airport hub + direct flagship international flight.`
          : `Direct non-stop flight or high-speed Vande Bharat rail between ${origin} and ${destination}.`,
        advantageText: `Fastest arrival · Priority check-in, executive seating, and minimum transit layovers.`,
        proTips: ['Fast-track booking with direct links.'],
        legs: buildLegsForMode('fastest'),
      },
      isRealTimeGemini: false,
      generatedAt: getCurrent12HourTime(),
    };
  }

  // 3. Fallback Route: Strict Geographical Grounding Guaranteed
  const isOrigIndiaLocation = isLocationInIndia(normOrigin);
  const isDestIndiaLocation = isLocationInIndia(normDest);
  const isLondon = normDest.includes('london') || normDest.includes('uk') || normDest.includes('england');
  const isUSA = normDest.includes('usa') || normDest.includes('united states') || normDest.includes('new york');
  const isSwiss = normDest.includes('switzerland') || normDest.includes('zurich') || normDest.includes('geneva') || normDest.includes('interlaken') || normDest.includes('lucerne') || normDest.includes('basel') || normDest.includes('swiss');

  // If origin is in India and destination is international (e.g. Latur to Switzerland, Surat to London)
  // Hallucination Prevention: NEVER generate a direct international flight from a regional town!
  if (isOrigIndiaLocation && isIntl) {
    const hub = getNearestTransitHub(origin);
    const destAirport = isSwiss
      ? 'Zurich Airport (ZRH) / Geneva (GVA)'
      : isLondon
      ? 'London Heathrow (LHR) / Gatwick (LGW)'
      : isUSA
      ? 'New York (JFK / EWR) Gateway'
      : `${destination} International Gateway`;

    const budgetUSD = (isLondon ? 630 : isSwiss ? 610 : 540) * travelers;
    const balancedUSD = (isLondon ? 790 : isSwiss ? 780 : 720) * travelers;
    const fastestUSD = (isLondon ? 1060 : isSwiss ? 1040 : 960) * travelers;

    const bTotal = convertCurrency(budgetUSD, 'USD', currency);
    const balTotal = convertCurrency(balancedUSD, 'USD', currency);
    const fTotal = convertCurrency(fastestUSD, 'USD', currency);

    const fastestFlightCarrier = isSwiss
      ? 'SWISS International Air Lines (LX155 Direct Non-Stop BOM ➔ ZRH)'
      : isLondon
      ? 'British Airways / Virgin Atlantic Flagship Direct'
      : 'Major Flagship International Airline';

    const balancedFlightCarrier = isSwiss
      ? 'Air India / Emirates / Lufthansa (Scheduled Full-Service)'
      : isLondon
      ? 'Air India Direct Non-Stop (Boeing 777/787)'
      : 'Full-Service Direct / Short Connection Airline';

    const budgetFlightCarrier = isSwiss
      ? 'Etihad Airways / Qatar Airways / Gulf Air (1-Stop Saver to Zurich ZRH)'
      : isLondon
      ? 'Etihad Airways / Air Arabia (1-Stop Saver)'
      : 'Connecting 1-Stop Budget Airline';

    return {
      origin,
      destination,
      currency,
      budgetRoute: {
        title: 'Super Money Saver Route (Feeder Transit + Rail + Budget Flight)',
        modeLabel: 'budget',
        totalDuration: '18h - 22h Total',
        totalCost: Math.round(bTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(bTotal), currency),
        currency,
        summary: `Cost-optimized route from ${origin} connecting through ${hub.hubCity} (${hub.hubCode}) to ${destination}.`,
        advantageText: `Saves ~${formatCurrencyAmount(Math.round(fTotal - bTotal), currency)} over express travel.`,
        proTips: ['Overnight train to international airport hub saves hotel stays.'],
        legs: [
          {
            step: 1,
            mode: hub.feederMode,
            from: origin,
            to: hub.nearestRailhead,
            duration: hub.feederDuration,
            carrier: hub.feederCarrier,
            estimatedCost: Math.round(bTotal * 0.05),
            formattedCost: formatCurrencyAmount(Math.round(bTotal * 0.05), currency),
            advice: hub.feederAdvice,
            ...createLegBookingLinks(hub.feederMode, origin, hub.nearestRailhead, hub.feederCarrier, departureDate, currency),
          },
          {
            step: 2,
            mode: 'train',
            from: hub.nearestRailhead,
            to: `${hub.hubCity} (${hub.hubCode} Airport Connector)`,
            duration: hub.railToHubDuration,
            carrier: normOrigin.includes('latur') ? 'Latur-CSMT Express (Sleeper Class #22108)' : hub.railToHubCarrier,
            estimatedCost: Math.round(bTotal * 0.10),
            formattedCost: formatCurrencyAmount(Math.round(bTotal * 0.10), currency),
            advice: `Board express train connecting directly to ${hub.hubCity} airport terminal corridor.`,
            ...createLegBookingLinks('train', hub.nearestRailhead, hub.hubCity, hub.railToHubCarrier, departureDate, currency),
          },
          {
            step: 3,
            mode: 'flight',
            from: hub.nearestAirportHub,
            to: destAirport,
            duration: isSwiss ? '14h - 16h (1-Stop Saver)' : '16h (1 stop)',
            carrier: budgetFlightCarrier,
            estimatedCost: Math.round(bTotal * 0.85),
            formattedCost: formatCurrencyAmount(Math.round(bTotal * 0.85), currency),
            advice: 'Economical connecting flight from major hub.',
            ...createLegBookingLinks('flight', hub.hubCode, destination, budgetFlightCarrier, departureDate, currency),
          },
        ],
      },
      balancedRoute: {
        title: 'Balanced Route (Feeder Cab + AC Express Rail + Direct Flight)',
        modeLabel: 'balanced',
        totalDuration: '13h - 17h Total',
        totalCost: Math.round(balTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(balTotal), currency),
        currency,
        summary: `Comfortable journey via ${hub.hubCity} with confirmed AC seating and scheduled flights.`,
        advantageText: 'Optimal balance of time and comfort with checked baggage included.',
        proTips: ['Ideal trade-off between price and speed.'],
        legs: [
          {
            step: 1,
            mode: hub.feederMode,
            from: origin,
            to: hub.nearestRailhead,
            duration: hub.feederDuration,
            carrier: hub.feederCarrier,
            estimatedCost: Math.round(balTotal * 0.05),
            formattedCost: formatCurrencyAmount(Math.round(balTotal * 0.05), currency),
            advice: hub.feederAdvice,
            ...createLegBookingLinks(hub.feederMode, origin, hub.nearestRailhead, hub.feederCarrier, departureDate, currency),
          },
          {
            step: 2,
            mode: 'train',
            from: hub.nearestRailhead,
            to: `${hub.hubCity} (${hub.hubCode} Airport Connector)`,
            duration: hub.railToHubDuration,
            carrier: normOrigin.includes('latur') ? 'Latur-CSMT Superfast Express (AC 3-Tier #22108)' : hub.railToHubCarrier,
            estimatedCost: Math.round(balTotal * 0.10),
            formattedCost: formatCurrencyAmount(Math.round(balTotal * 0.10), currency),
            advice: `Board AC express train to ${hub.hubCity} airport corridor.`,
            ...createLegBookingLinks('train', hub.nearestRailhead, hub.hubCity, hub.railToHubCarrier, departureDate, currency),
          },
          {
            step: 3,
            mode: 'flight',
            from: hub.nearestAirportHub,
            to: destAirport,
            duration: isSwiss ? '11h - 13h' : '12h - 14h',
            carrier: balancedFlightCarrier,
            estimatedCost: Math.round(balTotal * 0.85),
            formattedCost: formatCurrencyAmount(Math.round(balTotal * 0.85), currency),
            advice: 'Scheduled international flight with meal and luggage amenities.',
            ...createLegBookingLinks('flight', hub.hubCode, destination, balancedFlightCarrier, departureDate, currency),
          },
        ],
      },
      fastestRoute: {
        title: 'Fastest & Premium Route (AC Superfast Rail + Direct Flagship Flight)',
        modeLabel: 'fastest',
        totalDuration: '11h - 14h Total',
        totalCost: Math.round(fTotal),
        formattedTotalCost: formatCurrencyAmount(Math.round(fTotal), currency),
        currency,
        summary: `Fastest connection: AC express rail to ${hub.hubCity} (${hub.hubCode} T2) + direct flagship international flight to ${destination}.`,
        advantageText: 'Fastest transit time · Flagship direct non-stop flight from international hub.',
        proTips: ['Fast-track check-in and priority boarding.'],
        legs: [
          {
            step: 1,
            mode: hub.feederMode,
            from: origin,
            to: hub.nearestRailhead,
            duration: hub.feederDuration,
            carrier: hub.feederCarrier,
            estimatedCost: Math.round(fTotal * 0.05),
            formattedCost: formatCurrencyAmount(Math.round(fTotal * 0.05), currency),
            advice: hub.feederAdvice,
            ...createLegBookingLinks(hub.feederMode, origin, hub.nearestRailhead, hub.feederCarrier, departureDate, currency),
          },
          {
            step: 2,
            mode: 'train',
            from: hub.nearestRailhead,
            to: `${hub.hubCity} (${hub.hubCode} Airport Connector)`,
            duration: hub.railToHubDuration,
            carrier: normOrigin.includes('latur') ? 'Latur-Mumbai CSMT AC Express (#22108 / #12072)' : hub.railToHubCarrier,
            estimatedCost: Math.round(fTotal * 0.10),
            formattedCost: formatCurrencyAmount(Math.round(fTotal * 0.10), currency),
            advice: `Board AC express rail to ${hub.hubCity} airport terminal.`,
            ...createLegBookingLinks('train', hub.nearestRailhead, hub.hubCity, hub.railToHubCarrier, departureDate, currency),
          },
          {
            step: 3,
            mode: 'flight',
            from: hub.nearestAirportHub,
            to: destAirport,
            duration: isSwiss ? '9h 00m (Direct Flagship Non-Stop)' : '9h - 11h (Direct Flagship)',
            carrier: fastestFlightCarrier,
            estimatedCost: Math.round(fTotal * 0.85),
            formattedCost: formatCurrencyAmount(Math.round(fTotal * 0.85), currency),
            advice: isSwiss
              ? 'Direct non-stop Boeing/Airbus flight from Mumbai CSMIA T2 to Zurich Airport (ZRH).'
              : 'Direct flagship international flight without domestic layovers.',
            ...createLegBookingLinks('flight', hub.hubCode, destination, fastestFlightCarrier, departureDate, currency),
          },
        ],
      },
      isRealTimeGemini: false,
      generatedAt: getCurrent12HourTime(),
    };
  }

  // Major International Gateway to Gateway (e.g. Mumbai to Zurich, London to Paris, New York to Tokyo)
  const baseBudgetUSD = isIntl ? 520 : 38;
  const baseBalancedUSD = isIntl ? 720 : 65;
  const baseFastestUSD = isIntl ? 1050 : 130;

  const budgetTotal = convertCurrency(baseBudgetUSD * travelers, 'USD', currency);
  const balancedTotal = convertCurrency(baseBalancedUSD * travelers, 'USD', currency);
  const fastestTotal = convertCurrency(baseFastestUSD * travelers, 'USD', currency);

  return {
    origin,
    destination,
    currency,
    budgetRoute: {
      title: 'Super Money Saver Route (Cost-Optimized Transit)',
      modeLabel: 'budget',
      totalDuration: isIntl ? '18h - 22h' : '8h - 12h',
      totalCost: Math.round(budgetTotal),
      formattedTotalCost: formatCurrencyAmount(Math.round(budgetTotal), currency),
      currency,
      summary: `Connecting budget transit from ${origin} to ${destination} saving up to 45% in fare.`,
      advantageText: `Saves ~${formatCurrencyAmount(Math.round(fastestTotal - budgetTotal), currency)} over express travel.`,
      proTips: [
        'Utilize early morning or late night departures for lowest base fare.',
        'Choose public rail / rapid bus transfers rather than individual cabs.',
      ],
      legs: [
        {
          step: 1,
          mode: isIntl ? 'flight' : 'train',
          from: origin,
          to: `${destination} Terminal`,
          duration: isIntl ? '16h (1 stop)' : '8h 30m',
          carrier: isIntl ? 'Budget Carrier / 1-Stop Transit' : 'Superfast Sleeper Train',
          estimatedCost: Math.round(budgetTotal),
          formattedCost: formatCurrencyAmount(Math.round(budgetTotal), currency),
          advice: 'Most economical option with verified booking links.',
          ...createLegBookingLinks(isIntl ? 'flight' : 'train', origin, destination, isIntl ? 'Budget Airline' : 'Express Train', departureDate, currency),
        },
      ],
    },
    balancedRoute: {
      title: 'Balanced Route (Comfortable & Reasonable Duration)',
      modeLabel: 'balanced',
      totalDuration: isIntl ? '14h - 17h' : '4h - 6h',
      totalCost: Math.round(balancedTotal),
      formattedTotalCost: formatCurrencyAmount(Math.round(balancedTotal), currency),
      currency,
      summary: `Convenient travel schedule with full service baggage and meal amenities included.`,
      advantageText: `Best value-to-convenience ratio without extreme red-eye hours.`,
      proTips: ['Ideal for travelers wanting comfort without paying luxury premiums.'],
      legs: [
        {
          step: 1,
          mode: isIntl ? 'flight' : 'train',
          from: origin,
          to: destination,
          duration: isIntl ? '14h (Short Connection)' : '5h 15m',
          carrier: isIntl ? 'Full-Service International Carrier' : 'Rajdhani / AC Superfast Express',
          estimatedCost: Math.round(balancedTotal),
          formattedCost: formatCurrencyAmount(Math.round(balancedTotal), currency),
          advice: 'Comfortable seating with complimentary meals and baggage included.',
          ...createLegBookingLinks(isIntl ? 'flight' : 'train', origin, destination, isIntl ? 'Full-Service Airline' : 'AC Train', departureDate, currency),
        },
      ],
    },
    fastestRoute: {
      title: 'Fastest & Premium Route (Express Direct / VIP Fleet)',
      modeLabel: 'fastest',
      totalDuration: isIntl ? '11h - 14h' : '1h 45m - 3h',
      totalCost: Math.round(fastestTotal),
      formattedTotalCost: formatCurrencyAmount(Math.round(fastestTotal), currency),
      currency,
      summary: isIntl
        ? `Premier non-stop or express connecting international flight between ${origin} and ${destination}.`
        : `Direct non-stop flight or high-speed Vande Bharat rail between ${origin} and ${destination}.`,
      advantageText: `Fastest arrival · Saves hours of transit time with zero layovers.`,
      proTips: ['Fast-track direct booking with express check-in and priority boarding.'],
      legs: [
        {
          step: 1,
          mode: 'flight',
          from: origin,
          to: destination,
          duration: isIntl ? (isSwiss ? '9h 00m (Direct Flagship)' : '10h - 12h (Direct)') : '1h 45m',
          carrier: isIntl ? (isSwiss ? 'SWISS International Air Lines Direct' : 'Flagship International Carrier Direct Flight') : 'Direct Domestic Express Flight / Vande Bharat',
          estimatedCost: Math.round(fastestTotal),
          formattedCost: formatCurrencyAmount(Math.round(fastestTotal), currency),
          advice: 'Fastest door-to-door transit without intermediate connection delays.',
          ...createLegBookingLinks('flight', origin, destination, isSwiss ? 'SWISS International Air Lines' : 'Premier Airline', departureDate, currency),
        },
      ],
    },
    isRealTimeGemini: false,
    generatedAt: getCurrent12HourTime(),
  };
}
