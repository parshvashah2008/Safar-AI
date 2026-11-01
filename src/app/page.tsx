'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  Compass,
  Globe2,
  IndianRupee,
  MapPin,
  Navigation,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDestinationImage } from '@/lib/constants/destination-images';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const featuredDestinations = [
  {
    name: 'Manali & Solang Valley',
    region: 'Himachal Pradesh, India',
    tag: 'Alpine pine forests, bohemian old havens & snow passes',
    budget: '₹28,000 - ₹42,000',
    duration: '4 - 5 Days',
    season: 'Autumn & Winter Snow',
    imageKey: 'manali',
  },
  {
    name: 'Kyoto & Arashiyama',
    region: 'Kansai, Japan',
    tag: 'Zen moss gardens, bamboo light & 8th century temples',
    budget: '₹1,20,000 - ₹1,65,000',
    duration: '6 - 7 Days',
    season: 'Spring Blossoms & Maple Dusk',
    imageKey: 'kyoto',
  },
  {
    name: 'Jaipur & Amer Fort',
    region: 'Rajasthan, India',
    tag: 'Pink havelis, royal astronomy & block print ateliers',
    budget: '₹25,000 - ₹38,000',
    duration: '3 - 4 Days',
    season: 'October to March',
    imageKey: 'jaipur',
  },
  {
    name: 'Sundarbans Biosphere',
    region: 'West Bengal, India',
    tag: 'Mangrove river cruises, estuarine silence & delta life',
    budget: '₹22,000 - ₹34,000',
    duration: '3 - 4 Days',
    season: 'November to March',
    imageKey: 'sundarbans',
  },
  {
    name: 'Amalfi Coast & Positano',
    region: 'Campania, Italy',
    tag: 'Pastel cliffside havens, lemon groves & azure sailing',
    budget: '₹1,80,000 - ₹2,50,000',
    duration: '5 - 6 Days',
    season: 'May to October',
    imageKey: 'amalfi',
  },
  {
    name: 'Varanasi (Benares)',
    region: 'Uttar Pradesh, India',
    tag: 'Ganga dawn reflections, sacred aarti & weaver alleys',
    budget: '₹16,000 - ₹26,000',
    duration: '3 - 4 Days',
    season: 'Winter Pilgrimage',
    imageKey: 'varanasi',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [quickSearch, setQuickSearch] = useState('');
  const [travelers, setTravelers] = useState('2');
  const [budget, setBudget] = useState('35000');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = quickSearch.trim() || 'Manali';
    router.push(`/plan?destination=${encodeURIComponent(dest)}&travelers=${travelers}&budget=${budget}`);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0b110e] text-[#111a16] dark:text-[#edf2ee] transition-colors">
      {/* Editorial Header */}
      <header className="sticky top-0 z-40 border-b border-[#e8e6df] dark:border-[#1e2e26] bg-[#ffffff]/85 dark:bg-[#121c17]/85 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#094032] via-[#0d5c48] to-[#12795f] text-white shadow-md shadow-emerald-950/10 transition-transform group-hover:scale-105">
              <Plane className="h-5 w-5 text-emerald-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-2xl font-semibold tracking-tight text-[#111a16] dark:text-[#edf2ee] flex items-center gap-1.5">
                SAFAR <span className="font-sans text-xs font-bold text-[#0d5c48] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">AI</span>
              </span>
              <span className="font-mono text-[9px] tracking-widest text-[#5f7067] dark:text-[#8ca397] uppercase font-medium">
                Bespoke Journeys & GPS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#4d5c54] dark:text-[#8ca397]">
            <Link href="/explore" className="hover:text-[#0d5c48] dark:hover:text-emerald-400 transition-colors">
              Destinations
            </Link>
            <Link href="/plan" className="hover:text-[#0d5c48] dark:hover:text-emerald-400 transition-colors">
              AI Planner
            </Link>
            <Link href="/copilot" className="hover:text-[#0d5c48] dark:hover:text-emerald-400 transition-colors">
              Copilot Concierge
            </Link>
            <Link href="/budget" className="hover:text-[#0d5c48] dark:hover:text-emerald-400 transition-colors">
              Budget Guardian
            </Link>
            <Link href="/wallet" className="hover:text-[#0d5c48] dark:hover:text-emerald-400 transition-colors">
              Trip Wallet
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Switch Toggle on Landing Page */}
            <ThemeToggle />

            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#33423a] dark:text-[#8ca397] hover:bg-[#f4f3ee] dark:hover:bg-[#18251f] dark:hover:text-white">
                My Trips
              </Button>
            </Link>
            <Link href="/plan">
              <Button size="sm" className="gap-2 bg-[#0d5c48] hover:bg-[#094032] text-white text-xs font-semibold px-4 h-9 rounded-xl shadow-sm shadow-emerald-950/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>Start Planning</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Subtle decorative atmospheric background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-emerald-100/50 via-amber-100/40 to-teal-50/20 dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-transparent blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 lg:px-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 bg-white/90 dark:bg-[#14231b]/90 px-3.5 py-1 text-xs font-semibold text-[#0d5c48] dark:text-emerald-300 shadow-2xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Grounded Real-Time AI · Live Geospatial Maps</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#0f1914] dark:text-[#f3f7f4] max-w-4xl mx-auto leading-[1.1]">
            Wander purposefully. <br />
            <span className="italic font-serif text-[#0d5c48] dark:text-emerald-400 font-bold">Spend honestly.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#2b3a32] dark:text-[#a8beaf] leading-relaxed font-medium">
            Bespoke day-by-day itineraries with authentic local pacing, verified decimal-safe budget caps, and real-time turn-by-turn GPS waypoints. Zero canned data.
          </p>

          {/* Interactive Quick Journey Planner Bar */}
          <div className="max-w-4xl mx-auto pt-6">
            <form
              onSubmit={handleQuickSubmit}
              className="rounded-2xl border border-[#e8e6df] dark:border-[#22352b] bg-white/95 dark:bg-[#121c17]/95 p-3 sm:p-4 shadow-[0_12px_40px_rgba(17,26,22,0.06)] backdrop-blur-xl flex flex-col md:flex-row items-center gap-3 transition-colors"
            >
              <div className="flex-1 w-full text-left px-3 py-1.5 border-b md:border-b-0 md:border-r border-[#f0eee9] dark:border-[#22352b]">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#73827a] dark:text-[#8ca397] font-bold">
                  Where to?
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="h-4 w-4 text-[#0d5c48] dark:text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="e.g. Manali, Kyoto, Varanasi, Amalfi"
                    className="w-full text-xs font-semibold text-[#111a16] dark:text-[#edf2ee] placeholder:text-[#97a59d] dark:placeholder:text-[#5f7368] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="w-full md:w-36 text-left px-3 py-1.5 border-b md:border-b-0 md:border-r border-[#f0eee9] dark:border-[#22352b]">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#73827a] dark:text-[#8ca397] font-bold">
                  Travelers
                </label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Users className="h-4 w-4 text-[#0d5c48] dark:text-emerald-400 shrink-0" />
                  <select
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    className="w-full text-xs font-semibold text-[#111a16] dark:text-[#edf2ee] focus:outline-none bg-transparent"
                  >
                    <option value="1">1 Solo</option>
                    <option value="2">2 Couple / Duo</option>
                    <option value="3">3 Friends</option>
                    <option value="4">4 Family</option>
                  </select>
                </div>
              </div>

              <div className="w-full md:w-44 text-left px-3 py-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#73827a] dark:text-[#8ca397] font-bold">
                  Planned Cap
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <IndianRupee className="h-3.5 w-3.5 text-[#0d5c48] dark:text-emerald-400 shrink-0" />
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="35000"
                    className="w-full text-xs font-semibold text-[#111a16] dark:text-[#edf2ee] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full md:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-[#094032] to-[#0d5c48] hover:from-[#063327] hover:to-[#094738] text-white font-semibold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span>Craft Journey</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-[#6c7d74] font-mono">
              <span className="font-semibold text-[#0d5c48]">Trending:</span>
              {['Manali', 'Kyoto', 'Rishikesh', 'Sundarbans', 'Goa'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickSearch(p)}
                  className="hover:text-[#0d5c48] hover:underline cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Photographic Destination Carousel */}
      <section className="py-16 border-t border-[#f0eee9] bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#0d5c48] font-bold">
                CURATED WANDERLUST
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-[#111a16]">
                Iconic Horizons
              </h2>
              <p className="text-xs sm:text-sm text-[#5f7067] mt-1">
                Hand-picked places calibrated with local culinary secrets and GPS waypoints.
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d5c48] hover:text-[#094032] transition-colors"
            >
              <span>Explore All 24 Destinations</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((d) => {
              const bgImg = getDestinationImage(d.imageKey);
              return (
                <div
                  key={d.name}
                  className="group relative overflow-hidden rounded-2xl border border-[#e8e6df] bg-white shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col"
                >
                  {/* Photo Canvas */}
                  <div className="relative h-56 w-full overflow-hidden bg-stone-200">
                    <img
                      src={bgImg}
                      alt={d.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111a16]/80 via-[#111a16]/20 to-transparent" />

                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-white/90 text-[#0d5c48] font-bold backdrop-blur-md">
                        {d.duration}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#111a16]/60 text-amber-200 backdrop-blur-md border border-white/20">
                        {d.season}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-200 block">
                        {d.region}
                      </span>
                      <h3 className="font-editorial text-xl font-medium tracking-tight leading-snug">
                        {d.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-[#4d5c54] leading-relaxed">
                      {d.tag}
                    </p>

                    <div className="pt-3 border-t border-[#f0eee9] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-[#88968f] block">EST. BUDGET</span>
                        <span className="font-semibold text-xs text-[#111a16] font-mono">{d.budget}</span>
                      </div>

                      <Link href={`/plan?destination=${encodeURIComponent(d.name)}`}>
                        <Button size="sm" variant="outline" className="text-xs h-8 rounded-lg border-[#dcd9d0] hover:border-[#0d5c48] hover:bg-emerald-50 text-[#0d5c48] font-semibold">
                          <span>Plan Trip</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 border-t border-[#f0eee9] dark:border-[#1e2e26] bg-[#faf9f6] dark:bg-[#0b110e] transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#0d5c48] dark:text-emerald-400 font-bold">
              THE SAFAR STANDARD
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight text-[#111a16] dark:text-[#edf2ee]">
              Built for real travellers.
            </h2>
            <p className="text-xs sm:text-sm text-[#5f7067] dark:text-[#8ca397]">
              Eliminating the frustrations of bloated aggregator apps and canned marketing itineraries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-7 shadow-card space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0d5c48] dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/40">
                <Navigation className="h-6 w-6" />
              </div>
              <h3 className="font-editorial text-xl font-medium text-[#111a16] dark:text-[#edf2ee]">
                Geospatial GPS Grounding
              </h3>
              <p className="text-xs text-[#4d5c54] dark:text-[#8ca397] leading-relaxed">
                Every suggested activity is tied to verified latitude and longitude coordinates with turn-by-turn navigation in Google Maps and realistic walking/driving transit buffers.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-7 shadow-card space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center border border-amber-200/80 dark:border-amber-800/40">
                <IndianRupee className="h-6 w-6" />
              </div>
              <h3 className="font-editorial text-xl font-medium text-[#111a16] dark:text-[#edf2ee]">
                Honest Decimal-Safe Guardian
              </h3>
              <p className="text-xs text-[#4d5c54] dark:text-[#8ca397] leading-relaxed">
                Set hard financial ceilings. Track actual spend vs budget velocity with zero floating-point math rounding bugs, multi-traveler group split calculators, and overspend warnings.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-7 shadow-card space-y-4 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/80 dark:border-teal-800/40">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-editorial text-xl font-medium text-[#111a16] dark:text-[#edf2ee]">
                Pure Live Intelligence
              </h3>
              <p className="text-xs text-[#4d5c54] dark:text-[#8ca397] leading-relaxed">
                Powered by Real-Time Neural Reasoning. No canned dummy scripts or rigged defaults. Authentic local dishes, hidden havelis, and sunrise vantage points curated live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e6df] dark:border-[#1e2e26] bg-white dark:bg-[#0c1410] py-12 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#6c7d74] dark:text-[#8ca397]">
          <div className="flex items-center gap-2">
            <span className="font-editorial text-lg font-semibold text-[#111a16] dark:text-[#edf2ee]">SAFAR AI</span>
            <span>·</span>
            <span>Your world. Your budget. Your journey.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/trips" className="hover:text-[#0d5c48] dark:hover:text-emerald-400">My Trips</Link>
            <Link href="/plan" className="hover:text-[#0d5c48] dark:hover:text-emerald-400">Planner</Link>
            <Link href="/copilot" className="hover:text-[#0d5c48] dark:hover:text-emerald-400">Copilot</Link>
            <Link href="/budget" className="hover:text-[#0d5c48] dark:hover:text-emerald-400">Budget</Link>
            <Link href="/explore" className="hover:text-[#0d5c48] dark:hover:text-emerald-400">Explore</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
