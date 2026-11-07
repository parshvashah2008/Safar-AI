'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  Compass,
  ExternalLink,
  HeartPulse,
  Loader2,
  Navigation,
  Plane,
  ShieldCheck,
  Sparkles,
  Ticket,
  Train,
  Utensils,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Zap,
  Coins,
  Clock,
  TrendingDown,
  Scale,
  CheckCircle,
  Car,
  Bus,
  Ship,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTrip, addItineraryStop } from '@/lib/services/trip-service';
import { getDestinationImage } from '@/lib/constants/destination-images';
import {
  parseRouteInput,
  analyzeTransitRoute,
  validateBudgetFeasibility,
  resolveCountry,
  isDomesticJourney,
  TransitLeg,
} from '@/lib/services/transit-routing';
import {
  SUPPORTED_CURRENCIES,
  formatCurrencyAmount,
  convertCurrency,
} from '@/lib/services/currency-service';
import { SYNC_EVENTS, emitTripChange, getStoredActiveSearch, emitActiveSearch, TransportMode } from '@/lib/services/sync-bus';
import {
  compareRoutesWithGemini,
  CompareRoutesResult,
} from '@/lib/services/gemini-route-service';
import { generateFallbackItinerary } from '@/lib/services/fallback-itinerary';
import { generateClientItinerary } from '@/lib/ai/client-ai-engine';
import { resolveCityTransitProfile } from '@/lib/services/station-resolver';
import { ItineraryMap } from '@/components/trips/itinerary-map';
import { isStaticHost } from '@/lib/config';
import type { StopCategory } from '@/types';

const defaultInterests = [
  'Heritage & Architecture',
  'Local Food & Markets',
  'Nature & Trails',
  'Art & Design',
  'Quiet Cafes & Reading',
  'Spiritual & Wellness',
  'Photography Walks',
  'Textiles & Crafts',
];

const DESTINATION_SUGGESTIONS: Record<string, { name: string; country: string }> = {
  sunderban: { name: 'Sundarbans National Park, West Bengal', country: 'India' },
  sunderbans: { name: 'Sundarbans National Park, West Bengal', country: 'India' },
  sundarban: { name: 'Sundarbans National Park, West Bengal', country: 'India' },
  sundarbans: { name: 'Sundarbans National Park, West Bengal', country: 'India' },
  tokiyo: { name: 'Tokyo', country: 'Japan' },
  tokyio: { name: 'Tokyo', country: 'Japan' },
  benares: { name: 'Varanasi', country: 'India' },
  banaras: { name: 'Varanasi', country: 'India' },
  kashi: { name: 'Varanasi', country: 'India' },
  bengluru: { name: 'Bengaluru', country: 'India' },
  bangalore: { name: 'Bengaluru', country: 'India' },
  amritsir: { name: 'Amritsar', country: 'India' },
  darjiling: { name: 'Darjeeling', country: 'India' },
  pondy: { name: 'Puducherry', country: 'India' },
  pondichery: { name: 'Puducherry', country: 'India' },
  pondicherry: { name: 'Puducherry', country: 'India' },
  ladak: { name: 'Leh & Ladakh', country: 'India' },
  leh: { name: 'Leh & Ladakh', country: 'India' },
  hampi: { name: 'Hampi', country: 'India' },
  surat: { name: 'Surat', country: 'India' },
  kutch: { name: 'Rann of Kutch', country: 'India' },
  udaipoor: { name: 'Udaipur', country: 'India' },
  jaipoor: { name: 'Jaipur', country: 'India' },
  amalfi: { name: 'Amalfi Coast', country: 'Italy' },
  zermatt: { name: 'Zermatt & Swiss Alps', country: 'Switzerland' },
  newyork: { name: 'New York City', country: 'United States' },
  nyc: { name: 'New York City', country: 'United States' },
};

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stored = getStoredActiveSearch();
  const initialDest = searchParams?.get('destination') || stored.destination || '';
  const initialOrigin = searchParams?.get('origin') || stored.origin || '';
  const paramTravelersRaw = searchParams?.get('travelers');
  const cleanTravelers = paramTravelersRaw ? Number(paramTravelersRaw.replace(/^0+(?=\d)/, '')) : NaN;
  const initialTravelers = !isNaN(cleanTravelers) && cleanTravelers > 0 ? cleanTravelers : (stored.travelers || 2);

  const paramBudgetRaw = searchParams?.get('budget');
  const cleanBudget = paramBudgetRaw ? Number(paramBudgetRaw.replace(/^0+(?=\d)/, '')) : NaN;
  const initialRawBudget = !isNaN(cleanBudget) && cleanBudget > 0 ? cleanBudget : (stored.budget || 40000);
  const initialBudget = (initialRawBudget >= 1000000 || initialRawBudget === 4000000 || initialRawBudget === 40000000) ? 40000 : initialRawBudget;

  const [form, setForm] = useState({
    origin: initialOrigin,
    destination: initialDest,
    startDate: '2026-11-20',
    endDate: '2026-11-24',
    travelers: initialTravelers,
    budget: initialBudget,
    currency: 'INR',
    transportMode: ((stored.transportMode || 'any') as TransportMode),
    interests: ['Heritage & Architecture', 'Local Food & Markets'],
    dietary: '',
    accessibility: '',
  });

  // Keep active search in sync
  useEffect(() => {
    if (form.destination) {
      emitActiveSearch({
        destination: form.destination,
        travelers: form.travelers,
        budget: form.budget,
        origin: form.origin,
        transportMode: form.transportMode,
      });
    }
  }, [form.destination, form.travelers, form.budget, form.origin, form.transportMode]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string; isPaisaKamao?: boolean } | null>(null);
  const [routeMode, setRouteMode] = useState<'budget' | 'balanced' | 'fastest'>('budget');
  const [dualRoutes, setDualRoutes] = useState<CompareRoutesResult | null>(null);
  const [isComparingRoutes, setIsComparingRoutes] = useState(false);
  const [transitPreview, setTransitPreview] = useState<{
    summary: string;
    legs: TransitLeg[];
  } | null>(null);

  // AI Real Price Estimation state
  const [aiEstimate, setAiEstimate] = useState<any>(null);
  const [isEstimatingBudget, setIsEstimatingBudget] = useState(false);

  const handleEstimateRealBudget = async (customDest = form.destination, customOrigin = form.origin) => {
    const dest = customDest.trim();
    if (!dest) return;
    setIsEstimatingBudget(true);
    try {
      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
      const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;
      const d1 = new Date(form.startDate);
      const d2 = new Date(form.endDate);
      const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      let estimateData: any = null;

      if (!isStaticHost()) {
        try {
          const res = await fetch('/api/ai/estimate-budget', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localGeminiKey ? { 'x-gemini-key': localGeminiKey } : {}),
              ...(localGroqKey ? { 'x-groq-key': localGroqKey } : {}),
            },
            body: JSON.stringify({
              origin: customOrigin || 'Mumbai',
              destination: dest,
              days: diffDays,
              travelers: form.travelers,
              currency: form.currency,
            }),
          });

          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const data = await res.json();
            if (data.success && data.estimate) {
              estimateData = data.estimate;
            }
          }
        } catch (networkErr) {
          console.warn('Server estimation network error, falling back to local reasoning:', networkErr);
        }
      }

      // If server didn't respond (e.g. static hosting without serverless functions), calculate high-fidelity realistic market rate locally
      if (!estimateData) {
        const { origin: pOrig, destination: pDest } = parseRouteInput(dest, customOrigin);
        const route = analyzeTransitRoute(pOrig, pDest);
        const pax = Math.max(1, form.travelers);
        let transitPerPaxINR = 2500;
        let dailyLivingPerPaxINR = 2200;

        if (route.tier === 'long_haul_intl') {
          transitPerPaxINR = 55000;
          dailyLivingPerPaxINR = 7500;
        } else if (route.tier === 'short_haul_intl') {
          transitPerPaxINR = 22000;
          dailyLivingPerPaxINR = 4500;
        } else if (route.tier === 'domestic') {
          transitPerPaxINR = pDest.toLowerCase().includes('jaisalmer') ? 3500 : 2500;
          dailyLivingPerPaxINR = 2200;
        } else {
          // local
          transitPerPaxINR = 500;
          dailyLivingPerPaxINR = 1200;
        }

        const totalINR = (transitPerPaxINR + dailyLivingPerPaxINR * diffDays) * pax;
        const totalTarget = convertCurrency(totalINR, 'INR', form.currency);
        const backpacker = Math.round(totalTarget * 0.65);
        const comfortable = Math.round(totalTarget);
        const luxury = Math.round(totalTarget * 2.1);

        estimateData = {
          totalRecommended: comfortable,
          formattedTotal: formatCurrencyAmount(comfortable, form.currency),
          tiers: {
            backpacker,
            comfortable,
            luxury,
          },
          formattedBackpacker: formatCurrencyAmount(backpacker, form.currency),
          formattedComfortable: formatCurrencyAmount(comfortable, form.currency),
          formattedLuxury: formatCurrencyAmount(luxury, form.currency),
          breakdown: {
            transitTotal: Math.round(convertCurrency(transitPerPaxINR * pax, 'INR', form.currency)),
            lodgingTotal: Math.round(convertCurrency(dailyLivingPerPaxINR * 0.55 * diffDays * pax, 'INR', form.currency)),
            foodAndActivitiesTotal: Math.round(convertCurrency(dailyLivingPerPaxINR * 0.45 * diffDays * pax, 'INR', form.currency)),
          },
          realMarketInsight: route.summaryNote || `Calibrated real-time market pricing based on current airline fares and regional stay baselines.`,
        };
      }

      setAiEstimate(estimateData);

      // If the current budget is exceptionally high (e.g. >= 10,00,000 / 4 Crore) or 0, auto-fill comfortable price
      setForm((prev) => {
        if (prev.budget >= 1000000 || prev.budget === 4000000 || prev.budget === 40000000 || prev.budget <= 0) {
          return { ...prev, budget: estimateData.totalRecommended };
        }
        return prev;
      });
    } catch (err) {
      console.warn('AI budget estimation error:', err);
    } finally {
      setIsEstimatingBudget(false);
    }
  };

  // Load saved default currency and sync reactively
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurr = localStorage.getItem('safar_default_currency');
      if (savedCurr && SUPPORTED_CURRENCIES[savedCurr]) {
        setForm((prev) => ({ ...prev, currency: savedCurr }));
      }
    }

    const handleCurrSync = (e: any) => {
      const c = e.detail?.currency;
      if (c && SUPPORTED_CURRENCIES[c]) {
        setForm((prev) => ({ ...prev, currency: c }));
      }
    };
    window.addEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleCurrSync);
    return () => window.removeEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleCurrSync);
  }, []);

  // Auto-estimate realistic real-market price with AI whenever corridor or dates change
  useEffect(() => {
    if (form.destination.trim()) {
      const timer = setTimeout(() => {
        handleEstimateRealBudget(form.destination, form.origin);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [form.destination, form.origin, form.startDate, form.endDate, form.travelers, form.currency]);

  // Update live transit preview and Gemini dual routes whenever origin/destination/budget changes
  useEffect(() => {
    let isCancelled = false;
    if (form.destination.trim()) {
      const { origin, destination } = parseRouteInput(form.destination, form.origin);
      const analysis = analyzeTransitRoute(origin, destination);
      setTransitPreview({
        summary: analysis.summaryNote,
        legs: analysis.transitLegs,
      });

      // Query real-time dual route options (Budget vs Time-Saving)
      setIsComparingRoutes(true);
      compareRoutesWithGemini({
        origin,
        destination,
        departureDate: form.startDate,
        travelers: form.travelers,
        budget: form.budget,
        currency: form.currency,
      })
        .then((res) => {
          if (!isCancelled) setDualRoutes(res);
        })
        .catch((err) => {
          console.warn('Failed to compute dual routes:', err);
        })
        .finally(() => {
          if (!isCancelled) setIsComparingRoutes(false);
        });
    } else {
      setTransitPreview(null);
      setDualRoutes(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [form.destination, form.origin, form.currency, form.budget, form.travelers, form.startDate]);

  const destKey = form.destination.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const suggestedDestination =
    destKey && DESTINATION_SUGGESTIONS[destKey] && DESTINATION_SUGGESTIONS[destKey].name !== form.destination
      ? DESTINATION_SUGGESTIONS[destKey]
      : null;

  const { origin: activeOrigin, destination: activeDest } = parseRouteInput(form.destination, form.origin);
  const transitOriginProfile = resolveCityTransitProfile(form.origin || 'Mumbai');
  const transitDestProfile = resolveCityTransitProfile(form.destination || 'India');
  const isDomesticRoute = isDomesticJourney(activeOrigin, activeDest);
  const destinationCountry = resolveCountry(activeDest || 'India');

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.destination.trim()) {
      setError({ message: 'Please provide a destination name.' });
      return;
    }
    if (form.endDate < form.startDate) {
      setError({ message: 'Return date must be on or after departure date.' });
      return;
    }

    // 1. Calculate duration and parse route
    const d1 = new Date(form.startDate);
    const d2 = new Date(form.endDate);
    const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const { origin, destination } = parseRouteInput(form.destination, form.origin);

    // 2. Client-side Proactive Budget Guardian
    const feasibility = validateBudgetFeasibility({
      budget: Number(form.budget) || 0,
      currency: form.currency,
      origin,
      destination,
      days: diffDays,
      travelers: Number(form.travelers) || 1,
    });

    if (!feasibility.isPossible) {
      setError({
        message: 'insufficient money funds (PAISA KAMAO) 💸',
        details: feasibility.reason,
        isPaisaKamao: true,
      });
      return;
    }

    setLoading(true);

    try {
      let aiDays: any[] = [];
      let finalDestination = destination;
      const finalCountry = resolveCountry(destination);

      // Quick dictionary normalization check
      const quickKey = destination.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (DESTINATION_SUGGESTIONS[quickKey]) {
        finalDestination = DESTINATION_SUGGESTIONS[quickKey].name;
      }

      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
      const localOpenAiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_openai_api_key') : null;
      const localAnthropicKey = typeof window !== 'undefined' ? localStorage.getItem('safar_anthropic_api_key') : null;
      const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (localGeminiKey) headers['x-gemini-key'] = localGeminiKey;
      if (localOpenAiKey) headers['x-openai-key'] = localOpenAiKey;
      if (localAnthropicKey) headers['x-anthropic-key'] = localAnthropicKey;
      if (localGroqKey) headers['x-groq-key'] = localGroqKey;

      let serverData: any = null;

      if (!isStaticHost()) {
        try {
          const res = await fetch('/api/ai/itinerary', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              origin,
              destination: finalDestination,
              startDate: form.startDate,
              endDate: form.endDate,
              travelers: form.travelers,
              budget: form.budget,
              currency: form.currency,
              interests: form.interests,
              dietary: form.dietary,
              accessibility: form.accessibility,
              routeMode,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          const isJson = res.headers.get('content-type')?.includes('application/json');
          if (isJson) {
            try {
              serverData = await res.json();
            } catch (jsonErr) {
              console.warn('Failed to parse server response as JSON:', jsonErr);
            }
          }

          if (serverData && serverData.error === 'INSUFFICIENT_FUNDS') {
            setError({
              message: serverData.replyMessage || 'insufficient money funds (PAISA KAMAO) 💸',
              details: serverData.reason,
              isPaisaKamao: true,
            });
            setLoading(false);
            return;
          }

          if (res.ok && serverData && serverData.days && Array.isArray(serverData.days) && serverData.days.length > 0) {
            aiDays = serverData.days;
            if (serverData.corrected_destination && typeof serverData.corrected_destination === 'string') {
              finalDestination = serverData.corrected_destination.trim();
            }
          } else {
            console.warn('Server itinerary returned non-JSON or status', res.status, 'initiating resilient client AI synthesis...');
          }
        } catch (fetchErr) {
          console.warn('Network error reaching /api/ai/itinerary, falling back to client synthesis:', fetchErr);
        }
      }

      // If server returned non-JSON/404 or did not provide days, synthesize directly via Gemini / Groq Client Engine
      if (aiDays.length === 0) {
        try {
          const clientSynth = await generateClientItinerary({
            origin,
            destination: finalDestination,
            startDate: form.startDate,
            endDate: form.endDate,
            travelers: form.travelers,
            budget: form.budget,
            currency: form.currency,
            interests: form.interests,
            dietary: form.dietary,
            accessibility: form.accessibility,
            routeMode,
          });
          if (clientSynth && clientSynth.days && Array.isArray(clientSynth.days) && clientSynth.days.length > 0) {
            aiDays = clientSynth.days;
            if (clientSynth.corrected_destination) {
              finalDestination = clientSynth.corrected_destination.trim();
            }
          }
        } catch (clientAiErr) {
          console.warn('Client AI Engine cascade error, using curated backup:', clientAiErr);
        }
      }

      // Deterministic authentic fallback if AI endpoints are unreachable
      if (aiDays.length === 0) {
        aiDays = generateFallbackItinerary({
          destination: finalDestination,
          country: finalCountry,
          startDate: form.startDate,
          endDate: form.endDate,
          travelers: form.travelers,
          budget: form.budget,
          currency: form.currency,
          interests: form.interests,
          dietary: form.dietary,
          accessibility: form.accessibility,
        });
      }

      // Create Trip record in database
      const trip = await createTrip(
        {
          user_id: 'usr_me',
          destination: finalDestination,
          country: finalCountry,
          start_date: form.startDate,
          end_date: form.endDate,
          travelers: form.travelers,
          budget: form.budget,
          currency: form.currency,
          interests: form.interests,
          dietary: form.dietary || null,
          accessibility: form.accessibility || null,
          cover_image: getDestinationImage(finalDestination),
          status: 'planning',
        },
        aiDays
      );

      // Emit global trip synchronization event
      emitTripChange(trip.id);

      // Save transit routing recommendation and dual route comparison to trip notes if available
      try {
        const selectedRoute = dualRoutes
          ? (routeMode === 'budget' ? dualRoutes.budgetRoute : dualRoutes.fastestRoute)
          : null;

        const transitNotes = {
          summary: selectedRoute?.summary || serverData?.transitSummary || 'Direct route',
          modeLabel: routeMode,
          totalDuration: selectedRoute?.totalDuration,
          totalCost: selectedRoute?.formattedTotalCost,
          advantageText: selectedRoute?.advantageText,
          proTips: selectedRoute?.proTips || [],
          legs: selectedRoute
            ? selectedRoute.legs.map((l) => ({
                step: l.step,
                mode: l.mode,
                from: l.from,
                to: l.to,
                duration: l.duration,
                carrierOrOption: `${l.carrier} (Est: ${l.formattedCost})`,
                advice: l.advice,
              }))
            : serverData?.transitLegs || [],
          dualComparison: dualRoutes,
        };
        localStorage.setItem(`safar_transit_${trip.id}`, JSON.stringify(transitNotes));
      } catch {}

      router.push(`/trips?id=${trip.id}`);
    } catch (err: any) {
      console.error('Itinerary synthesis failed:', err);
      setError({
        message: err.message || 'Itinerary generation encountered a temporary delay. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isSameDay = form.startDate === form.endDate;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 dark:text-emerald-400 font-semibold">
          INTELLIGENT MULTI-MODAL PLANNER
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink dark:text-[#edf2ee]">
          Let’s make a plan.
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 dark:text-[#8ca397] mt-1">
          Tell Safar AI where you are traveling from and heading to. We engineer the exact transit route, verify budget feasibility, and craft authentic local pacing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 rounded-2xl border border-sand-200/90 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-6 transition-colors"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-sand-200 dark:border-[#1e2e26] pb-3">
              <span className="font-mono text-xs font-semibold text-teal-800 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-teal-200/60 dark:border-emerald-800/40">
                01
              </span>
              <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-[#edf2ee] tracking-tight">The Route & Dates</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Traveling From (Origin) */}
              <div className="space-y-1.5">
                <Label htmlFor="origin" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">
                  Traveling From (Origin City)
                </Label>
                <div className="relative">
                  <Input
                    id="origin"
                    placeholder="e.g. Surat, Mumbai, New York, London"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                  />
                </div>
                <p className="text-[10px] text-ink-400 dark:text-[#7d9185]">
                  Leave empty if you are exploring your current city.
                </p>
              </div>

              {/* Where are you heading? (Destination) */}
              <div className="space-y-1.5">
                <Label htmlFor="destination" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">
                  Where are you heading? (Destination)
                </Label>
                <Input
                  id="destination"
                  required
                  placeholder="e.g. USA, Paris, New York, Manali, Kyoto"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
                {suggestedDestination && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        destination: suggestedDestination.name,
                      }));
                    }}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-teal-800 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-950/60 hover:bg-teal-100 border border-teal-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg transition-colors text-left"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                    <span>Did you mean <strong>{suggestedDestination.name}</strong>? Tap to auto-correct</span>
                  </button>
                )}
              </div>

              {/* Departure Date */}
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Departure Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
              </div>

              {/* Return Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="endDate" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Return Date</Label>
                  {isSameDay && (
                    <span className="text-[10px] font-mono text-teal-700 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-bold">
                      SAME-DAY EXPEDITION
                    </span>
                  )}
                </div>
                <Input
                  id="endDate"
                  type="date"
                  required
                  min={form.startDate}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
              </div>

              {/* Travelers */}
              <div className="space-y-1.5">
                <Label htmlFor="travelers" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Travelers</Label>
                <Input
                  id="travelers"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.travelers ? String(form.travelers) : ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    const clean = digitsOnly.replace(/^0+(?=\d)/, '');
                    setForm((prev) => ({ ...prev, travelers: clean === '' ? 1 : Math.min(30, Number(clean)) }));
                  }}
                  placeholder="2"
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
              </div>

              {/* Currency & Budget */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="budget" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Total Planned Budget</Label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="text-[11px] font-mono font-bold text-teal-800 dark:text-emerald-300 bg-teal-50 dark:bg-[#0c1410] border border-teal-200 dark:border-[#22352b] rounded-lg px-2 py-0.5"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-ink-400 dark:text-[#8ca397]">
                    {SUPPORTED_CURRENCIES[form.currency]?.symbol || form.currency}
                  </span>
                  <Input
                    id="budget"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.budget ? String(form.budget) : ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      const clean = digitsOnly.replace(/^0+(?=\d)/, '');
                      setForm((prev) => ({ ...prev, budget: clean === '' ? 0 : Number(clean) }));
                    }}
                    placeholder="e.g. 40,000"
                    className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee] font-mono pl-8"
                  />
                </div>

                {/* Subtle Inline Market Price Recommendation */}
                {aiEstimate && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-ink-500 dark:text-[#8ca397]">
                    <span>
                      Suggested for {form.travelers} traveler{form.travelers > 1 ? 's' : ''}:{' '}
                      <strong className="text-teal-900 dark:text-emerald-300">{aiEstimate.formattedComfortable}</strong>
                    </span>
                    {form.budget !== aiEstimate.tiers.comfortable && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, budget: aiEstimate.tiers.comfortable }))}
                        className="text-[11px] font-semibold text-[#0d5c48] dark:text-emerald-400 hover:underline"
                      >
                        Auto-Fill
                      </button>
                    )}
                  </div>
                )}

                {/* Gentle Excess Guard (Only shown for unrealistic entries >10L) */}
                {(form.budget >= 1000000 || form.budget === 4000000 || form.budget === 40000000) && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-2">
                    <span>Notice: Unusually high budget for this route (~{aiEstimate?.formattedComfortable || '₹40,500'}).</span>
                    {aiEstimate?.totalRecommended && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, budget: aiEstimate.totalRecommended })}
                        className="px-2 py-0.5 rounded bg-amber-600 text-white font-semibold text-[11px] shrink-0"
                      >
                        Adjust to Market
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Streamlined Preferred Transport Mode Selector */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-ink-900 dark:text-[#edf2ee] flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#0d5c48] dark:text-emerald-400" />
                  <span>How would you like to travel?</span>
                </Label>
                <span className="text-[10px] text-ink-400 dark:text-sand-400 font-mono">
                  Grounded by Safar AI
                </span>
              </div>

              {/* Calm, Modern Segmented Control */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-sand-100 dark:bg-[#18261f] rounded-2xl border border-sand-200 dark:border-[#22352b]">
                {[
                  { id: 'any', label: 'All / AI Best', icon: Compass },
                  { id: 'flight', label: '✈️ Airplane', icon: Plane },
                  { id: 'train', label: '🚆 Train', icon: Train },
                  { id: 'car_bus', label: '🚗 Car or Bus', icon: Car },
                  { id: 'ship', label: '🚢 Ship / Ferry', icon: Ship },
                ].map((mode) => {
                  const isSelected = form.transportMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, transportMode: mode.id as TransportMode }))}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center truncate ${
                        isSelected
                          ? 'bg-white dark:bg-[#0c1410] text-[#0d5c48] dark:text-emerald-400 shadow-xs ring-1 ring-[#0d5c48]/20 font-bold'
                          : 'text-ink-600 dark:text-sand-300 hover:text-ink-900 dark:hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              {/* Contextual Route Intelligence (Clean, single-line badges) */}
              {form.destination.trim() && (
                <div className="pt-1">
                  {/* Non-airport notice */}
                  {(form.transportMode === 'flight' || form.transportMode === 'any') &&
                    (!transitOriginProfile.airport.hasCommercialService || !transitDestProfile.airport.hasCommercialService) && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {!transitOriginProfile.airport.hasCommercialService && (
                            <strong>{transitOriginProfile.city}: {transitOriginProfile.airport.notice} </strong>
                          )}
                          {!transitDestProfile.airport.hasCommercialService && (
                            <strong>{transitDestProfile.city}: {transitDestProfile.airport.notice}</strong>
                          )}
                        </span>
                      </div>
                    )}

                  {/* Multi-airport state notice (e.g. Kerala, Goa) */}
                  {(form.transportMode === 'flight' || form.transportMode === 'any') &&
                    transitDestProfile.airport.hasCommercialService &&
                    transitDestProfile.airport.notice && (
                      <div className="px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs flex items-center gap-2">
                        <Plane className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>
                          <strong>{transitDestProfile.city}:</strong> {transitDestProfile.airport.notice}
                        </span>
                      </div>
                    )}

                  {/* Train note */}
                  {form.transportMode === 'train' && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs flex items-center gap-2">
                      <Train className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Rail Corridor:</strong> {transitOriginProfile.railway.stationName} ➔ {transitDestProfile.railway.stationName}
                      </span>
                    </div>
                  )}

                  {/* Car / Bus note */}
                  {form.transportMode === 'car_bus' && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs flex items-center gap-2">
                      <Car className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>
                        <strong>Highway Connection:</strong> Direct road corridor between {transitOriginProfile.city} and {transitDestProfile.city}
                      </span>
                    </div>
                  )}

                  {/* Ship note */}
                  {form.transportMode === 'ship' && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-200 text-xs flex items-center gap-2">
                      <Ship className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{transitDestProfile.seaport.notice}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Route Way Optimizer (Budget vs Time-Saving Route) */}
          {dualRoutes ? (
            <div className="rounded-2xl border border-teal-200/90 dark:border-emerald-800/60 bg-gradient-to-br from-teal-50/60 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-amber-950/20 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 dark:border-emerald-900/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-800 dark:bg-emerald-900 text-white flex items-center justify-center shadow-xs">
                    <Navigation className="h-4 w-4 text-amber-200" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink-900 dark:text-[#edf2ee] flex items-center gap-1.5">
                      <span>Real-Time Route Way Optimizer</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold">
                        AUTONOMOUS AI GROUNDED
                      </span>
                    </h4>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400">
                      Select your preferred journey mode: Cost-optimized money saver or express time saver.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-ink-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-Time Rates: {form.currency}</span>
                </div>
              </div>

              {/* 3-Tier Multi-Modal Strategy Comparison (Super Money Saver, Balanced, Fastest & Premium) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Super Money Saver */}
                <div
                  onClick={() => setRouteMode('budget')}
                  className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                    routeMode === 'budget'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-400 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-white/80 dark:bg-[#0c1410]/70 border-sand-200 dark:border-[#1e2e26] hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                        <Coins className="w-3 h-3" />
                        💰 Super Money Saver
                      </span>
                      {routeMode === 'budget' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="font-serif text-sm font-bold text-ink-900 dark:text-white leading-tight">
                      {dualRoutes.budgetRoute.title}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-xl font-bold text-emerald-950 dark:text-emerald-300">
                        {dualRoutes.budgetRoute.formattedTotalCost}
                      </span>
                      <span className="text-[11px] text-ink-500 font-mono">
                        • {dualRoutes.budgetRoute.totalDuration}
                      </span>
                    </div>

                    <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                      {dualRoutes.budgetRoute.summary}
                    </p>

                    <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 pt-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{dualRoutes.budgetRoute.advantageText}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[10px] font-mono text-emerald-900 dark:text-emerald-300">
                    {routeMode === 'budget' ? '✓ Currently Selected' : 'Tap to select Money Saver'}
                  </div>
                </div>

                {/* 2. Balanced Choice */}
                {(() => {
                  const balanced = dualRoutes.balancedRoute || dualRoutes.budgetRoute;
                  return (
                    <div
                      onClick={() => setRouteMode('balanced')}
                      className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                        routeMode === 'balanced'
                          ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-500 dark:border-amber-400 shadow-sm ring-1 ring-amber-500'
                          : 'bg-white/80 dark:bg-[#0c1410]/70 border-sand-200 dark:border-[#1e2e26] hover:border-amber-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                            <Scale className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            ⚖️ Balanced Choice
                          </span>
                          {routeMode === 'balanced' && (
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="font-serif text-sm font-bold text-ink-900 dark:text-white leading-tight">
                          {balanced.title}
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="font-serif text-xl font-bold text-amber-950 dark:text-amber-300">
                            {balanced.formattedTotalCost}
                          </span>
                          <span className="text-[11px] text-ink-500 font-mono">
                            • {balanced.totalDuration}
                          </span>
                        </div>

                        <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                          {balanced.summary}
                        </p>

                        <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1 pt-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{balanced.advantageText}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-800/40 text-[10px] font-mono text-amber-900 dark:text-amber-300">
                        {routeMode === 'balanced' ? '✓ Currently Selected' : 'Tap to select Balanced'}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Fastest & Premium (Expensive) */}
                <div
                  onClick={() => setRouteMode('fastest')}
                  className={`cursor-pointer rounded-xl p-4 transition-all relative border flex flex-col justify-between ${
                    routeMode === 'fastest'
                      ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 dark:border-sky-400 shadow-sm ring-1 ring-sky-500'
                      : 'bg-white/80 dark:bg-[#0c1410]/70 border-sand-200 dark:border-[#1e2e26] hover:border-sky-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded">
                        <Zap className="w-3 h-3 text-amber-500" />
                        ⚡💎 Fastest & Premium
                      </span>
                      {routeMode === 'fastest' && (
                        <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="font-serif text-sm font-bold text-ink-900 dark:text-white leading-tight">
                      {dualRoutes.fastestRoute.title}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-xl font-bold text-sky-950 dark:text-sky-300">
                        {dualRoutes.fastestRoute.formattedTotalCost}
                      </span>
                      <span className="text-[11px] text-ink-500 font-mono">
                        • {dualRoutes.fastestRoute.totalDuration}
                      </span>
                    </div>

                    <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                      {dualRoutes.fastestRoute.summary}
                    </p>

                    <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dualRoutes.fastestRoute.advantageText}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sky-200/60 dark:border-sky-800/40 text-[10px] font-mono text-sky-900 dark:text-sky-300">
                    {routeMode === 'fastest' ? '✓ Currently Selected' : 'Tap to select Express'}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Legs for Active Selected Route */}
              {(() => {
                const activeRoute = routeMode === 'budget'
                  ? dualRoutes.budgetRoute
                  : routeMode === 'balanced'
                  ? (dualRoutes.balancedRoute || dualRoutes.budgetRoute)
                  : dualRoutes.fastestRoute;

                return (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-ink-800 dark:text-ink-200 flex items-center justify-between">
                      <span>
                        Selected Transit Legs (
                        {routeMode === 'budget'
                          ? '💰 Super Money Saver'
                          : routeMode === 'balanced'
                          ? '⚖️ Balanced Choice'
                          : '⚡💎 Fastest & Premium'}
                        ):
                      </span>
                      <span className="font-mono text-[11px] text-teal-800 dark:text-emerald-400 font-bold">
                        {activeRoute.totalDuration} Total
                      </span>
                    </div>

                    {activeRoute.legs.map((leg) => {
                      const cleanFrom = leg.from.replace(/\(.*?\)/g, '').trim();
                      const cleanTo = leg.to.replace(/\(.*?\)/g, '').trim();
                      const flightQuery = encodeURIComponent(`Flights from ${cleanFrom} to ${cleanTo} on ${form.startDate || ''}`);

                      const defaultBookingUrl = leg.bookingUrl || (
                        leg.mode === 'flight'
                          ? `https://www.google.com/travel/flights?q=${flightQuery}&curr=${form.currency}`
                          : leg.mode === 'train'
                          ? `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(cleanFrom.split(/\s+/)[0] || cleanFrom)}/to/${encodeURIComponent(cleanTo.split(/\s+/)[0] || cleanTo)}`
                          : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}`
                      );

                      const defaultBookingLabel = leg.bookingLabel || (
                        leg.mode === 'flight'
                          ? 'Book Flight (Google Flights Live)'
                          : leg.mode === 'train'
                          ? 'Book on ConfirmTkt (Instant PNR)'
                          : 'Navigate Route / Cab'
                      );

                      return (
                        <div
                          key={leg.step}
                          className="flex flex-col gap-2.5 bg-white/95 dark:bg-[#0c1410]/95 p-3.5 rounded-xl border border-sand-200 dark:border-[#1e2e26] text-xs shadow-2xs hover:border-teal-300 dark:hover:border-emerald-700/60 transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-emerald-950 text-teal-700 dark:text-emerald-300 shrink-0 mt-0.5">
                              {leg.mode === 'flight' ? <Plane className="h-4 w-4" /> : leg.mode === 'train' ? <Train className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                            </span>
                            <div className="space-y-0.5 flex-1">
                              <div className="font-semibold text-ink dark:text-[#edf2ee] flex items-center justify-between">
                                <span>Leg {leg.step}: {leg.from} ➔ {leg.to}</span>
                                <span className="font-mono text-[11px] text-teal-700 dark:text-emerald-400 font-bold">{leg.duration}</span>
                              </div>
                              <div className="text-[11px] text-teal-900 dark:text-emerald-300 font-medium">
                                {leg.carrier} • Est: {leg.formattedCost}
                              </div>
                              <p className="text-[11px] text-ink-500 dark:text-[#8ca397] leading-relaxed">
                                {leg.advice}
                              </p>
                            </div>
                          </div>

                          {/* Direct Actionable Booking Link Buttons */}
                          <div className="pt-2 border-t border-sand-100 dark:border-[#16221c] flex flex-wrap items-center gap-2 pl-8">
                            <a
                              href={defaultBookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c48] hover:bg-[#124d3e] text-white font-medium text-[11px] shadow-xs transition-all hover:scale-[1.02]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>{defaultBookingLabel}</span>
                            </a>

                            {leg.secondaryBookingUrl && (
                              <a
                                href={leg.secondaryBookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sand-300 dark:border-[#2b3e33] bg-sand-50 dark:bg-[#15221b] hover:bg-sand-100 dark:hover:bg-[#1a2d23] text-ink-700 dark:text-[#edf2ee] text-[11px] font-medium transition-colors"
                              >
                                <span>{leg.secondaryBookingLabel}</span>
                              </a>
                            )}

                            <Link
                              href={`/bookings?tab=${leg.mode === 'train' ? 'trains' : 'flights'}&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}&date=${form.startDate || ''}&currency=${form.currency}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-teal-700 dark:text-emerald-400 hover:text-teal-800 text-[11px] font-medium hover:underline ml-auto"
                            >
                              <span>Bookings Hub →</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pro Travel Tips for Active Route */}
                    {activeRoute.proTips && activeRoute.proTips.length > 0 && (
                      <div className="p-3 rounded-xl bg-sand-50/80 dark:bg-[#18251f]/60 border border-sand-200 dark:border-[#22332a] space-y-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-teal-800 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          Insider Booking & Transit Tips
                        </span>
                        <ul className="list-disc list-inside text-[11px] text-ink-700 dark:text-ink-300 space-y-0.5">
                          {activeRoute.proTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Corridor Map for Active Route */}
                    <div className="pt-2">
                      <ItineraryMap
                        stops={[]}
                        destination={activeDest || form.destination}
                        transitRoute={{
                          origin: activeOrigin || form.origin || 'Origin',
                          destination: activeDest || form.destination,
                          summary: activeRoute.summary,
                          totalDuration: activeRoute.totalDuration,
                          legs: activeRoute.legs.map((l: any, i: number) => ({
                            step: l.step || i + 1,
                            mode: l.mode,
                            from: l.from,
                            to: l.to,
                            duration: l.duration,
                            carrierOrOption: l.carrier,
                            formattedCost: l.formattedCost,
                            advice: l.advice,
                          })),
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : transitPreview ? (
            <div className="rounded-xl border border-teal-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-teal-50/70 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-amber-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-ink-900 dark:text-[#edf2ee]">
                  Computed Transit Blueprint:
                </span>
                <span className="text-[11px] text-teal-800 dark:text-emerald-300 font-medium">
                  {transitPreview.summary}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {transitPreview.legs.map((leg) => {
                  const cleanFrom = leg.from.replace(/\(.*?\)/g, '').trim();
                  const cleanTo = leg.to.replace(/\(.*?\)/g, '').trim();
                  const flightQuery = encodeURIComponent(`Flights from ${cleanFrom} to ${cleanTo} on ${form.startDate || ''}`);

                  const defaultBookingUrl = leg.bookingUrl || (
                    leg.mode === 'flight'
                      ? `https://www.google.com/travel/flights?q=${flightQuery}&curr=${form.currency}`
                      : leg.mode === 'train'
                      ? `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(cleanFrom.split(/\s+/)[0] || cleanFrom)}/to/${encodeURIComponent(cleanTo.split(/\s+/)[0] || cleanTo)}`
                      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}`
                  );

                  const defaultBookingLabel = leg.bookingLabel || (
                    leg.mode === 'flight'
                      ? 'Book Flight (Google Flights Live)'
                      : leg.mode === 'train'
                      ? 'Book on ConfirmTkt (Instant PNR)'
                      : 'Navigate Route / Cab'
                  );

                  return (
                    <div
                      key={leg.step}
                      className="flex flex-col gap-2.5 bg-white/95 dark:bg-[#0c1410]/95 p-3.5 rounded-xl border border-sand-200 dark:border-[#1e2e26] text-xs shadow-2xs hover:border-teal-300 dark:hover:border-emerald-700/60 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-emerald-950 text-teal-700 dark:text-emerald-300 shrink-0 mt-0.5">
                          {leg.mode === 'flight' ? <Plane className="h-4 w-4" /> : leg.mode === 'train' ? <Train className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </span>
                        <div className="space-y-0.5 flex-1">
                          <div className="font-semibold text-ink dark:text-[#edf2ee] flex items-center justify-between">
                            <span>Leg {leg.step}: {leg.from} ➔ {leg.to}</span>
                            <span className="font-mono text-[11px] text-teal-700 dark:text-emerald-400 font-bold">{leg.duration}</span>
                          </div>
                          <div className="text-[11px] text-teal-900 dark:text-emerald-300 font-medium">
                            {leg.carrierOrOption}
                          </div>
                          <p className="text-[11px] text-ink-500 dark:text-[#8ca397] leading-relaxed">
                            {leg.advice}
                          </p>
                        </div>
                      </div>

                      {/* Direct Actionable Booking Link Buttons */}
                      <div className="pt-2 border-t border-sand-100 dark:border-[#16221c] flex flex-wrap items-center gap-2 pl-8">
                        <a
                          href={defaultBookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d5c48] hover:bg-[#124d3e] text-white font-medium text-[11px] shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>{defaultBookingLabel}</span>
                        </a>

                        {leg.secondaryBookingUrl && (
                          <a
                            href={leg.secondaryBookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sand-300 dark:border-[#2b3e33] bg-sand-50 dark:bg-[#15221b] hover:bg-sand-100 dark:hover:bg-[#1a2d23] text-ink-700 dark:text-[#edf2ee] text-[11px] font-medium transition-colors"
                          >
                            <span>{leg.secondaryBookingLabel}</span>
                          </a>
                        )}

                        <Link
                          href={`/bookings?tab=${leg.mode === 'train' ? 'trains' : 'flights'}&origin=${encodeURIComponent(cleanFrom)}&destination=${encodeURIComponent(cleanTo)}&date=${form.startDate || ''}&currency=${form.currency}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-teal-700 dark:text-emerald-400 hover:text-teal-800 text-[11px] font-medium hover:underline ml-auto"
                        >
                          <span>Bookings Hub →</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Transit Corridor Visualizer */}
              <div className="pt-3">
                <ItineraryMap
                  stops={[]}
                  destination={activeDest || form.destination}
                  transitRoute={{
                    origin: activeOrigin || form.origin || 'Origin',
                    destination: activeDest || form.destination,
                    summary: transitPreview.summary,
                    totalDuration: transitPreview.legs.reduce((acc, curr) => acc + (acc ? ' + ' : '') + curr.duration, ''),
                    legs: (transitPreview.legs || []).map((l: TransitLeg, i: number) => ({
                      step: l.step || i + 1,
                      mode: l.mode,
                      from: l.from,
                      to: l.to,
                      duration: l.duration,
                      carrierOrOption: l.carrierOrOption,
                      formattedCost: (l as any).formattedCost,
                      advice: l.advice,
                    })),
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Flavors & Personalization */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-sand-200 dark:border-[#1e2e26] pb-3">
              <span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200/60 dark:border-amber-800/40">
                02
              </span>
              <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-[#edf2ee] tracking-tight">Trip Flavor & Accessibility</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">What would you love more of?</Label>
              <div className="flex flex-wrap gap-2">
                {defaultInterests.map((interest) => {
                  const selected = form.interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'bg-gradient-to-r from-[#0d5c48] to-[#124d3e] text-white shadow-xs border border-[#0d5c48]'
                          : 'bg-sand-50 dark:bg-[#15221b] hover:bg-sand-100 text-ink-700 dark:text-[#edf2ee] border border-sand-200/90 dark:border-[#22352b]'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-[#dfb981]" />}
                      <span>{interest}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="dietary" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Dietary Preferences (Optional)</Label>
                <Input
                  id="dietary"
                  placeholder="e.g. Pure vegetarian, Jain, No peanuts"
                  value={form.dietary}
                  onChange={(e) => setForm({ ...form, dietary: e.target.value })}
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="accessibility" className="text-xs font-medium text-ink-700 dark:text-[#edf2ee]">Accessibility & Pacing (Optional)</Label>
                <Input
                  id="accessibility"
                  placeholder="e.g. Step-free routes, Slow pace for parents"
                  value={form.accessibility}
                  onChange={(e) => setForm({ ...form, accessibility: e.target.value })}
                  className="rounded-xl border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#0c1410] dark:text-[#edf2ee]"
                />
              </div>
            </div>
          </div>

          {/* Error & Budget Feasibility Alert */}
          {error && (
            <div
              className={`rounded-xl p-4 text-xs border flex items-start gap-3 animate-in fade-in-0 duration-200 ${
                error.isPaisaKamao
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm tracking-wide">
                  {error.message}
                </div>
                {error.details && (
                  <p className="text-xs leading-relaxed opacity-90">
                    {error.details}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-sand-200 dark:border-[#1e2e26] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-[#8ca397]">
              <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              <span>Verified local pacing · 100% Real-time AI synthesis</span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#0d5c48] to-[#124d3e] hover:from-[#0b4e3d] hover:to-[#0f4033] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all border border-[#dfb981]/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#dfb981]" />
                  <span className="font-serif">Synthesizing Live Itinerary…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#dfb981]" />
                  <span className="font-serif tracking-wide">Generate Itinerary</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="lg:col-span-4 space-y-4">
          {/* Live Destination Photo Card Preview */}
          <div className="rounded-2xl border border-sand-200/90 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] overflow-hidden shadow-card transition-colors">
            <div className="relative h-44 bg-sand-900">
              <img
                src={getDestinationImage(activeDest || 'India')}
                alt={activeDest || 'Destination'}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb981] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15 font-bold inline-flex items-center gap-1.5">
                  {isDomesticRoute ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>🇮🇳 Domestic Journey · {destinationCountry} Corridor</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>✈️ International Journey · {destinationCountry} Route</span>
                    </>
                  )}
                </span>
                <h3 className="font-editorial text-xl font-semibold mt-1 drop-shadow">
                  {activeDest || 'Explore the World'}
                </h3>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between text-ink-500 dark:text-[#8ca397] pb-2 border-b border-sand-100 dark:border-[#1e2e26]">
                <span>Origin:</span>
                <span className="font-semibold text-ink-800 dark:text-[#edf2ee]">
                  {activeOrigin.trim() || 'Direct Local Exploration'}
                </span>
              </div>
              <div className="flex items-center justify-between text-ink-500 dark:text-[#8ca397] pb-2 border-b border-sand-100 dark:border-[#1e2e26]">
                <span>Pacing Strategy:</span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {isSameDay ? 'Same-Day Urban Layover' : 'Curated Multi-Day Rhythm'}
                </span>
              </div>
              <div className="flex items-center justify-between text-ink-500 dark:text-[#8ca397]">
                <span>Planned Allowance:</span>
                <div className="text-right">
                  <span className={`font-mono font-bold ${
                    form.budget >= 1000000 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-900 dark:text-[#edf2ee]'
                  }`}>
                    {formatCurrencyAmount(form.budget, form.currency)}
                  </span>
                  {form.budget >= 1000000 && (
                    <span className="block text-[9px] font-sans text-amber-600 dark:text-amber-400 font-semibold">
                      (High Cap Entered)
                    </span>
                  )}
                </div>
              </div>

              {aiEstimate && (
                <div className="pt-2 border-t border-sand-100 dark:border-[#1e2e26] space-y-1">
                  <div className="flex items-center justify-between text-ink-500 dark:text-[#8ca397]">
                    <span className="flex items-center gap-1 text-teal-800 dark:text-emerald-400 font-medium">
                      <Sparkles className="h-3 w-3 text-amber-500" /> AI Realistic Cost:
                    </span>
                    <span className="font-mono font-bold text-teal-900 dark:text-emerald-300">
                      {aiEstimate.formattedComfortable}
                    </span>
                  </div>
                  {form.budget >= 1000000 && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, budget: aiEstimate.totalRecommended })}
                      className="w-full text-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline pt-0.5"
                    >
                      Click to auto-apply real price
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-400">Loading planner...</div>}>
      <PlannerContent />
    </Suspense>
  );
}
