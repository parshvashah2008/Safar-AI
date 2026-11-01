'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileCheck2,
  FileText,
  Hotel,
  Info,
  MapPin,
  Plane,
  Plus,
  Search,
  Sparkles,
  Train,
  Utensils,
  Wallet,
  X,
  RefreshCw,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Luggage,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, formatDate } from '@/lib/utils';
import { getTrips } from '@/lib/services/trip-service';
import {
  searchRealTimeFlights,
  searchRealTimeTrains,
  searchRealTimeHotels,
  searchRealTimeDining,
  LiveFlightOffer,
  LiveTrainOffer,
  LiveHotelOffer,
  LiveDiningOffer,
} from '@/lib/services/live-pricing-service';
import {
  SUPPORTED_CURRENCIES,
  fetchLiveExchangeRates,
  formatCurrencyAmount,
} from '@/lib/services/currency-service';
import { formatTo12Hour, getCurrent12HourTime } from '@/lib/utils/time-format';
import { SYNC_EVENTS, emitCurrencyChange } from '@/lib/services/sync-bus';
import type { Booking, BookingType, Trip } from '@/types';

type SearchCategory = 'flight' | 'train' | 'hotel' | 'dining';

function BookingsContent() {
  const searchParams = useSearchParams();
  const initialTripId = searchParams?.get('tripId') || '';
  const initialCategory = (searchParams?.get('category') as SearchCategory) || 'flight';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);

  // Search Engine State
  const [activeCategory, setActiveCategory] = useState<SearchCategory>(initialCategory);
  const [searchOrigin, setSearchOrigin] = useState('Surat (STV)');
  const [searchDest, setSearchDest] = useState('New York (JFK)');
  const [searchDate, setSearchDate] = useState('2026-11-20');
  const [passengers, setPassengers] = useState<number>(1);
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business' | 'first'>('economy');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR');
  const [flightSort, setFlightSort] = useState<'cheapest' | 'fastest' | 'value'>('cheapest');
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'super_money_saver' | 'balanced' | 'fastest_expensive'>('all');
  const [nonStopOnly, setNonStopOnly] = useState<boolean>(false);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // AI Fare Advisor state
  const [aiFareAdvice, setAiFareAdvice] = useState<any>(null);
  const [aiFareLoading, setAiFareLoading] = useState(false);

  const fetchAiFareAdvice = async () => {
    setAiFareLoading(true);
    try {
      const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
      const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;
      const res = await fetch('/api/ai/flight-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localGeminiKey ? { 'x-gemini-key': localGeminiKey } : {}),
          ...(localGroqKey ? { 'x-groq-key': localGroqKey } : {}),
        },
        body: JSON.stringify({
          origin: searchOrigin,
          destination: searchDest,
          departureDate: searchDate,
          cabinClass,
          currency: selectedCurrency,
          passengers,
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.advice) {
          setAiFareAdvice(data.advice);
        }
      }
    } catch (e) {
      console.warn('AI flight advice error:', e);
    } finally {
      setAiFareLoading(false);
    }
  };

  // Live Exchange Rates state
  const [liveRates, setLiveRates] = useState<Record<string, number>>({ USD: 1, INR: 86.45, EUR: 0.94, GBP: 0.81 });
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string>('Live');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // New Manual Booking Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState<BookingType>('flight');
  const [code, setCode] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [checkIn, setCheckIn] = useState('');

  // Fetch exchange rates and stored currency
  useEffect(() => {
    async function initCurrencies() {
      if (typeof window !== 'undefined') {
        const savedCurrency = localStorage.getItem('safar_default_currency');
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          setSelectedCurrency(savedCurrency);
        }
      }
      try {
        const ratesData = await fetchLiveExchangeRates();
        setLiveRates(ratesData.rates);
        if (ratesData.lastUpdated) {
          setRatesLastUpdated(ratesData.lastUpdated);
        }
      } catch (err) {
        console.warn('Failed to fetch live rates for bookings:', err);
      }
    }
    initCurrencies();

    const handleCurrSync = (e: any) => {
      const c = e.detail?.currency;
      if (c && SUPPORTED_CURRENCIES[c]) {
        setSelectedCurrency(c);
      }
      if (e.detail?.rates) {
        setLiveRates(e.detail.rates);
      }
    };
    window.addEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleCurrSync);
    return () => window.removeEventListener(SYNC_EVENTS.CURRENCY_CHANGED, handleCurrSync);
  }, []);

  // Load Trips & Bookings
  useEffect(() => {
    async function loadData() {
      const allTrips = await getTrips();
      setTrips(allTrips);

      let activeId = initialTripId;
      if (!activeId && typeof window !== 'undefined') {
        const saved = localStorage.getItem('safar_last_active_trip_id');
        if (saved && allTrips.some((t) => t.id === saved)) {
          activeId = saved;
        }
      }
      if (!activeId && allTrips.length > 0) {
        activeId = allTrips[0].id;
      }
      setSelectedTripId(activeId);

      const activeTrip = allTrips.find((t) => t.id === activeId);
      if (activeTrip) {
        setSearchDest(activeTrip.destination);
        if (activeTrip.start_date) setSearchDate(activeTrip.start_date);
        if (activeTrip.currency && SUPPORTED_CURRENCIES[activeTrip.currency]) {
          setSelectedCurrency(activeTrip.currency);
        }
      }

      // Load bookings from storage
      let userBookings: Booking[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('safar_user_bookings');
          if (raw) userBookings = JSON.parse(raw);
        } catch {}
      }
      setBookings(userBookings);
    }
    loadData();
  }, [initialTripId]);

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safar_last_active_trip_id', tripId);
    }
    const t = trips.find((x) => x.id === tripId);
    if (t) {
      setSearchDest(t.destination);
      if (t.start_date) setSearchDate(t.start_date);
      if (t.currency && SUPPORTED_CURRENCIES[t.currency]) {
        setSelectedCurrency(t.currency);
      }
    }
  };

  const handleRefreshLivePrices = async () => {
    setIsRefreshing(true);
    try {
      const ratesData = await fetchLiveExchangeRates();
      setLiveRates(ratesData.rates);
      setRatesLastUpdated(ratesData.lastUpdated || getCurrent12HourTime());
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedTripId) return;

    const newBkg: Booking = {
      id: `bkg-${Date.now()}`,
      trip_id: selectedTripId,
      user_id: 'usr-demo-01',
      type,
      provider: provider.trim() || 'Direct Provider',
      provider_ref: code.trim() || null,
      title: title.trim(),
      status: 'confirmed',
      amount: amount ? Number(amount) : null,
      currency: selectedCurrency,
      check_in: checkIn ? `${checkIn}T12:00:00` : null,
      check_out: null,
      confirmation_code: code.trim() || null,
      details: {},
      cancellation_policy: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveBookingsState([newBkg, ...bookings]);
    setTitle('');
    setCode('');
    setProvider('');
    setAmount('');
    setCheckIn('');
    setShowAdd(false);
  };

  const saveBookingsState = (list: Booking[]) => {
    setBookings(list);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('safar_user_bookings', JSON.stringify(list));
      } catch {}
    }
  };

  const handleSelectCurrency = (newCurr: string) => {
    setSelectedCurrency(newCurr);
    emitCurrencyChange(newCurr, liveRates);
  };

  const handleSaveToPasses = (itemTitle: string, itemType: BookingType, itemProvider: string, costAmount?: number) => {
    if (!selectedTripId) return;

    const newBkg: Booking = {
      id: `bkg-${Date.now()}`,
      trip_id: selectedTripId,
      user_id: 'usr_me',
      type: itemType,
      provider: itemProvider,
      provider_ref: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      title: itemTitle,
      status: 'confirmed',
      amount: costAmount || null,
      currency: selectedCurrency,
      check_in: `${searchDate}T10:00:00`,
      check_out: null,
      confirmation_code: `SFR-${Math.floor(1000 + Math.random() * 9000)}`,
      details: { automatedVia: 'Safar AI Real-Time Booking Engine' },
      cancellation_policy: 'Standard policy applies via official provider',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveBookingsState([newBkg, ...bookings]);
    setSaveNotice(`Saved "${itemTitle}" directly to your Confirmed Passes!`);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  // Real-Time Results Calculations
  const rawFlightResults = useMemo(() => {
    return searchRealTimeFlights({
      origin: searchOrigin,
      destination: searchDest,
      departureDate: searchDate,
      passengers,
      cabinClass,
      currency: selectedCurrency,
      liveRates,
    });
  }, [searchOrigin, searchDest, searchDate, passengers, cabinClass, selectedCurrency, liveRates]);

  const flightResults = useMemo(() => {
    let list = [...rawFlightResults];
    if (nonStopOnly) {
      list = list.filter((f) => f.stops === 0);
    }
    if (strategyFilter !== 'all') {
      list = list.filter((f) => f.tier === strategyFilter);
    }
    if (flightSort === 'cheapest') {
      list.sort((a, b) => a.priceBreakdown.total - b.priceBreakdown.total);
    } else if (flightSort === 'fastest') {
      list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (flightSort === 'value') {
      list.sort((a, b) => (b.mealsIncluded ? 1 : 0) - (a.mealsIncluded ? 1 : 0));
    }
    return list;
  }, [rawFlightResults, nonStopOnly, strategyFilter, flightSort]);

  const trainResults = useMemo(() => {
    let list = searchRealTimeTrains(searchOrigin, searchDest, searchDate, selectedCurrency, liveRates);
    if (strategyFilter !== 'all') {
      list = list.filter((t) => t.tier === strategyFilter);
    }
    return list;
  }, [searchOrigin, searchDest, searchDate, selectedCurrency, liveRates, strategyFilter]);

  const hotelResults = useMemo(() => {
    let list = searchRealTimeHotels(searchDest, searchDate, undefined, selectedCurrency, liveRates);
    if (strategyFilter !== 'all') {
      list = list.filter((h) => h.tier === strategyFilter);
    }
    return list;
  }, [searchDest, searchDate, selectedCurrency, liveRates, strategyFilter]);

  const flightStrategyShowcase = useMemo(() => {
    const saver = rawFlightResults.find((f) => f.tier === 'super_money_saver') || rawFlightResults[0];
    const balanced = rawFlightResults.find((f) => f.tier === 'balanced') || rawFlightResults[1] || rawFlightResults[0];
    const fastest = rawFlightResults.find((f) => f.tier === 'fastest_expensive') || rawFlightResults[rawFlightResults.length - 1];
    return { saver, balanced, fastest };
  }, [rawFlightResults]);

  const diningResults = useMemo(() => {
    return searchRealTimeDining(searchDest, selectedCurrency, liveRates);
  }, [searchDest, selectedCurrency, liveRates]);

  const tripBookings = bookings.filter((b) => !selectedTripId || b.trip_id === selectedTripId);
  const filtered = tripBookings.filter((b) => (filter === 'all' ? true : b.type === filter));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e8e6df] dark:border-[#1e2e26] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-emerald-950/60 text-[#0d5c48] dark:text-emerald-300 border border-teal-200/60 dark:border-emerald-800/40">
              <Plane className="w-4 h-4" />
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-teal-800 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              REAL-TIME PRICES & MCP BOOKING ENGINE
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mt-1 text-ink-900 dark:text-[#edf2ee]">
            Live Bookings & Flight Fares
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            Real-time live flight prices, distance-calibrated rail fares, and verified stays across all 35+ global currencies with zero middleman surcharge.
          </p>
        </div>

        {/* Target Journey & Add Voucher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {trips.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-[#121c17] px-3.5 py-1.5 rounded-xl border border-sand-300 dark:border-[#1e2e26] shadow-2xs">
              <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Target Journey:</span>
              <select
                value={selectedTripId}
                onChange={(e) => handleTripChange(e.target.value)}
                className="text-xs font-semibold text-teal-950 dark:text-emerald-300 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.destination} ({formatMoney(t.budget, t.currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={() => setShowAdd(!showAdd)}
            variant="outline"
            className="text-xs gap-1.5 rounded-xl border-sand-300 dark:border-[#1e2e26] text-ink-700 dark:text-ink-200"
          >
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showAdd ? 'Close Form' : 'Manual Voucher'}</span>
          </Button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-2xs animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{saveNotice}</span>
          </div>
          <button onClick={() => setSaveNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual Booking Form */}
      {showAdd && (
        <form
          onSubmit={handleManualAdd}
          className="rounded-2xl border border-teal-200 dark:border-emerald-800/60 bg-white dark:bg-[#121c17] p-6 shadow-card space-y-4 animate-in fade-in-0 duration-200"
        >
          <div className="flex items-center gap-2 border-b border-sand-200 dark:border-[#1e2e26] pb-3">
            <Plus className="h-4 w-4 text-teal-700 dark:text-emerald-400" />
            <h3 className="font-serif text-lg font-bold text-ink-900 dark:text-white">Record Existing Voucher / PNR</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-ink-600 dark:text-ink-300">Booking Category</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BookingType)}
                className="w-full h-10 rounded-xl border border-sand-300 dark:border-[#1e2e26] bg-white dark:bg-[#18251f] px-3 text-xs text-ink-900 dark:text-white"
              >
                <option value="flight">Flight Ticket</option>
                <option value="train">Train (IRCTC)</option>
                <option value="hotel">Stay / Hotel</option>
                <option value="activity">Activity / Tour</option>
                <option value="car_rental">Car Rental</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="bkg-title" className="text-xs text-ink-600 dark:text-ink-300">Reservation Title</Label>
              <Input
                id="bkg-title"
                required
                placeholder="e.g. Air India AI-101 (BOM to JFK) or Vande Bharat C3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-sand-300 dark:border-[#1e2e26]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bkg-code" className="text-xs text-ink-600 dark:text-ink-300">Confirmation Code / PNR</Label>
              <Input
                id="bkg-code"
                placeholder="e.g. 2849104829 or AI-93821"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-xl border-sand-300 dark:border-[#1e2e26] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bkg-prov" className="text-xs text-ink-600 dark:text-ink-300">Provider</Label>
              <Input
                id="bkg-prov"
                placeholder="e.g. Air India, Google Flights, IRCTC"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="rounded-xl border-sand-300 dark:border-[#1e2e26]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bkg-amt" className="text-xs text-ink-600 dark:text-ink-300">Amount Paid ({selectedCurrency})</Label>
              <Input
                id="bkg-amt"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border-sand-300 dark:border-[#1e2e26] font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0d5c48] hover:bg-[#094032] text-white text-xs rounded-xl px-5">
              Save Pass
            </Button>
          </div>
        </form>
      )}

      {/* SECTION 1: Real-Time Travel Search Engine */}
      <div className="rounded-2xl border border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-200 dark:border-[#1e2e26] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#094032] to-[#0d5c48] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink-900 dark:text-white flex items-center gap-2">
                <span>Real-Time Travel Search Engine</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
                  LIVE RATES SYNCED
                </span>
              </h2>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Direct metasearch across Google Flights, IRCTC, Booking.com, and OpenTable with zero added commissions.
              </p>
            </div>
          </div>

          {/* Category Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sand-100 dark:bg-[#18251f] rounded-xl border border-sand-200 dark:border-[#22332a]">
            <button
              onClick={() => setActiveCategory('flight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'flight'
                  ? 'bg-white dark:bg-[#121c17] text-[#0d5c48] dark:text-emerald-400 shadow-xs'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Flights (Real-Time)</span>
            </button>

            <button
              onClick={() => setActiveCategory('train')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'train'
                  ? 'bg-white dark:bg-[#121c17] text-[#0d5c48] dark:text-emerald-400 shadow-xs'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Trains (IRCTC)</span>
            </button>

            <button
              onClick={() => setActiveCategory('hotel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'hotel'
                  ? 'bg-white dark:bg-[#121c17] text-[#0d5c48] dark:text-emerald-400 shadow-xs'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              <Hotel className="w-3.5 h-3.5" />
              <span>Stays & Hotels</span>
            </button>

            <button
              onClick={() => setActiveCategory('dining')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === 'dining'
                  ? 'bg-white dark:bg-[#121c17] text-[#0d5c48] dark:text-emerald-400 shadow-xs'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Tables & Dining</span>
            </button>
          </div>
        </div>

        {/* Live Search Parameter Bar */}
        <div className="p-4 bg-sand-50/70 dark:bg-[#18251f]/50 rounded-xl border border-sand-200 dark:border-[#1e2e26] space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-500 dark:text-ink-400">
                {activeCategory === 'hotel' || activeCategory === 'dining' ? 'Location / Destination' : 'Departing From (Origin)'}
              </Label>
              <Input
                value={activeCategory === 'hotel' || activeCategory === 'dining' ? searchDest : searchOrigin}
                onChange={(e) => {
                  if (activeCategory === 'hotel' || activeCategory === 'dining') {
                    setSearchDest(e.target.value);
                  } else {
                    setSearchOrigin(e.target.value);
                  }
                }}
                placeholder="e.g. Surat, Mumbai, London, JFK"
                className="h-9 text-xs rounded-lg bg-white dark:bg-[#121c17] border-sand-300 dark:border-[#22332a]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-500 dark:text-ink-400">
                {activeCategory === 'hotel' || activeCategory === 'dining' ? 'Property / Cuisine Style' : 'Flying To (Destination)'}
              </Label>
              <Input
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                placeholder="e.g. USA, New York, Tokyo, Dubai"
                className="h-9 text-xs rounded-lg bg-white dark:bg-[#121c17] border-sand-300 dark:border-[#22332a]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-500 dark:text-ink-400">Travel Date</Label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="h-9 text-xs rounded-lg bg-white dark:bg-[#121c17] border-sand-300 dark:border-[#22332a]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase text-ink-500 dark:text-ink-400">Display Currency</Label>
              <select
                value={selectedCurrency}
                onChange={(e) => handleSelectCurrency(e.target.value)}
                className="w-full h-9 rounded-lg border border-sand-300 dark:border-[#22332a] bg-white dark:bg-[#121c17] px-3 text-xs text-ink-900 dark:text-white font-mono"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.symbol}) — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary flight options when searching flights */}
          {activeCategory === 'flight' && (
            <div className="pt-2 border-t border-sand-200 dark:border-[#22332a] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px]">Travelers:</span>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="h-8 rounded-lg border border-sand-300 dark:border-[#22332a] bg-white dark:bg-[#121c17] px-2 text-xs text-ink-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} Passenger{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-ink-500 dark:text-ink-400 font-mono text-[11px]">Cabin:</span>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value as any)}
                    className="h-8 rounded-lg border border-sand-300 dark:border-[#22332a] bg-white dark:bg-[#121c17] px-2 text-xs text-ink-900 dark:text-white"
                  >
                    <option value="economy">Economy</option>
                    <option value="premium_economy">Premium Economy</option>
                    <option value="business">Business Class</option>
                    <option value="first">First Class</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-ink-700 dark:text-ink-300 font-medium">
                  <input
                    type="checkbox"
                    checked={nonStopOnly}
                    onChange={(e) => setNonStopOnly(e.target.checked)}
                    className="rounded border-sand-300 text-[#0d5c48] focus:ring-0"
                  />
                  <span>Non-stop only</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefreshLivePrices}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="h-8 text-xs gap-1.5 rounded-lg border-sand-300 dark:border-[#22332a]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
                  <span>{isRefreshing ? 'Checking...' : 'Refresh Live Prices'}</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* FLIGHT RESULTS (REAL-TIME LIVE PRICES) */}
        {/* ============================================================== */}
        {activeCategory === 'flight' && (
          <div className="space-y-5">
            {/* 3-Tier Strategy Comparison Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 1. Super Money Saver */}
              <button
                type="button"
                onClick={() => setStrategyFilter(strategyFilter === 'super_money_saver' ? 'all' : 'super_money_saver')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  strategyFilter === 'super_money_saver'
                    ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/40 shadow-sm'
                    : 'border-sand-200 dark:border-[#22352b] bg-white dark:bg-[#15221b] hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                    <span>💰 SUPER MONEY SAVER</span>
                  </span>
                  <span className="text-[10px] font-mono text-ink-400">Lowest Fare</span>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-bold font-serif text-ink-900 dark:text-[#edf2ee]">
                    {flightStrategyShowcase.saver?.priceBreakdown.formattedTotal || '—'}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
                    {flightStrategyShowcase.saver?.airline} • {flightStrategyShowcase.saver?.duration}
                  </div>
                  <p className="text-[11px] text-ink-500 dark:text-[#8ca397] mt-1 leading-relaxed">
                    Ultra-low corridor fare · Maximum savings · Essential 7kg cabin baggage
                  </p>
                </div>
              </button>

              {/* 2. Balanced Value */}
              <button
                type="button"
                onClick={() => setStrategyFilter(strategyFilter === 'balanced' ? 'all' : 'balanced')}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  strategyFilter === 'balanced'
                    ? 'border-teal-600 dark:border-teal-500 bg-teal-50 dark:bg-teal-950/60 ring-2 ring-teal-500/40 shadow-sm'
                    : 'border-sand-200 dark:border-[#22352b] bg-white dark:bg-[#15221b] hover:border-teal-500/50'
                }`}
              >
                <span className="absolute -top-2 right-3 font-mono text-[8px] bg-teal-800 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                  RECOMMENDED
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-teal-300 dark:border-teal-700">
                    <span>⚖️ BALANCED VALUE</span>
                  </span>
                  <span className="text-[10px] font-mono text-ink-400">Optimal Value</span>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-bold font-serif text-ink-900 dark:text-[#edf2ee]">
                    {flightStrategyShowcase.balanced?.priceBreakdown.formattedTotal || '—'}
                  </div>
                  <div className="text-xs font-semibold text-teal-800 dark:text-teal-300 mt-0.5">
                    {flightStrategyShowcase.balanced?.airline} • {flightStrategyShowcase.balanced?.duration}
                  </div>
                  <p className="text-[11px] text-ink-500 dark:text-[#8ca397] mt-1 leading-relaxed">
                    Balanced sweet spot · Checked 20kg baggage + hot meal included
                  </p>
                </div>
              </button>

              {/* 3. Fastest & Premium (Expensive) */}
              <button
                type="button"
                onClick={() => setStrategyFilter(strategyFilter === 'fastest_expensive' ? 'all' : 'fastest_expensive')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  strategyFilter === 'fastest_expensive'
                    ? 'border-amber-600 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500/40 shadow-sm'
                    : 'border-sand-200 dark:border-[#22352b] bg-white dark:bg-[#15221b] hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                    <span>⚡💎 FASTEST & PREMIUM</span>
                  </span>
                  <span className="text-[10px] font-mono text-ink-400">VIP Express</span>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-bold font-serif text-ink-900 dark:text-[#edf2ee]">
                    {flightStrategyShowcase.fastest?.priceBreakdown.formattedTotal || '—'}
                  </div>
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 mt-0.5">
                    {flightStrategyShowcase.fastest?.airline} • {flightStrategyShowcase.fastest?.duration}
                  </div>
                  <p className="text-[11px] text-ink-500 dark:text-[#8ca397] mt-1 leading-relaxed">
                    Express non-stop direct · Flagship widebody fleet & priority check-in
                  </p>
                </div>
              </button>
            </div>

            {/* Filter Bar with Strategy Chips & Sorting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sand-50/80 dark:bg-[#18251f]/60 p-3 rounded-xl border border-sand-200 dark:border-[#22332a]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase font-bold text-ink-500 dark:text-ink-400">Strategy:</span>
                <button
                  type="button"
                  onClick={() => setStrategyFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    strategyFilter === 'all'
                      ? 'bg-[#0d5c48] text-white shadow-xs'
                      : 'bg-white dark:bg-[#121c17] text-ink-700 dark:text-[#8ca397] border border-sand-200 dark:border-[#22332a]'
                  }`}
                >
                  All ({rawFlightResults.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyFilter('super_money_saver')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    strategyFilter === 'super_money_saver'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white dark:bg-[#121c17] text-ink-700 dark:text-[#8ca397] border border-sand-200 dark:border-[#22332a]'
                  }`}
                >
                  <span>💰 Super Money Saver</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyFilter('balanced')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    strategyFilter === 'balanced'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white dark:bg-[#121c17] text-ink-700 dark:text-[#8ca397] border border-sand-200 dark:border-[#22332a]'
                  }`}
                >
                  <span>⚖️ Balanced</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyFilter('fastest_expensive')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    strategyFilter === 'fastest_expensive'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white dark:bg-[#121c17] text-ink-700 dark:text-[#8ca397] border border-sand-200 dark:border-[#22332a]'
                  }`}
                >
                  <span>⚡💎 Fastest & Premium</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-400 font-mono text-[11px]">Sort:</span>
                <button
                  onClick={() => setFlightSort('cheapest')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    flightSort === 'cheapest' ? 'bg-[#0d5c48] text-white font-semibold' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'
                  }`}
                >
                  Cheapest
                </button>
                <button
                  onClick={() => setFlightSort('fastest')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    flightSort === 'fastest' ? 'bg-[#0d5c48] text-white font-semibold' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'
                  }`}
                >
                  Fastest
                </button>
                <button
                  onClick={() => setFlightSort('value')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    flightSort === 'value' ? 'bg-[#0d5c48] text-white font-semibold' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900'
                  }`}
                >
                  Best Value
                </button>
              </div>
            </div>

            {/* Autonomous AI Airfare Fare Forecaster & Booking Strategist */}
            <div className="rounded-2xl border border-teal-200 dark:border-emerald-800/60 bg-gradient-to-r from-teal-50/70 via-white to-amber-50/40 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-[#0c1410] p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 dark:border-emerald-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-800 dark:bg-emerald-900 text-white flex items-center justify-center shadow-2xs">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink dark:text-[#edf2ee] flex items-center gap-1.5">
                      <span>Autonomous AI Airfare Intelligence</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold">
                        CORRIDOR: {searchOrigin.split(' ')[0]} ➔ {searchDest.split(' ')[0]}
                      </span>
                    </h4>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={aiFareLoading}
                  onClick={fetchAiFareAdvice}
                  className="text-[11px] h-7 gap-1 border-teal-300 dark:border-emerald-700 text-teal-800 dark:text-emerald-300 hover:bg-teal-50 dark:hover:bg-[#1a2820]"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{aiFareLoading ? 'Analyzing Corridor…' : 'Analyze Corridor with AI'}</span>
                </Button>
              </div>

              {aiFareAdvice ? (
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-teal-900 dark:text-emerald-200">
                      🎯 {aiFareAdvice.recommendationHeadline}
                    </span>
                    <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
                      Best window: {aiFareAdvice.bestBookingWindow}
                    </span>
                  </div>

                  {aiFareAdvice.insiderRoutingHacks && aiFareAdvice.insiderRoutingHacks.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#15221b] border border-teal-100 dark:border-[#22352b] space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-teal-800 dark:text-emerald-400 block">
                        💡 AI Routing & Fare Strategy:
                      </span>
                      {aiFareAdvice.insiderRoutingHacks.map((hack: string, idx: number) => (
                        <p key={idx} className="text-[11px] text-ink-600 dark:text-[#a8beaf] leading-relaxed">
                          • {hack}
                        </p>
                      ))}
                    </div>
                  )}

                  {aiFareAdvice.luggageAndTransitAdvice && (
                    <p className="text-[11px] text-ink-500 dark:text-[#8ca397] font-medium pt-1">
                      🧳 {aiFareAdvice.luggageAndTransitAdvice}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-ink-500 dark:text-[#8ca397]">
                  <span>Click analyze to evaluate dynamic airline revenue management patterns, historical price surge curves, and multi-modal gateway hacks for this route.</span>
                  <button
                    onClick={fetchAiFareAdvice}
                    className="text-teal-800 dark:text-emerald-400 font-bold hover:underline shrink-0 ml-3"
                  >
                    Run AI Fare Scan →
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3.5">
              {flightResults.map((flight) => {
                const isExpanded = expandedOfferId === flight.id;
                return (
                  <div
                    key={flight.id}
                    className="rounded-2xl border border-sand-200 dark:border-[#1e2e26] p-5 bg-white dark:bg-[#15221b] shadow-2xs hover:shadow-card transition-all space-y-4"
                  >
                    {/* Top Row: Airline, Flight Code, Trend Tag & Seats Remaining */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-100 dark:border-[#22332a] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-teal-900 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-teal-200/80 dark:border-emerald-800/40">
                          {flight.airlineCode} • {flight.flightNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base font-bold text-ink-900 dark:text-white leading-tight">
                              {flight.airline}
                            </h4>
                            {flight.tierBadge && (
                              <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                {flight.tierBadge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-ink-400 font-mono">
                            {flight.aircraft} {flight.tierDescription ? `• ${flight.tierDescription}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          {flight.priceConfidenceText}
                        </span>
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                          ⚡ {flight.seatsRemaining} seats left at this fare
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Departure -> Duration -> Arrival + Live Price */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Origin Departure */}
                        <div>
                          <div className="font-serif text-2xl font-bold text-ink-900 dark:text-white">
                            {formatTo12Hour(flight.departureTime)}
                          </div>
                          <div className="font-mono text-xs font-semibold text-teal-800 dark:text-emerald-300">
                            {flight.originAirport.code}
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-ink-400 max-w-[160px] truncate">
                            {flight.originAirport.city}
                          </div>
                        </div>

                        {/* Flight Duration Visual Bar */}
                        <div className="flex flex-col items-center flex-1 px-4 text-center">
                          <span className="text-[11px] font-mono text-ink-400 flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-[#0d5c48] dark:text-emerald-400" />
                            {flight.duration}
                          </span>
                          <div className="w-full flex items-center gap-1">
                            <div className="h-0.5 bg-sand-300 dark:bg-[#22332a] flex-1 rounded-full relative">
                              {flight.stops > 0 && (
                                <span className="absolute left-1/2 -top-1 w-2 h-2 rounded-full bg-amber-500 -translate-x-1/2" />
                              )}
                            </div>
                            <Plane className="w-3.5 h-3.5 text-[#0d5c48] dark:text-emerald-400 rotate-90 shrink-0" />
                          </div>
                          <span className="text-[10px] font-mono font-medium text-ink-500 dark:text-ink-400 mt-1">
                            {flight.stopDetails}
                          </span>
                        </div>

                        {/* Destination Arrival */}
                        <div className="text-right">
                          <div className="font-serif text-2xl font-bold text-ink-900 dark:text-white">
                            {formatTo12Hour(flight.arrivalTime)}
                          </div>
                          <div className="font-mono text-xs font-semibold text-teal-800 dark:text-emerald-300">
                            {flight.destinationAirport.code}
                          </div>
                          <div className="text-[11px] text-ink-500 dark:text-ink-400 max-w-[160px] truncate ml-auto">
                            {flight.destinationAirport.city}
                          </div>
                        </div>
                      </div>

                      {/* Real-Time Price Callout */}
                      <div className="md:col-span-4 flex flex-col md:items-end justify-center md:border-l md:border-sand-200 md:dark:border-[#1e2e26] md:pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold">
                            LIVE PRICE
                          </span>
                        </div>
                        <div className="font-serif text-3xl font-bold text-teal-950 dark:text-emerald-300 mt-0.5">
                          {flight.priceBreakdown.formattedTotal}
                        </div>
                        <span className="text-[10px] font-mono text-ink-400 mt-0.5">
                          {passengers > 1 ? `Total for ${passengers} passengers` : 'Total per adult (taxes incl.)'}
                        </span>

                        <button
                          onClick={() => setExpandedOfferId(isExpanded ? null : flight.id)}
                          className="mt-2 text-[11px] font-mono text-teal-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide fare breakdown' : 'View fare breakdown'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Fare Breakdown */}
                    {isExpanded && (
                      <div className="p-3.5 rounded-xl bg-sand-50 dark:bg-[#18251f] border border-sand-200 dark:border-[#22332a] text-xs space-y-2 animate-in fade-in-0 duration-200">
                        <div className="font-mono text-[11px] font-bold text-ink-700 dark:text-ink-300 uppercase tracking-wider">
                          Real-Time Price Breakdown ({flight.priceBreakdown.currency})
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-sand-200 dark:border-[#22332a]">
                          <div>
                            <span className="text-[10px] text-ink-400 block font-mono">Air Base Fare</span>
                            <span className="font-semibold text-ink-900 dark:text-white">{flight.priceBreakdown.formattedBaseFare}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-400 block font-mono">Fuel Surcharge (YQ)</span>
                            <span className="font-semibold text-ink-900 dark:text-white">
                              {formatCurrencyAmount(flight.priceBreakdown.fuelSurcharge, flight.priceBreakdown.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-400 block font-mono">Airport Taxes & Fees</span>
                            <span className="font-semibold text-ink-900 dark:text-white">
                              {formatCurrencyAmount(flight.priceBreakdown.airportTaxes, flight.priceBreakdown.currency)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-400 block font-mono">Checked Baggage</span>
                            <span className="font-semibold text-teal-800 dark:text-emerald-300">{flight.baggageAllowance}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Links */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sand-100 dark:border-[#22332a]">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sand-100 dark:bg-[#18251f] text-ink-600 dark:text-ink-300 text-[11px]">
                          <Luggage className="w-3 h-3 text-[#0d5c48] dark:text-emerald-400" />
                          {flight.baggageAllowance}
                        </span>
                        {flight.mealsIncluded && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sand-100 dark:bg-[#18251f] text-ink-600 dark:text-ink-300 text-[11px]">
                            <Utensils className="w-3 h-3 text-[#0d5c48] dark:text-emerald-400" />
                            Meal Included
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sand-100 dark:bg-[#18251f] text-ink-600 dark:text-ink-300 text-[11px]">
                          <ShieldCheck className="w-3 h-3 text-[#0d5c48] dark:text-emerald-400" />
                          {flight.refundable ? 'Refundable Fare' : 'Standard Non-Refundable'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={flight.bookingLinks.googleFlights}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#094032] to-[#0d5c48] hover:from-[#063327] hover:to-[#094738] text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <span>Book via Google Flights (Zero Fee)</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                        </a>

                        <a
                          href={flight.bookingLinks.skyscanner}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-sand-300 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-700 dark:text-ink-200 text-xs font-medium transition-colors"
                        >
                          <span>Skyscanner Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleSaveToPasses(`${flight.airline} (${flight.flightNumber})`, 'flight', flight.airline, flight.priceBreakdown.total)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-sand-300 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-700 dark:text-ink-200 text-xs font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Pass</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TRAIN RESULTS (REAL-TIME RAIL FARES) */}
        {/* ============================================================== */}
        {activeCategory === 'train' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                IRCTC & National Rail Fares ({trainResults.length} Superfast Express Routes) • Grounded in {selectedCurrency}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStrategyFilter('all')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'all'
                      ? 'bg-[#0d5c48] text-white border-[#0d5c48]'
                      : 'border-sand-300 dark:border-[#22332a] text-ink-600 dark:text-ink-300 hover:bg-sand-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  All Routes
                </button>
                <button
                  onClick={() => setStrategyFilter('super_money_saver')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'super_money_saver'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'border-sand-300 dark:border-[#22332a] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  💰 Super Money Saver
                </button>
                <button
                  onClick={() => setStrategyFilter('balanced')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'balanced'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-sand-300 dark:border-[#22332a] text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  ⚖️ Balanced
                </button>
                <button
                  onClick={() => setStrategyFilter('fastest_expensive')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'fastest_expensive'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'border-sand-300 dark:border-[#22332a] text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  ⚡💎 Fastest & Premium
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trainResults.map((train, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-sand-200 dark:border-[#1e2e26] p-4 bg-white dark:bg-[#15221b] shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                          #{train.trainNumber}
                        </span>
                        {train.tierBadge && (
                          <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                            {train.tierBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-ink-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {train.duration}
                      </span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-ink-900 dark:text-white">{train.trainName}</h4>
                    {train.tierDescription && (
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">
                        {train.tierDescription}
                      </p>
                    )}
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                      {train.originStation} &rarr; {train.destStation}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-800 dark:text-emerald-400 mt-1.5">
                      <span>Dep: {formatTo12Hour(train.departureTime)}</span>
                      <span>•</span>
                      <span>Arr: {formatTo12Hour(train.arrivalTime)}</span>
                    </div>

                    <div className="mt-2.5 p-2 rounded-lg bg-sand-50 dark:bg-[#18251f] border border-sand-100 dark:border-[#22332a] space-y-1">
                      <span className="text-[10px] font-mono text-ink-400 block uppercase">Classes & Live Fares:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {train.classes.map((cls) => (
                          <span
                            key={cls.code}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#121c17] border border-sand-200 dark:border-[#22332a] text-ink-800 dark:text-ink-200"
                          >
                            <strong>{cls.code}:</strong> {cls.formattedPrice} ({cls.availability})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sand-100 dark:border-[#22332a] flex flex-col gap-2">
                    <a
                      href={train.bookingLinks.irctc}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0d5c48] hover:bg-[#094032] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Book on IRCTC (Zero Fee)</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                    </a>
                    <a
                      href={train.bookingLinks.confirmTkt}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg border border-sand-300 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-700 dark:text-ink-200 text-[11px] font-medium transition-colors"
                    >
                      <span>Check Seat PNR on ConfirmTkt</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleSaveToPasses(`${train.trainName} (#${train.trainNumber})`, 'train', 'IRCTC', train.classes[0]?.price)}
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg border border-sand-200 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-600 dark:text-ink-300 text-[11px] font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save as Planned Train Pass</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* HOTEL RESULTS (REAL-TIME NIGHTLY RATES) */}
        {/* ============================================================== */}
        {activeCategory === 'hotel' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Verified Stays & Free Cancellation Properties • Rates in {selectedCurrency}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStrategyFilter('all')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'all'
                      ? 'bg-[#0d5c48] text-white border-[#0d5c48]'
                      : 'border-sand-300 dark:border-[#22332a] text-ink-600 dark:text-ink-300 hover:bg-sand-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  All Properties
                </button>
                <button
                  onClick={() => setStrategyFilter('super_money_saver')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'super_money_saver'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'border-sand-300 dark:border-[#22332a] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  💰 Super Money Saver
                </button>
                <button
                  onClick={() => setStrategyFilter('balanced')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'balanced'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-sand-300 dark:border-[#22332a] text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  ⚖️ Balanced
                </button>
                <button
                  onClick={() => setStrategyFilter('fastest_expensive')}
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    strategyFilter === 'fastest_expensive'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'border-sand-300 dark:border-[#22332a] text-sky-800 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-[#18251f]'
                  }`}
                >
                  ⚡💎 Fastest & Premium
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hotelResults.map((hotel, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-sand-200 dark:border-[#1e2e26] p-4 bg-white dark:bg-[#15221b] shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                          ★ {hotel.rating} ({hotel.reviewCount} reviews)
                        </span>
                        {hotel.tierBadge && (
                          <span className="font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-emerald-900/60 text-teal-900 dark:text-emerald-200 border border-teal-300 dark:border-emerald-700">
                            {hotel.tierBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">Verified</span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-ink-900 dark:text-white leading-snug">{hotel.name}</h4>
                    {hotel.tierDescription && (
                      <p className="text-[11px] text-teal-800 dark:text-emerald-400 font-medium">
                        {hotel.tierDescription}
                      </p>
                    )}
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#0d5c48] shrink-0" />
                      <span>{hotel.location}</span>
                    </p>

                    <div className="mt-2 text-[11px] text-teal-800 dark:text-emerald-300 font-mono font-medium">
                      {hotel.roomType}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {hotel.perks.map((p, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 dark:bg-[#18251f] text-ink-600 dark:text-ink-300">
                          {p}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 pt-2 border-t border-sand-100 dark:border-[#22332a] flex items-center justify-between">
                      <span className="text-[10px] text-ink-400 font-mono">Real-Time Rate</span>
                      <span className="font-bold text-sm text-ink-900 dark:text-white">{hotel.formattedNightlyRate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sand-100 dark:border-[#22332a] flex flex-col gap-2">
                    <a
                      href={hotel.bookingLinks.googleHotels}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0d5c48] hover:bg-[#094032] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Direct Google Hotels</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                    </a>
                    <a
                      href={hotel.bookingLinks.bookingCom}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg border border-sand-300 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-700 dark:text-ink-200 text-[11px] font-medium transition-colors"
                    >
                      <span>Booking.com Deals</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleSaveToPasses(hotel.name, 'hotel', 'Direct Hotel', hotel.nightlyRate)}
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg border border-sand-200 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-600 dark:text-ink-300 text-[11px] font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Save Hotel Voucher</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* DINING RESULTS (REAL-TIME COVER ESTIMATES) */}
        {/* ============================================================== */}
        {activeCategory === 'dining' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Instant Table Booking & Verified Menus • Grounded in {selectedCurrency}
              </span>
              <a
                href={diningResults[0]?.bookingLinks.openTable || 'https://www.opentable.com'}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#0d5c48] dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>OpenTable Platform</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {diningResults.map((rest, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-sand-200 dark:border-[#1e2e26] p-4 bg-white dark:bg-[#15221b] shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                        ★ {rest.rating} ({rest.reviewCount} diners)
                      </span>
                      <span className="text-[10px] font-mono text-ink-400">{rest.timings}</span>
                    </div>

                    <h4 className="font-serif text-base font-bold text-ink-900 dark:text-white">{rest.name}</h4>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{rest.cuisine}</p>

                    <div className="mt-2.5 p-2 rounded-lg bg-sand-50 dark:bg-[#18251f] border border-sand-100 dark:border-[#22332a] text-[11px] text-ink-600 dark:text-ink-300">
                      <span className="font-semibold text-teal-900 dark:text-emerald-400 block mb-0.5">Chef Must-Try:</span>
                      <span>{rest.mustTryDish}</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-sand-100 dark:border-[#22332a] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-ink-400 font-mono">Estimated Spend</span>
                      <span className="font-semibold text-ink-900 dark:text-white">{rest.formattedCostPerPerson}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sand-100 dark:border-[#22332a] flex flex-col gap-2">
                    <a
                      href={rest.bookingLinks.openTable}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#0d5c48] hover:bg-[#094032] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Reserve on OpenTable</span>
                      <ExternalLink className="w-3.5 h-3.5 text-amber-200" />
                    </a>
                    <a
                      href={rest.bookingLinks.googleDining}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1 w-full py-1.5 rounded-lg border border-sand-300 dark:border-[#22332a] hover:bg-sand-50 dark:hover:bg-[#18251f] text-ink-700 dark:text-ink-200 text-[11px] font-medium transition-colors"
                    >
                      <span>Google Maps Menu & Reviews</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Confirmed Passes Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#0d5c48] dark:text-emerald-400" />
            <h2 className="font-serif text-xl font-bold text-ink-900 dark:text-white">
              Confirmed Travel Passes & Vouchers ({filtered.length})
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['all', 'flight', 'train', 'hotel', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-mono uppercase tracking-wider transition-all ${
                  filter === tab
                    ? 'bg-[#0d5c48] text-white font-semibold'
                    : 'bg-white dark:bg-[#15221b] border border-sand-200 dark:border-[#1e2e26] text-ink-600 dark:text-ink-300 hover:bg-sand-50 dark:hover:bg-[#18251f]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand-300 dark:border-[#22332a] bg-white/60 dark:bg-[#121c17]/60 p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-ink-300 mx-auto" />
            <h4 className="font-serif text-base font-bold text-ink-800 dark:text-ink-200">No Passes Saved Yet</h4>
            <p className="text-xs text-ink-400 max-w-md mx-auto">
              Search real-time flights, Vande Bharat trains, or hotels above and click &quot;Save Pass&quot; to keep your itinerary passes handy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((bkg) => (
              <div
                key={bkg.id}
                className="rounded-2xl border border-sand-200 dark:border-[#1e2e26] bg-white dark:bg-[#15221b] p-5 shadow-card hover:shadow-elevated transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {bkg.type}
                  </span>
                  <span className="font-mono text-[11px] text-ink-400">
                    {bkg.confirmation_code || bkg.provider_ref || 'CONFIRMED'}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold text-ink-900 dark:text-white leading-snug">{bkg.title}</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 flex items-center gap-1.5">
                    <span className="font-medium text-[#0d5c48] dark:text-emerald-400">{bkg.provider}</span>
                    {bkg.check_in && (
                      <>
                        <span>•</span>
                        <span>{formatDate(bkg.check_in)}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-sand-100 dark:border-[#1e2e26] flex items-center justify-between">
                  <span className="text-xs text-ink-400 font-mono">Amount</span>
                  <span className="font-bold text-sm text-ink-900 dark:text-white">
                    {bkg.amount ? formatMoney(bkg.amount, bkg.currency || 'INR') : 'Included / Confirmed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500 font-mono">Loading Real-Time Travel Booking Engine...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
