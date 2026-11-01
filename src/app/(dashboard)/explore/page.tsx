'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Compass,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  Sparkles,
  Plane,
  Sun,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDestinationImage } from '@/lib/constants/destination-images';
import { generateClientExploreDossier } from '@/lib/ai/client-ai-engine';
import { getStoredActiveSearch, useActiveSearch } from '@/lib/services/sync-bus';

interface Destination {
  id: string;
  name: string;
  region: string;
  country: string;
  category: 'India' | 'Japan' | 'Southeast Asia' | 'Slow Heritage' | 'Europe' | 'Wildlife & Nature';
  idealDuration: string;
  estBudget: string;
  bestMonths: string;
  flightTimeFromIndia: string;
  visaStatus: string;
  tagline: string;
  description: string;
  highlights: string[];
  gradient: string;
  accentColor: string;
  coordinates: { lat: number; lng: number };
}

const destinations: Destination[] = [
  {
    id: 'sundarbans',
    name: 'Sundarbans National Park',
    region: 'West Bengal',
    country: 'India',
    category: 'Wildlife & Nature',
    idealDuration: '3 - 4 Days',
    estBudget: '₹22,000 - ₹45,000',
    bestMonths: 'November to March',
    flightTimeFromIndia: 'Flight to Kolkata (CCU) + 3h scenic drive/boat from Godkhali',
    visaStatus: 'Domestic Travel (Forest Permit Required)',
    tagline: 'World’s largest delta mangrove forest, Royal Bengal Tigers, and tranquil estuarine boat safaris.',
    description:
      'A mystical UNESCO World Heritage biosphere crisscrossed by tidal waterways, mudflats, and dense mangrove islands. Experience quiet dawn cruises, watchtowers, and authentic Bengali vegetarian cuisine.',
    highlights: ['Sajnekhali Bird Sanctuary & Watchtower', 'Dobanki Canopy Walk over Mangrove Treetops', 'Pakhiralay Sunset Village Walk', 'Pure Bengali Vegetarian & Mishti Doi Feasts'],
    gradient: 'from-emerald-900 via-teal-900 to-stone-900',
    accentColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    coordinates: { lat: 21.9497, lng: 89.1833 },
  },
  {
    id: 'varanasi',
    name: 'Varanasi (Benares)',
    region: 'Uttar Pradesh',
    country: 'India',
    category: 'Slow Heritage',
    idealDuration: '3 - 4 Days',
    estBudget: '₹16,000 - ₹32,000',
    bestMonths: 'October to March',
    flightTimeFromIndia: 'Direct Flights to VNS (1.5h from Delhi, 2h from Mumbai)',
    visaStatus: 'Domestic Travel',
    tagline: 'Ancient ghats, dawn boat reflections, Ganga Aarti, and sacred labyrinthine alleyways.',
    description:
      'Mark Twain noted that Varanasi is older than history. Watch the dawn unfold over sacred riverfront steps, explore Banarasi silk weaving workshops, and attend twilight brass lamp ceremonies.',
    highlights: ['Sunrise Boat Ride from Assi to Dashashwamedh', 'Grand Evening Ganga Aarti at Dashashwamedh', 'Kashi Vishwanath Corridor & Golden Temple', 'Sarnath Dhamek Stupa & Deer Park'],
    gradient: 'from-amber-800 via-orange-900 to-stone-900',
    accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
    coordinates: { lat: 25.3176, lng: 82.9739 },
  },
  {
    id: 'ladakh',
    name: 'Leh & Ladakh',
    region: 'Ladakh',
    country: 'India',
    category: 'Wildlife & Nature',
    idealDuration: '6 - 8 Days',
    estBudget: '₹42,000 - ₹75,000',
    bestMonths: 'May to September',
    flightTimeFromIndia: 'Direct Flights to IXL (1.5h from Delhi)',
    visaStatus: 'Domestic Travel (Inner Line Permit for Protected Areas)',
    tagline: 'High-altitude cold desert, cobalt blue lakes, ancient cliffside monasteries, and starlit skies.',
    description:
      'Land of high passes surrounded by snow-draped Karakoram peaks. Unwind at Pangong Tso, navigate sand dunes in Nubra Valley, and experience centuries-old Buddhist chortens.',
    highlights: ['Pangong Tso Cobalt Lake', 'Nubra Valley Hunder Sand Dunes & Bactrian Camels', 'Thiksey & Hemis Cliff Monasteries', 'Khardung La Pass (17,982 ft)'],
    gradient: 'from-sky-900 via-blue-950 to-slate-900',
    accentColor: 'text-sky-800 bg-sky-50 border-sky-200',
    coordinates: { lat: 34.1526, lng: 77.5771 },
  },
  {
    id: 'hampi',
    name: 'Hampi',
    region: 'Karnataka',
    country: 'India',
    category: 'Slow Heritage',
    idealDuration: '3 - 4 Days',
    estBudget: '₹18,000 - ₹32,000',
    bestMonths: 'October to February',
    flightTimeFromIndia: 'Flight to Vidyanagar (VDY, 40min) or Hubli (HBX, 3h)',
    visaStatus: 'Domestic Travel',
    tagline: 'Surreal boulder-strewn landscapes, stone chariots, and monumental Vijayanagara ruins.',
    description:
      'The 14th-century capital of the Vijayanagara Empire feels like another planet with granite boulder hills, quiet coracle boat rides on the Tungabhadra, and musical pillared halls.',
    highlights: ['Virupaksha Temple & Hampi Bazaar', 'Vijaya Vittala Temple & Stone Chariot', 'Matanga Hill Sunrise Panorama', 'Tungabhadra Coracle River Ride'],
    gradient: 'from-amber-700 via-stone-800 to-stone-900',
    accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
    coordinates: { lat: 15.3350, lng: 76.4600 },
  },
  {
    id: 'tokyo',
    name: 'Tokyo & Mount Fuji',
    region: 'Kanto',
    country: 'Japan',
    category: 'Japan',
    idealDuration: '6 - 8 Days',
    estBudget: '₹1,15,000 - ₹1,85,000',
    bestMonths: 'March to May & October to December',
    flightTimeFromIndia: 'Direct Flights to HND/NRT (8 - 9h)',
    visaStatus: 'eVisa Available for Indian Passport Holders',
    tagline: 'Futuristic neon skyline meets historic temples, Michelin ramen, and views of Mount Fuji.',
    description:
      'The ultimate synthesis of tradition and hyper-modern precision. Ride bullet trains, explore Asakusa’s incense-filled alleys, and capture the iconic view of Mount Fuji behind Chureito Pagoda.',
    highlights: ['Senso-ji Temple & Nakamise Dori in Asakusa', 'Shibuya Crossing & Shibuya Sky Observation Deck', 'Chureito Pagoda & Lake Kawaguchiko Fuji Views', 'Tsukiji Outer Market Culinary Walk'],
    gradient: 'from-rose-900 via-purple-950 to-slate-900',
    accentColor: 'text-rose-800 bg-rose-50 border-rose-200',
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast & Positano',
    region: 'Campania',
    country: 'Italy',
    category: 'Europe',
    idealDuration: '5 - 7 Days',
    estBudget: '₹1,45,000 - ₹2,30,000',
    bestMonths: 'April to June & September to October',
    flightTimeFromIndia: 'Flight to Naples (NAP) via Rome/Munich (10 - 12h)',
    visaStatus: 'Schengen Visa Required',
    tagline: 'Pastel cliffside villages, azure Mediterranean waters, and terraced lemon groves.',
    description:
      'A legendary 50-kilometer stretch of coastline where vertical towns tumble into the Tyrrhenian Sea. Savor slow ferry rides, clifftop gardens in Ravello, and cliffside trattorias.',
    highlights: ['Path of the Gods (Sentiero degli Dei) Cliff Walk', 'Positano Spiaggia Grande & Pastel Streets', 'Villa Cimbrone Infinity Terrace in Ravello', 'Amalfi Cathedral & Handcrafted Lemon Gelato'],
    gradient: 'from-cyan-900 via-blue-900 to-indigo-950',
    accentColor: 'text-cyan-800 bg-cyan-50 border-cyan-200',
    coordinates: { lat: 40.6340, lng: 14.6027 },
  },
  {
    id: 'zermatt',
    name: 'Zermatt & Swiss Alps',
    region: 'Valais',
    country: 'Switzerland',
    category: 'Europe',
    idealDuration: '5 - 6 Days',
    estBudget: '₹1,65,000 - ₹2,60,000',
    bestMonths: 'June to September (Alpine Hiking) or Dec to April (Snow)',
    flightTimeFromIndia: 'Flight to Zurich (ZRH, 8.5h) + Scenic Glacier Train',
    visaStatus: 'Schengen Visa Required',
    tagline: 'Car-free alpine chalets, legendary Matterhorn peak, and pristine mountain air.',
    description:
      'Nestled beneath the pyramidal pyramid of the Matterhorn, Zermatt offers whisper-quiet electric cab streets, open-air cogwheel railways to 3,100 meters, and fireside fondue dining.',
    highlights: ['Gornergrat Cogwheel Train to Matterhorn Viewpoint', 'Matterhorn Glacier Paradise 360° Panorama', 'Five Lakes Alpine Walk (Riffelsee Reflection)', 'Car-Free Wooden Chalet Village Walk'],
    gradient: 'from-slate-800 via-teal-950 to-stone-900',
    accentColor: 'text-teal-800 bg-teal-50 border-teal-200',
    coordinates: { lat: 45.9765, lng: 7.7491 },
  },
  {
    id: 'surat',
    name: 'Surat & Rann of Kutch',
    region: 'Gujarat',
    country: 'India',
    category: 'India',
    idealDuration: '4 - 5 Days',
    estBudget: '₹24,000 - ₹42,000',
    bestMonths: 'November to February',
    flightTimeFromIndia: 'Direct Flights to STV (Surat) or Bhuj (BHJ)',
    visaStatus: 'Domestic Travel',
    tagline: 'World diamond capital, silk textile bazaars, and endless moonlit white salt marshes.',
    description:
      'Combine Gujarat’s entrepreneurial craft hub with the otherworldly stark beauty of the Great Rann of Kutch under a full moon, accompanied by rich Kathiyawadi dining.',
    highlights: ['Great Rann of Kutch White Salt Desert at Sunset', 'Kala Dungar (Black Hill) Panoramic Viewpoint', 'Surat Diamond Bourse & Zari Textile Markets', 'Traditional Gujarati Thali & Khaman Tasting'],
    gradient: 'from-amber-700 via-yellow-900 to-stone-900',
    accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
    coordinates: { lat: 21.1702, lng: 72.8311 },
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    region: 'Rajasthan',
    country: 'India',
    category: 'India',
    idealDuration: '4 - 5 Days',
    estBudget: '₹28,000 - ₹45,000',
    bestMonths: 'October to March',
    flightTimeFromIndia: 'Direct Flights (1h from Delhi, 2h from Mumbai)',
    visaStatus: 'Domestic Travel',
    tagline: 'Terracotta facades, royal observatories, and artisan textile craft.',
    description:
      'The Pink City balances magnificent Mughal-Rajput ramparts with vibrant bazaars, historic thali dining, and peaceful morning stepwells.',
    highlights: ['Amer Fort & Sheesh Mahal', 'Panna Meena Ka Kund Stepwell', 'Anokhi Museum of Hand Printing', 'Heritage Haveli Dinners'],
    gradient: 'from-amber-700/80 via-rose-800/80 to-amber-900',
    accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
    coordinates: { lat: 26.9124, lng: 75.7873 },
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'Kansai',
    country: 'Japan',
    category: 'Japan',
    idealDuration: '6 - 7 Days',
    estBudget: '₹95,000 - ₹1,40,000',
    bestMonths: 'March to May & October to November',
    flightTimeFromIndia: '8 - 10h (Transit via KIX/Tokyo)',
    visaStatus: 'eVisa Available for Indian Passport Holders',
    tagline: 'Centuries of zen rock gardens, moss temples, and tea ceremony traditions.',
    description:
      'Japan’s cultural heart offers quiet morning strolls along Philosopher’s Path, cedar forests in Arashiyama, and refined seasonal kaiseki dining.',
    highlights: ['Fushimi Inari Taisha (Dawn Walk)', 'Gion & Pontocho Twilight Alleys', 'Tenryu-ji Temple & Bamboo Grove', 'Uji Green Tea Tastings'],
    gradient: 'from-emerald-800/80 via-teal-900/90 to-slate-900',
    accentColor: 'text-teal-800 bg-teal-50 border-teal-200',
    coordinates: { lat: 35.0116, lng: 135.7681 },
  },
  {
    id: 'bali',
    name: 'Ubud & Uluwatu',
    region: 'Bali',
    country: 'Indonesia',
    category: 'Southeast Asia',
    idealDuration: '5 - 7 Days',
    estBudget: '₹55,000 - ₹85,000',
    bestMonths: 'April to October (Dry Season)',
    flightTimeFromIndia: 'Direct Flights to Denpasar (5.5h)',
    visaStatus: 'Visa on Arrival (e-VoA) Available',
    tagline: 'Emerald rice terraces, limestone sea cliffs, and tranquil wellness sanctuaries.',
    description:
      'From early morning ridge walks over misty valleys to cliffside ocean viewpoints, Bali remains one of the world’s most inviting island retreats.',
    highlights: ['Campuhan Ridge Walk at Sunrise', 'Tirta Empul Water Cleansing', 'Uluwatu Sunset Temple & Kecak Dance', 'Artisan Coffee Plantations'],
    gradient: 'from-teal-800/80 via-emerald-900/80 to-stone-900',
    accentColor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    coordinates: { lat: -8.5069, lng: 115.2625 },
  },
  {
    id: 'kochi',
    name: 'Kochi & Fort Kochi',
    region: 'Kerala',
    country: 'India',
    category: 'Slow Heritage',
    idealDuration: '4 - 5 Days',
    estBudget: '₹22,000 - ₹38,000',
    bestMonths: 'September to March',
    flightTimeFromIndia: 'Direct Flights to COK (2.5h from Delhi/Mumbai)',
    visaStatus: 'Domestic Travel',
    tagline: 'Cantilevered Chinese fishing nets, spice godowns, and colonial courtyard cafes.',
    description:
      'A serene maritime crossroads where Portuguese, Dutch, and Malabari influences blend effortlessly with contemporary art biennales.',
    highlights: ['Kathakali Cultural Centre', 'Jew Town Antiques & Synagogue', 'Backwater Canoe Excursion', 'Fresh Karimeen Fish Curries'],
    gradient: 'from-cyan-800/80 via-teal-900/80 to-slate-900',
    accentColor: 'text-teal-800 bg-teal-50 border-teal-200',
    coordinates: { lat: 9.9312, lng: 76.2673 },
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    region: 'Rajasthan',
    country: 'India',
    category: 'Slow Heritage',
    idealDuration: '3 - 4 Days',
    estBudget: '₹26,000 - ₹42,000',
    bestMonths: 'October to March',
    flightTimeFromIndia: 'Direct Flights to UDR (1.5h from Mumbai/Delhi)',
    visaStatus: 'Domestic Travel',
    tagline: 'White marble palaces shimmering across the tranquil waters of Lake Pichola.',
    description:
      'Often called the Venice of the East, Udaipur invites slow boat rides at sunset, heritage rooftop dining, and miniature painting workshops.',
    highlights: ['City Palace Complex', 'Lake Pichola Sunset Boat Cruise', 'Saheliyon-ki-Bari Gardens', 'Shilpgram Artisan Crafts Village'],
    gradient: 'from-rose-800/80 via-amber-900/80 to-stone-900',
    accentColor: 'text-rose-800 bg-rose-50 border-rose-200',
    coordinates: { lat: 24.5854, lng: 73.7125 },
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    region: 'Uttarakhand',
    country: 'India',
    category: 'India',
    idealDuration: '3 - 4 Days',
    estBudget: '₹14,000 - ₹24,000',
    bestMonths: 'September to November & March to May',
    flightTimeFromIndia: 'Flight to Dehradun (DED) + 40min Taxi',
    visaStatus: 'Domestic Travel',
    tagline: 'Himalayan foothills, turquoise Ganges rapids, and tranquil yoga ashrams.',
    description:
      'Where the holy river emerges from the high mountains. Perfect for riverside meditation, vegetarian organic bistros, and forest walking trails.',
    highlights: ['Triveni Ghat Evening Aarti', 'Beatles Ashram (Chaurasi Kutia)', 'Neer Garh Waterfall Hike', 'Organic Ayurvedic Dining'],
    gradient: 'from-teal-800/80 via-sky-900/80 to-slate-900',
    accentColor: 'text-teal-800 bg-teal-50 border-teal-200',
    coordinates: { lat: 30.0869, lng: 78.2676 },
  },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const { activeSearch } = useActiveSearch();
  const urlDest = searchParams?.get('destination') || '';
  const initialDestName = urlDest || activeSearch.destination || '';

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedDest, setSelectedDest] = useState<Destination>(() => {
    if (initialDestName) {
      const match = destinations.find(
        (d) => d.name.toLowerCase().includes(initialDestName.toLowerCase()) || d.id.toLowerCase() === initialDestName.toLowerCase()
      );
      if (match) return match;
    }
    return destinations[0];
  });

  // AI Instant Destination Intelligence state
  const [customQuery, setCustomQuery] = useState(initialDestName);
  const [customDossier, setCustomDossier] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateDossier = async (placeToSearch = customQuery) => {
    const q = placeToSearch.trim();
    if (!q) return;

    setAiGenerating(true);
    try {
      let loaded = false;
      try {
        const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
        const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;
        const res = await fetch('/api/ai/explore-dossier', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localGeminiKey ? { 'x-gemini-key': localGeminiKey } : {}),
            ...(localGroqKey ? { 'x-groq-key': localGroqKey } : {}),
          },
          body: JSON.stringify({
            destination: q,
            currency: 'INR',
            userOrigin: 'India',
          }),
        });

        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.dossier) {
            setCustomDossier(data.dossier);
            loaded = true;
          }
        }
      } catch (srvErr) {}

      // If server returned non-JSON/404 (e.g. GitHub Pages), synthesize directly with Gemini/Groq
      if (!loaded) {
        const dossier = await generateClientExploreDossier(q, 'INR');
        if (dossier) {
          setCustomDossier(dossier);
        }
      }
    } catch (e) {
      console.warn('AI destination dossier error:', e);
    } finally {
      setAiGenerating(false);
    }
  };

  // Auto-generate dossier if arriving with a search query from homepage
  useEffect(() => {
    if (initialDestName && !customDossier && !aiGenerating) {
      setCustomQuery(initialDestName);
      handleGenerateDossier(initialDestName);
    }
  }, [initialDestName]);

  const filtered =
    activeCategory === 'All' ? destinations : destinations.filter((d) => d.category === activeCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-200/80 dark:border-[#1e2e26] pb-6">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-teal-800 dark:text-emerald-400">
            A LITTLE WANDERLUST
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink-900 dark:text-[#edf2ee] tracking-tight mt-1">
            Somewhere, soon.
          </h1>
          <p className="text-sm text-ink-500 dark:text-[#8ca397] mt-2 max-w-xl">
            Explore curated global destinations or query Autonomous AI to craft a bespoke travel dossier for any place on Earth.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sand-100 dark:bg-[#15221b] rounded-xl border border-sand-200 dark:border-[#22352b]">
          {['All', 'India', 'Japan', 'Southeast Asia', 'Europe', 'Wildlife & Nature', 'Slow Heritage'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === tab
                  ? 'bg-white dark:bg-[#1f3026] text-ink-900 dark:text-emerald-300 shadow-xs font-semibold'
                  : 'text-ink-600 dark:text-[#8ca397] hover:text-ink-900 dark:hover:text-[#edf2ee] hover:bg-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Autonomous AI Instant Destination Dossier Bar */}
      <div className="rounded-2xl border border-teal-200 dark:border-emerald-800/60 bg-gradient-to-r from-teal-50/80 via-white to-amber-50/40 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-[#0c1410] p-4 sm:p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-ink-900 dark:text-[#edf2ee]">
              Autonomous AI Destination Dossier
            </span>
            <span className="text-[9px] font-mono uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
              WORLDWIDE COVERAGE
            </span>
          </div>
          <span className="text-[11px] text-ink-400 dark:text-[#8ca397] font-mono hidden sm:inline">
            Type any city, town, island, or region
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateDossier();
          }}
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1 w-full">
            <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-teal-600 dark:text-emerald-400" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g. Jaisalmer, Lake Como, Kasol, Mount Abu, Florence, Reykjavik..."
              className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-sand-300 dark:border-[#22352b] bg-white dark:bg-[#121c17] text-ink dark:text-[#edf2ee] placeholder:text-ink-400 dark:placeholder:text-[#6a7d73] focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <Button
            type="submit"
            disabled={aiGenerating || !customQuery.trim()}
            className="w-full sm:w-auto h-10 px-5 text-xs font-semibold bg-teal-800 hover:bg-teal-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white gap-2 shrink-0 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{aiGenerating ? 'Curating with AI…' : 'Curate Destination'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>

        <div className="flex items-center gap-2 text-[11px] text-ink-400 dark:text-[#8ca397] font-mono">
          <span>Quick queries:</span>
          {['Jaisalmer', 'Zermatt', 'Hampi', 'Amalfi Coast', 'Kyoto'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setCustomQuery(p);
                handleGenerateDossier(p);
              }}
              className="hover:text-teal-800 dark:hover:text-emerald-300 underline cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Render AI Curated Dossier Card when Available */}
      {customDossier && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-elevated space-y-6 animate-in fade-in-0 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-ivory-200 dark:border-[#1e2e26] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                  {customDossier.isDomestic ? 'DOMESTIC JOURNEY' : 'INTERNATIONAL DESTINATION'}
                </span>
                <span className="text-xs font-medium text-ink-400 dark:text-[#8ca397]">
                  {customDossier.country}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink dark:text-[#edf2ee]">
                {customDossier.name}
              </h2>
              <p className="text-xs text-teal-800 dark:text-emerald-400 font-medium mt-1">
                {customDossier.tagline}
              </p>
            </div>

            <Link href={`/plan?destination=${encodeURIComponent(customDossier.name)}`}>
              <Button size="sm" className="bg-gradient-to-r from-[#094032] to-[#0d5c48] hover:from-[#063327] hover:to-[#094738] text-white text-xs font-semibold gap-1.5 h-10 px-4 rounded-xl shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                <span>Craft Journey in AI Planner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-ink-600 dark:text-[#a8beaf] leading-relaxed">
            {customDossier.overview}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl border border-sand-200 dark:border-[#22352b] bg-[#faf9f6] dark:bg-[#15221b] space-y-1">
              <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Ideal Duration</span>
              <span className="text-sm font-bold text-ink dark:text-[#edf2ee]">{customDossier.idealDuration}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-sand-200 dark:border-[#22352b] bg-[#faf9f6] dark:bg-[#15221b] space-y-1">
              <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Best Travel Season</span>
              <span className="text-sm font-bold text-teal-800 dark:text-emerald-400">{customDossier.bestMonths}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-sand-200 dark:border-[#22352b] bg-[#faf9f6] dark:bg-[#15221b] space-y-1">
              <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Climate & Atmosphere</span>
              <span className="text-xs font-semibold text-ink dark:text-[#edf2ee]">{customDossier.climateVibe}</span>
            </div>
          </div>

          {/* Real Tourist Attractions & Monuments */}
          {customDossier.touristPlaces && customDossier.touristPlaces.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink dark:text-[#edf2ee] font-serif flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-emerald-400" />
                  <span>Must-Visit Tourist Attractions & Heritage Sites:</span>
                </span>
                <span className="text-[10px] font-mono text-ink-400 dark:text-[#8ca397]">
                  {customDossier.touristPlaces.length} Verified Landmarks
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customDossier.touristPlaces.map((att: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl border border-sand-200 dark:border-[#22352b] bg-white dark:bg-[#15221b] space-y-1.5 hover:border-teal-500/40 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-ink dark:text-[#edf2ee]">{att.name}</h4>
                      {att.category && (
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-emerald-950/60 text-teal-800 dark:text-emerald-300 text-[9px] font-mono font-semibold">
                          {att.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-500 dark:text-[#8ca397] leading-relaxed">{att.description}</p>
                    {att.bestTimeToVisit && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium pt-0.5">
                        🕒 Best time: {att.bestTimeToVisit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Authentic Local Restaurants & Cafes */}
          {customDossier.iconicRestaurants && customDossier.iconicRestaurants.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink dark:text-[#edf2ee] font-serif flex items-center gap-1.5">
                  <Utensils className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Authentic Local Restaurants & Eateries:</span>
                </span>
                <span className="text-[10px] font-mono text-ink-400 dark:text-[#8ca397]">
                  {customDossier.iconicRestaurants.length} Gastronomic Picks
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customDossier.iconicRestaurants.map((res: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl border border-amber-200/70 dark:border-[#2b271d] bg-amber-50/20 dark:bg-[#181c19] space-y-1.5 hover:border-amber-400/60 transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-ink dark:text-[#edf2ee]">{res.name}</h4>
                      {res.dietaryTags && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-semibold">
                          {res.dietaryTags}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-teal-800 dark:text-emerald-400 font-medium">
                      {res.cuisineType}
                    </div>
                    {res.mustTryDishes && (
                      <p className="text-[11px] text-ink-600 dark:text-[#a8beaf]">
                        <strong className="text-ink dark:text-white">Must try:</strong> {res.mustTryDishes}
                      </p>
                    )}
                    {res.atmosphere && (
                      <p className="text-[10px] text-ink-400 dark:text-[#6a7d73] italic">
                        Atmosphere: {res.atmosphere}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regional Dishes & Flavors */}
          {customDossier.localCuisine && customDossier.localCuisine.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-ink dark:text-[#edf2ee] font-serif flex items-center gap-1.5">
                <span>Regional Specialties to Taste:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {customDossier.localCuisine.map((dish: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-sand-100 dark:bg-[#1a2b22] border border-sand-200 dark:border-[#22352b] text-[11px] font-medium text-ink-700 dark:text-[#edf2ee]"
                  >
                    🍲 {dish}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3-Tier Budget Matrix */}
          {customDossier.budgetTiers && (
            <div className="rounded-xl border border-ivory-200 dark:border-[#22352b] p-4 bg-[#faf9f6] dark:bg-[#15221b] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-ink-400 dark:text-[#8ca397] block">
                3-Tier Realistic Financial Blueprint:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-ink-500 dark:text-[#8ca397] block">Backpacker / Slow Traveler</span>
                  <span className="font-bold text-ink dark:text-[#edf2ee] font-mono">{customDossier.budgetTiers.backpacker}</span>
                </div>
                <div>
                  <span className="text-[11px] text-teal-800 dark:text-emerald-400 font-semibold block">Comfortable Couple</span>
                  <span className="font-bold text-teal-800 dark:text-emerald-300 font-mono">{customDossier.budgetTiers.comfortable}</span>
                </div>
                <div>
                  <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">Boutique & Luxury</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200 font-mono">{customDossier.budgetTiers.luxury}</span>
                </div>
              </div>
            </div>
          )}

          {/* Secret Local Experiences */}
          {customDossier.secretExperiences && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-ink dark:text-[#edf2ee] font-serif flex items-center gap-1.5">
                <span>Authentic Local Experiences:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customDossier.secretExperiences.map((exp: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl border border-sand-200 dark:border-[#22352b] bg-white dark:bg-[#15221b] space-y-1">
                    <h4 className="text-xs font-bold text-ink dark:text-[#edf2ee]">{exp.title}</h4>
                    <p className="text-[11px] text-ink-500 dark:text-[#8ca397] leading-relaxed">{exp.description}</p>
                    {exp.insiderTip && (
                      <p className="text-[10px] text-teal-700 dark:text-emerald-400 font-medium pt-1">
                        💡 {exp.insiderTip}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transit and Visa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-emerald-950/40 border border-teal-100 dark:border-emerald-800/40">
              <span className="font-mono text-[10px] font-bold uppercase text-teal-900 dark:text-emerald-300 block mb-0.5">Transit Directions</span>
              <p className="text-[11px] text-teal-800 dark:text-emerald-200">{customDossier.transitGateway}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/40">
              <span className="font-mono text-[10px] font-bold uppercase text-amber-900 dark:text-amber-300 block mb-0.5">Visas & Permits</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-200">{customDossier.visaAndPermits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Cards (Left) + Interactive Destination Dossier / Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Destination Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((dest, index) => {
              const isSelected = selectedDest.id === dest.id;
              return (
                <div
                  key={dest.id}
                  onClick={() => setSelectedDest(dest)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer bg-white text-left ${
                    isSelected
                      ? 'border-teal-700 ring-2 ring-teal-600/20 shadow-md'
                      : 'border-sand-200 hover:border-sand-300 hover:shadow-sm'
                  }`}
                >
                  {/* Visual Header / Editorial Photography */}
                  <div className="h-36 relative overflow-hidden bg-sand-900">
                    <img
                      src={getDestinationImage(dest.name)}
                      alt={dest.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                    <div className="relative h-full p-3.5 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
                        <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] text-amber-200">
                          {String(index + 1).padStart(2, '0')} / {dest.country}
                        </span>
                        <span className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] border border-white/10">
                          <Calendar className="w-3 h-3 text-amber-300" />
                          {dest.idealDuration}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-lg font-bold tracking-tight text-white drop-shadow-sm">{dest.name}</h3>
                        <p className="text-[11px] text-sand-200">{dest.region}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">{dest.tagline}</p>

                    <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-ink-700">
                        <Wallet className="w-3.5 h-3.5 text-teal-700" />
                        <span className="font-semibold">{dest.estBudget}</span>
                      </div>
                      <span className="text-[11px] text-teal-800 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View Dossier &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Destination Dossier & Map Panel (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-2xl border border-sand-200/90 shadow-sm overflow-hidden">
            {/* Header / Hero Photo */}
            <div className="relative h-56 overflow-hidden bg-sand-900 text-white">
              <img
                src={getDestinationImage(selectedDest.name)}
                alt={selectedDest.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15 text-amber-200 text-[10px] tracking-wider uppercase">
                    DESTINATION DOSSIER
                  </span>
                  <span className="text-sand-100 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] border border-white/10 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    {selectedDest.region}, {selectedDest.country}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-white tracking-tight drop-shadow-sm">{selectedDest.name}</h2>
                  <p className="text-sm text-sand-200 mt-1">{selectedDest.region}, {selectedDest.country}</p>
                </div>
              </div>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-ink-700 leading-relaxed font-sans">{selectedDest.description}</p>

              {/* Key Metrics Matrix */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-sand-200/80">
                <div className="p-3 bg-sand-50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-500 uppercase">
                    <Wallet className="w-3.5 h-3.5 text-teal-700" />
                    <span>Est. Budget</span>
                  </div>
                  <div className="text-xs font-bold text-ink-900">{selectedDest.estBudget}</div>
                  <div className="text-[10px] text-ink-400">for 2 travelers</div>
                </div>

                <div className="p-3 bg-sand-50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-500 uppercase">
                    <Sun className="w-3.5 h-3.5 text-amber-700" />
                    <span>Best Season</span>
                  </div>
                  <div className="text-xs font-bold text-ink-900">{selectedDest.bestMonths}</div>
                  <div className="text-[10px] text-ink-400">ideal weather</div>
                </div>

                <div className="p-3 bg-sand-50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-500 uppercase">
                    <Plane className="w-3.5 h-3.5 text-teal-700" />
                    <span>Transit Time</span>
                  </div>
                  <div className="text-xs font-bold text-ink-900 truncate">{selectedDest.flightTimeFromIndia}</div>
                </div>

                <div className="p-3 bg-sand-50 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-500 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Entry / Visa</span>
                  </div>
                  <div className="text-xs font-bold text-ink-900 truncate">{selectedDest.visaStatus}</div>
                </div>
              </div>

              {/* Curated Highlights */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-ink-500 mb-2.5 font-semibold">
                  Curated Highlights
                </h4>
                <div className="space-y-1.5">
                  {selectedDest.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Map Visualizer / Fallback */}
              <div className="rounded-xl overflow-hidden border border-sand-200 bg-sand-50 relative p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-teal-900 font-semibold mb-1">
                  <Compass className="w-4 h-4 text-teal-700" />
                  <span>Geographic Landmark: {selectedDest.name}</span>
                </div>
                <p className="text-[11px] text-ink-500">
                  {selectedDest.region}, {selectedDest.country}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-teal-800 font-medium">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedDest.name}, ${selectedDest.country}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 shadow-2xs transition-all text-teal-800"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    <span>Explore on Google Maps</span>
                    <ArrowRight className="w-3 h-3 text-teal-600" />
                  </a>
                </div>
              </div>

              {/* Action Button */}
              <Link href={`/plan?destination=${encodeURIComponent(selectedDest.name)}`} className="block">
                <Button className="w-full bg-gradient-to-r from-[#0d5c48] to-[#124d3e] hover:from-[#0b4e3d] hover:to-[#0f4033] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all border border-[#dfb981]/30">
                  <Sparkles className="w-4 h-4 text-[#dfb981]" />
                  <span className="font-serif tracking-wide">Craft Journey for {selectedDest.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading Destination Intelligence...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
