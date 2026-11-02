/**
 * Intelligent Multi-Modal Transit Routing & Budget Feasibility Guardian
 * Dynamically figures out the exact route from ANY origin to ANY world destination,
 * with full grounding for smaller cities, talukas, district hubs, and international gateways.
 */

import { convertCurrency, formatCurrencyAmount } from './currency-service';
import { findCountryByNameOrAlias, findNonAirportDestination } from './global-country-data';

export interface TransitLeg {
  step: number;
  mode: 'train' | 'flight' | 'drive' | 'transit' | 'local';
  from: string;
  to: string;
  duration: string;
  carrierOrOption: string;
  advice: string;
  bookingUrl?: string;
  bookingLabel?: string;
  secondaryBookingUrl?: string;
  secondaryBookingLabel?: string;
}

export interface RouteAnalysis {
  isSameCity: boolean;
  origin: string;
  destination: string;
  country: string;
  tier: 'local' | 'domestic' | 'short_haul_intl' | 'long_haul_intl';
  transitLegs: TransitLeg[];
  summaryNote: string;
}

export interface TransitHubInfo {
  isSmallTown: boolean;
  nearestRailhead: string;
  nearestStationCode: string;
  nearestAirportHub: string;
  hubCode: string;
  hubCity: string;
  feederMode: 'drive' | 'train' | 'transit';
  feederDuration: string;
  feederCarrier: string;
  feederAdvice: string;
  railToHubCarrier: string;
  railToHubDuration: string;
}

// Comprehensive directory of Indian States, Union Territories, Heritage Hubs, and Smaller Cities/Talukas
export const KNOWN_INDIAN_DESTINATIONS = new Set([
  // States & Union Territories
  'india', 'bharat', 'rajasthan', 'gujarat', 'maharashtra', 'goa', 'kerala', 'karnataka',
  'tamil nadu', 'uttar pradesh', 'himachal pradesh', 'uttarakhand', 'punjab', 'haryana',
  'jammu and kashmir', 'jammu & kashmir', 'kashmir', 'ladakh', 'west bengal', 'assam',
  'sikkim', 'meghalaya', 'delhi', 'new delhi', 'odisha', 'orissa', 'madhya pradesh',
  'bihar', 'jharkhand', 'chhattisgarh', 'andhra pradesh', 'telangana', 'pondicherry', 'puducherry',
  'chandigarh', 'dadra and nagar haveli', 'daman and diu', 'lakshadweep', 'andaman and nicobar',

  // South Gujarat & Mainline Corridor (Including Smaller Cities & Talukas)
  'surat', 'navsari', 'valsad', 'vapi', 'bharuch', 'ankleshwar', 'anand', 'nadiad',
  'bardoli', 'vyara', 'bilimora', 'chikhli', 'songadh', 'dharampur', 'mandvi', 'ahwa',
  'saputara', 'daman', 'diu', 'silvassa', 'umbergaon', 'sanjan', 'sarigam', 'sachin',
  'udhna', 'kamrej', 'kadodara', 'kim', 'kosamba', 'palej', 'karjan', 'padra', 'dabhoi',
  'waghodia', 'petlad', 'borsad', 'umreth', 'khambhat', 'sojitra', 'tarapur', 'kapadvanj',
  'kathlal', 'mahudha', 'thasra', 'dakor', 'bayad', 'malpur', 'meghraj', 'bhiloda',

  // Central & North Gujarat
  'ahmedabad', 'vadodara', 'baroda', 'gandhinagar', 'mehsana', 'palanpur', 'patan',
  'godhra', 'dahod', 'halol', 'kalol', 'modasa', 'himatnagar', 'idar', 'ambaji',
  'khedbrahma', 'lunawada', 'balasinor', 'santrampur', 'mansa', 'dehgam', 'vijapur',
  'vadnagar', 'visnagar', 'kheralu', 'satlasana', 'unjha', 'chanasma', 'radhanpur',
  'santalpur', 'sami', 'harij', 'shankheshwar', 'vav', 'tharad', 'dhanera', 'dantiwada',
  'amirgadh', 'danta', 'deesa', 'kankrej', 'bhabhar', 'lakhani',

  // Saurashtra & Kutch (Heritage, Coastal, Industrial & Smaller Towns)
  'rajkot', 'jamnagar', 'bhavnagar', 'junagadh', 'porbandar', 'morbi', 'surendranagar',
  'wadhwan', 'botad', 'amreli', 'veraval', 'somnath', 'dwarka', 'gir', 'sasan gir',
  'kutch', 'bhuj', 'rann of kutch', 'gondal', 'jetpur', 'halvad', 'dhrangadhra', 'wankaner',
  'mahuva', 'talaja', 'palitana', 'sihor', 'gariadhar', 'savarkundla', 'rajula', 'jafrabad',
  'una', 'kodinar', 'sutrapada', 'talala', 'keshod', 'manavadar', 'vanthali', 'upleta',
  'dhoraji', 'bhayavadar', 'jamjodhpur', 'khambhalia', 'okha', 'salaya', 'bhanvad',
  'kalyanpur', 'lalpur', 'dhrol', 'jodiya', 'tankara', 'maliya', 'anjar', 'gandhidham',
  'adipur', 'kandla', 'mundra', 'nakhatrana', 'lakhpat', 'rapar', 'bhachau',

  // Rajasthan (Major, Heritage & Smaller Towns)
  'jaisalmer', 'jaipur', 'jodhpur', 'udaipur', 'bikaner', 'pushkar', 'mount abu', 'abu road',
  'ajmer', 'ranthambore', 'sawai madhopur', 'chittorgarh', 'alwar', 'shekhawati', 'mandawa',
  'kumbhalgarh', 'nathdwara', 'kota', 'bhilwara', 'sikar', 'jhunjhunu', 'churu', 'barmer',
  'pali', 'nagaur', 'sirohi', 'jalore', 'dungarpur', 'banswara', 'pratapgarh', 'rajsamand',
  'tonk', 'bundi', 'baran', 'jhalawar', 'dausa', 'karauli', 'dholpur', 'bharatpur',
  'beawar', 'kishangarh', 'phalodi', 'pokhran', 'balotra', 'osian',

  // Maharashtra (Major, Hill Stations, Coastal & Regional Towns)
  'mumbai', 'bombay', 'pune', 'nagpur', 'nashik', 'aurangabad', 'chhatrapati sambhajinagar',
  'thane', 'navi mumbai', 'solapur', 'kolhapur', 'amravati', 'nanded', 'akola', 'sangli',
  'malegaon', 'jalgaon', 'latur', 'dhule', 'ahmednagar', 'satara', 'chandrapur', 'parbhani',
  'ichalkaranji', 'jalna', 'bhusawal', 'panvel', 'badlapur', 'beed', 'gondia', 'lonavala',
  'khandala', 'mahabaleshwar', 'panchgani', 'alibaug', 'matheran', 'shirdi', 'trimbakeshwar',
  'ratnagiri', 'sindhudurg', 'malvan', 'tarkarli', 'ganpatipule', 'chiplun', 'karad',
  'pandharpur', 'baramati', 'wardha', 'bhandara', 'yavatmal', 'washim', 'buldhana',

  // Northern & Central India
  'delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad',
  'amritsar', 'chandigarh', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'pathankot',
  'agra', 'mathura', 'vrindavan', 'varanasi', 'banaras', 'kashi', 'ayodhya', 'prayagraj',
  'allahabad', 'lucknow', 'kanpur', 'meerut', 'bareilly', 'aligarh', 'moradabad', 'gorakhpur',
  'jhansi', 'bhopal', 'indore', 'ujjain', 'pachmarhi', 'khajuraho', 'jabalpur', 'gwalior',
  'raipur', 'bilaspur', 'ranchi', 'jamshedpur', 'dhanbad', 'patna', 'bodh gaya', 'gaya',
  'muzaffarpur', 'bhagalpur', 'darbhanga',

  // Himalayan, Hill Stations & Valley Escapes
  'manali', 'shimla', 'dharamshala', 'dharamsala', 'kasol', 'spiti', 'spiti valley', 'kaza',
  'kullu', 'dalhousie', 'bir billing', 'mcleodganj', 'jibhi', 'tirthan', 'tirthan valley',
  'rishikesh', 'haridwar', 'dehradun', 'mussoorie', 'nainital', 'auli', 'kedarnath',
  'badrinath', 'chopta', 'ranikhet', 'jim corbett', 'corbett', 'lansdowne', 'kanatal',
  'leh', 'leh ladakh', 'kargil', 'pangong', 'nubra', 'nubra valley', 'srinagar', 'gulmarg',
  'pahalgam', 'sonamarg', 'katra', 'vaishno devi', 'jammu',

  // Southern India
  'goa', 'panaji', 'panjim', 'calangute', 'baga', 'anjuna', 'vagator', 'palolem', 'morjim',
  'bengaluru', 'bangalore', 'mysore', 'mysuru', 'coorg', 'kodagu', 'hampi', 'gokarna',
  'chikmagalur', 'ooty', 'kodaikanal', 'wayanad', 'munnar', 'alleppey', 'alappuzha', 'kochi',
  'cochin', 'trivandrum', 'thiruvananthapuram', 'varkala', 'kovalam', 'thekkady', 'kumarakom',
  'kannur', 'chennai', 'madras', 'madurai', 'rameshwaram', 'kanyakumari', 'mahabalipuram',
  'pondicherry', 'hyderabad', 'visakhapatnam', 'vizag', 'araku', 'tirupati', 'coimbatore',
  'mangalore', 'udupi', 'hubli', 'dharwad', 'belgaum', 'vijayawada', 'guntur', 'nellore',

  // Eastern & North-Eastern India
  'kolkata', 'calcutta', 'darjeeling', 'kalimpong', 'gangtok', 'pelling', 'shillong',
  'cherrapunji', 'guwahati', 'kaziranga', 'tawang', 'majuli', 'sundarbans', 'bhubaneswar',
  'puri', 'konark', 'siliguri', 'digha', 'mandarmani'
]);

// Worldwide Countries & Major International Metropolises
export const KNOWN_INTERNATIONAL_REGIONS = [
  'usa', 'united states', 'america', 'new york', 'nyc', 'california', 'san francisco',
  'los angeles', 'chicago', 'miami', 'las vegas', 'washington', 'boston', 'seattle',
  'uk', 'united kingdom', 'england', 'scotland', 'london', 'manchester', 'birmingham', 'edinburgh',
  'france', 'paris', 'nice', 'lyon', 'marseille', 'italy', 'rome', 'venice', 'florence',
  'milan', 'amalfi', 'japan', 'tokyo', 'kyoto', 'osaka', 'hokkaido', 'germany', 'berlin',
  'munich', 'frankfurt', 'switzerland', 'zurich', 'geneva', 'interlaken', 'lucerne',
  'spain', 'barcelona', 'madrid', 'thailand', 'bangkok', 'phuket', 'krabi', 'chiang mai',
  'pattaya', 'singapore', 'uae', 'dubai', 'abu dhabi', 'indonesia', 'bali', 'australia',
  'sydney', 'melbourne', 'canada', 'toronto', 'vancouver', 'turkey', 'istanbul',
  'cappadocia', 'maldives', 'vietnam', 'hanoi', 'ho chi minh', 'da nang', 'nepal',
  'kathmandu', 'pokhara', 'bhutan', 'thimphu', 'sri lanka', 'colombo', 'kandy', 'greece',
  'athens', 'santorini', 'egypt', 'cairo', 'netherlands', 'amsterdam', 'new zealand',
  'auckland', 'queenstown', 'austria', 'vienna', 'belgium', 'brussels', 'portugal', 'lisbon',
  'ireland', 'dublin', 'malaysia', 'kuala lumpur', 'philippines', 'manila', 'south korea', 'seoul',
  'qatar', 'doha', 'saudi arabia', 'riyadh', 'jeddah', 'south africa', 'cape town', 'kenya', 'nairobi'
];

/**
 * Checks if a string represents an international location
 */
export function isInternationalLocation(location: string): boolean {
  if (!location) return false;
  const cleaned = location.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!cleaned) return false;

  // Direct check against authoritative worldwide country database
  const matchedCountry = findCountryByNameOrAlias(location) || findCountryByNameOrAlias(cleaned);
  if (matchedCountry) {
    return matchedCountry.code !== 'IN';
  }

  // Direct check against iconic global destinations
  const nonAirportDest = findNonAirportDestination(location) || findNonAirportDestination(cleaned);
  if (nonAirportDest) {
    return nonAirportDest.country !== 'India';
  }

  const tokens = cleaned.split(/\s+/).filter(Boolean);

  for (const intl of KNOWN_INTERNATIONAL_REGIONS) {
    if (cleaned === intl || tokens.includes(intl) || (intl.length > 3 && cleaned.includes(intl))) {
      return true;
    }
  }
  return false;
}

/**
 * Accurately determines if a location is within India,
 * handling both large hubs and smaller cities, talukas, and district towns.
 */
export function isLocationInIndia(location: string): boolean {
  if (!location) return false;
  const cleaned = location.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!cleaned) return false;
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  // If it's explicitly international, reject
  if (isInternationalLocation(cleaned)) {
    return false;
  }

  // Explicit check for "india" or "bharat"
  if (tokens.includes('india') || tokens.includes('bharat') || cleaned.endsWith(' in') || cleaned.endsWith(' india') || cleaned.includes('india')) {
    return true;
  }

  // Exact set lookup
  if (KNOWN_INDIAN_DESTINATIONS.has(cleaned)) {
    return true;
  }

  // Partial match in known Indian towns
  for (const item of KNOWN_INDIAN_DESTINATIONS) {
    if (cleaned.includes(item) || tokens.includes(item)) {
      return true;
    }
  }

  // Indian linguistic administrative and geographic suffixes / roots
  const indianSuffixes = ['nagar', 'pur', 'pore', 'bad', 'garh', 'wadi', 'gaon', 'gram', 'khed', 'palli', 'konda', 'pet', 'pete', 'patnam', 'ghat', 'taluka', 'jn', 'junction', 'road', 'cantt', 'bazar', 'bazaar', 'chowk', 'mandi'];
  for (const token of tokens) {
    if (indianSuffixes.some((s) => token.endsWith(s) && token.length > s.length + 2)) {
      return true;
    }
  }

  // Resilient heuristic: In Safar AI, if the location is NOT on the worldwide international list,
  // it is treated as a domestic Indian town rather than failing to international airfares.
  return true;
}

/**
 * Checks if two locations form a domestic journey (e.g. within India or within USA)
 */
export function isDomesticJourney(orig: string, dest: string): boolean {
  const normOrig = (orig || '').toLowerCase().trim();
  const normDest = (dest || '').toLowerCase().trim();

  // If both locations are within India
  if (isLocationInIndia(normDest)) {
    if (!normOrig || normOrig === normDest || isLocationInIndia(normOrig)) {
      return true;
    }
    // Origin is explicitly international (e.g. London, Paris, New York)
    return false;
  }

  // If both locations are within the US
  const isDestUSA = normDest.includes('usa') || normDest.includes('united states') || normDest.includes('new york') || normDest.includes('california') || normDest.includes('san francisco');
  const isOrigUSA = normOrig.includes('usa') || normOrig.includes('united states') || normOrig.includes('new york') || normOrig.includes('california') || normOrig.includes('san francisco');
  if (isDestUSA && (!normOrig || isOrigUSA)) {
    return true;
  }

  return false;
}

/**
 * Resolves the destination country cleanly
 */
export function resolveCountry(destination: string): string {
  if (!destination) return 'India';

  const matchedCountry = findCountryByNameOrAlias(destination);
  if (matchedCountry) return matchedCountry.name;

  const nonAirportDest = findNonAirportDestination(destination);
  if (nonAirportDest) return nonAirportDest.country;

  const d = destination.toLowerCase().trim();

  // International detectors
  if (d.includes('new york') || d.includes('usa') || d.includes('united states') || d.includes('california') || d.includes('san francisco') || d.includes('miami') || d.includes('america')) return 'United States';
  if (d.includes('paris') || d.includes('france') || d.includes('nice')) return 'France';
  if (d.includes('kyoto') || d.includes('tokyo') || d.includes('japan') || d.includes('osaka')) return 'Japan';
  if (d.includes('london') || d.includes('uk') || d.includes('scotland') || d.includes('england')) return 'United Kingdom';
  if (d.includes('amalfi') || d.includes('rome') || d.includes('italy') || d.includes('venice') || d.includes('florence') || d.includes('milan')) return 'Italy';
  if (d.includes('dubai') || d.includes('uae') || d.includes('abu dhabi')) return 'United Arab Emirates';
  if (d.includes('bangkok') || d.includes('phuket') || d.includes('thailand') || d.includes('chiang mai') || d.includes('krabi')) return 'Thailand';
  if (d.includes('singapore')) return 'Singapore';
  if (d.includes('bali') || d.includes('indonesia')) return 'Indonesia';
  if (d.includes('sydney') || d.includes('melbourne') || d.includes('australia')) return 'Australia';
  if (d.includes('zurich') || d.includes('switzerland') || d.includes('interlaken') || d.includes('geneva')) return 'Switzerland';
  if (d.includes('berlin') || d.includes('germany') || d.includes('munich') || d.includes('frankfurt')) return 'Germany';
  if (d.includes('spain') || d.includes('barcelona') || d.includes('madrid')) return 'Spain';
  if (d.includes('maldives')) return 'Maldives';
  if (d.includes('vietnam') || d.includes('hanoi') || d.includes('da nang')) return 'Vietnam';
  if (d.includes('greece') || d.includes('santorini') || d.includes('athens')) return 'Greece';
  if (d.includes('turkey') || d.includes('istanbul') || d.includes('cappadocia')) return 'Turkey';
  if (d.includes('egypt') || d.includes('cairo')) return 'Egypt';
  if (d.includes('netherlands') || d.includes('amsterdam')) return 'Netherlands';
  if (d.includes('nepal') || d.includes('kathmandu')) return 'Nepal';
  if (d.includes('canada') || d.includes('toronto') || d.includes('vancouver')) return 'Canada';

  // If in India or unrecognized as international -> India!
  return 'India';
}

/**
 * Intelligent Transit Hub Resolver for ANY city, town, or taluka
 */
export function getNearestTransitHub(cityInput: string): TransitHubInfo {
  const norm = (cityInput || '').toLowerCase().trim();

  // 1. South Gujarat & Surat Regional Belt
  // (Bardoli, Vyara, Bilimora, Chikhli, Songadh, Dharampur, Mandvi, Ankleshwar, Navsari, Valsad, Vapi, etc.)
  if (
    norm.includes('bardoli') ||
    norm.includes('vyara') ||
    norm.includes('songadh') ||
    norm.includes('mandvi') ||
    norm.includes('kadodara') ||
    norm.includes('kamrej')
  ) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Surat Junction (ST)',
      nearestStationCode: 'ST',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'drive',
      feederDuration: '35 - 50 mins',
      feederCarrier: 'Highway Express Cab / GSRTC Express Bus',
      feederAdvice: `Take frequent 35-min highway cab or shuttle from ${cityInput} to Surat Junction (ST) mainline railhead.`,
      railToHubCarrier: 'Vande Bharat Express (#20902) or Gujarat Mail (#12902)',
      railToHubDuration: '2h 45m',
    };
  }

  if (
    norm.includes('bilimora') ||
    norm.includes('chikhli') ||
    norm.includes('dharampur') ||
    norm.includes('navsari') ||
    norm.includes('valsad') ||
    norm.includes('vapi') ||
    norm.includes('daman') ||
    norm.includes('silvassa')
  ) {
    return {
      isSmallTown: norm.includes('bilimora') || norm.includes('chikhli') || norm.includes('dharampur'),
      nearestRailhead: norm.includes('bilimora') ? 'Bilimora Junction (BIM)' : norm.includes('chikhli') ? 'Navsari / Bilimora Station' : `${cityInput} Railway Station`,
      nearestStationCode: norm.includes('bilimora') ? 'BIM' : norm.includes('valsad') ? 'BL' : 'NVS',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'drive',
      feederDuration: '20 - 35 mins',
      feederCarrier: 'Local Feeder Auto / Highway Cab / MEMU Rail',
      feederAdvice: `Direct access to Western Railway mainline corridor.`,
      railToHubCarrier: 'Gujarat Mail (#12902) or Vande Bharat Express',
      railToHubDuration: '2h 15m - 3h 10m',
    };
  }

  if (norm.includes('bharuch') || norm.includes('ankleshwar')) {
    return {
      isSmallTown: norm.includes('ankleshwar'),
      nearestRailhead: 'Bharuch Junction (BH) / Ankleshwar Junction (AKV)',
      nearestStationCode: 'BH',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'train',
      feederDuration: '15 mins',
      feederCarrier: 'Western Railway Mainline Rail',
      feederAdvice: `Board mainline trains connecting directly to Mumbai or Vadodara.`,
      railToHubCarrier: 'Vande Bharat Express / Tejas Express',
      railToHubDuration: '3h 15m',
    };
  }

  // 2. Saurashtra & Kutch Towns (Morbi, Palitana, Somnath, Veraval, Diu, Amreli, Mahuva, etc.)
  if (
    norm.includes('palitana') ||
    norm.includes('mahuva') ||
    norm.includes('talaja') ||
    norm.includes('sihor') ||
    norm.includes('bhavnagar')
  ) {
    return {
      isSmallTown: !norm.includes('bhavnagar'),
      nearestRailhead: 'Bhavnagar Terminus (BVC) / Sihor Junction',
      nearestStationCode: 'BVC',
      nearestAirportHub: 'Ahmedabad (AMD) / Mumbai International (BOM)',
      hubCode: 'AMD',
      hubCity: 'Ahmedabad',
      feederMode: 'drive',
      feederDuration: '45 mins - 1h 15m',
      feederCarrier: 'Intercity Bus / Express Cab',
      feederAdvice: `Connect from ${cityInput} to Bhavnagar Terminus or direct highway bus to Ahmedabad.`,
      railToHubCarrier: 'Vande Bharat or Express Train to Ahmedabad / Mumbai',
      railToHubDuration: '4h 00m',
    };
  }

  if (
    norm.includes('somnath') ||
    norm.includes('veraval') ||
    norm.includes('diu') ||
    norm.includes('una') ||
    norm.includes('keshod') ||
    norm.includes('junagadh')
  ) {
    return {
      isSmallTown: !norm.includes('junagadh'),
      nearestRailhead: 'Veraval Junction (VRL) / Junagadh Junction (JND)',
      nearestStationCode: 'VRL',
      nearestAirportHub: 'Rajkot International (HSR) / Ahmedabad (AMD)',
      hubCode: 'AMD',
      hubCity: 'Ahmedabad',
      feederMode: 'drive',
      feederDuration: '45 mins',
      feederCarrier: 'Regional Express Shuttle / Cab',
      feederAdvice: `Feeder transit to Veraval/Junagadh railway mainline.`,
      railToHubCarrier: 'Somnath Express / Vande Bharat connection',
      railToHubDuration: '5h 30m to Ahmedabad',
    };
  }

  if (norm.includes('morbi') || norm.includes('surendranagar') || norm.includes('wankaner')) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Wankaner Junction (WKR) / Rajkot Junction (RJT)',
      nearestStationCode: 'WKR',
      nearestAirportHub: 'Rajkot International (HSR) / Ahmedabad (AMD)',
      hubCode: 'AMD',
      hubCity: 'Ahmedabad',
      feederMode: 'drive',
      feederDuration: '30 - 45 mins',
      feederCarrier: 'Highway Cab / Intercity Shuttle',
      feederAdvice: `Express highway transit to Wankaner railway junction.`,
      railToHubCarrier: 'Vande Bharat Express to Ahmedabad / Mumbai',
      railToHubDuration: '3h 30m',
    };
  }

  // 3. Rajasthan Regional & Desert Towns (Mount Abu, Jaisalmer, Bikaner, Pushkar, Nathdwara)
  if (norm.includes('mount abu') || norm.includes('abu road') || norm.includes('sirohi')) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Abu Road Railway Station (ABR)',
      nearestStationCode: 'ABR',
      nearestAirportHub: 'Ahmedabad Sardar Vallabhbhai Patel Intl (AMD) / Delhi (DEL)',
      hubCode: 'AMD',
      hubCity: 'Ahmedabad',
      feederMode: 'drive',
      feederDuration: '45 mins',
      feederCarrier: 'Hill Descent Shared Taxi / Private Cab to Abu Road',
      feederAdvice: `Take 28 km hill road cab down to Abu Road (ABR) railway station.`,
      railToHubCarrier: 'Vande Bharat / Ashram Express to Ahmedabad (2h 45m) or Delhi',
      railToHubDuration: '2h 45m',
    };
  }

  if (norm.includes('jaisalmer') || norm.includes('pokhran') || norm.includes('barmer')) {
    return {
      isSmallTown: !norm.includes('jaisalmer'),
      nearestRailhead: 'Jaisalmer Railway Station (JSA)',
      nearestStationCode: 'JSA',
      nearestAirportHub: 'Jodhpur (JDH) / Delhi Indira Gandhi Intl (DEL)',
      hubCode: 'DEL',
      hubCity: 'Delhi',
      feederMode: 'train',
      feederDuration: '4h 30m to Jodhpur',
      feederCarrier: 'BDTS-Jaisalmer Superfast / Mandore Express',
      feederAdvice: `Direct overnight trains connect Jaisalmer to Mumbai, Jaipur, and Delhi.`,
      railToHubCarrier: 'Overnight Superfast Train or Flight to Delhi / Mumbai',
      railToHubDuration: '14h - 16h train / 1h 45m flight',
    };
  }

  // 4. North & Himalayan Towns (Kasol, Manali, Spiti, Rishikesh, Mussoorie)
  if (norm.includes('kasol') || norm.includes('manali') || norm.includes('kullu') || norm.includes('spiti') || norm.includes('jibhi')) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Chandigarh Junction (CDG) / Kalka (KLK)',
      nearestStationCode: 'CDG',
      nearestAirportHub: 'Delhi Indira Gandhi International (DEL T3)',
      hubCode: 'DEL',
      hubCity: 'Delhi',
      feederMode: 'drive',
      feederDuration: '4h - 6h',
      feederCarrier: 'Himachal Volvo Express Bus / Private Cab',
      feederAdvice: `Overnight Volvo bus or scenic mountain highway link to Chandigarh / Delhi.`,
      railToHubCarrier: 'Kalka Shatabdi Express / Vande Bharat to Delhi',
      railToHubDuration: '3h 15m',
    };
  }

  if (norm.includes('rishikesh') || norm.includes('haridwar') || norm.includes('mussoorie') || norm.includes('nainital')) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Haridwar Junction (HW) / Dehradun (DDN)',
      nearestStationCode: 'HW',
      nearestAirportHub: 'Delhi Indira Gandhi International (DEL T3)',
      hubCode: 'DEL',
      hubCity: 'Delhi',
      feederMode: 'drive',
      feederDuration: '45 mins',
      feederCarrier: 'Direct Highway Cab / Electric Bus',
      feederAdvice: `Frequent 40-min connection to Haridwar railway terminal.`,
      railToHubCarrier: 'Vande Bharat Express (#22458) / Shatabdi Express to Delhi',
      railToHubDuration: '3h 30m',
    };
  }

  // 5. Maharashtra Regional, Marathwada & Western Hubs (Latur, Solapur, Nanded, Nashik, Kolhapur, etc.)
  if (
    norm.includes('latur') ||
    norm.includes('solapur') ||
    norm.includes('nanded') ||
    norm.includes('parbhani') ||
    norm.includes('osmanabad') ||
    norm.includes('dharashiv') ||
    norm.includes('beed') ||
    norm.includes('jalna')
  ) {
    return {
      isSmallTown: true,
      nearestRailhead: 'Latur Railway Station (LUR) / Solapur Junction (SUR)',
      nearestStationCode: 'LUR',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'drive',
      feederDuration: '20 - 30 mins',
      feederCarrier: 'Local Cab / Station Shuttle to Latur Station',
      feederAdvice: `Take local transit to Latur Railway Station (LUR) for direct overnight express rail to Mumbai CSMT.`,
      railToHubCarrier: 'Latur-Mumbai CSMT Superfast Express (#22108 / #12072)',
      railToHubDuration: '8h 15m (Overnight Express)',
    };
  }

  if (norm.includes('nashik') || norm.includes('nasik') || norm.includes('shirdi') || norm.includes('ahmednagar')) {
    return {
      isSmallTown: false,
      nearestRailhead: 'Nashik Road Railway Station (NK)',
      nearestStationCode: 'NK',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'drive',
      feederDuration: '25 mins',
      feederCarrier: 'City Cab to Nashik Road Station',
      feederAdvice: `Direct Vande Bharat or Panchavati Express to Mumbai CSMT.`,
      railToHubCarrier: 'CSMT Vande Bharat Express (#22224) / Panchavati Express',
      railToHubDuration: '3h 25m',
    };
  }

  if (norm.includes('kolhapur') || norm.includes('sangli') || norm.includes('satara') || norm.includes('karad')) {
    return {
      isSmallTown: false,
      nearestRailhead: 'Chhatrapati Shahu Maharaj Terminus (KOP)',
      nearestStationCode: 'KOP',
      nearestAirportHub: 'Mumbai International Airport (CSMIA BOM Terminal 2)',
      hubCode: 'BOM',
      hubCity: 'Mumbai',
      feederMode: 'drive',
      feederDuration: '25 mins',
      feederCarrier: 'City Cab to SCSMT Kolhapur Station',
      feederAdvice: `Board direct overnight Mahalaxmi Express to Mumbai Dadar/CSMT.`,
      railToHubCarrier: 'Mahalaxmi Express (#17412) / Sahyadri Express',
      railToHubDuration: '7h 45m (Overnight Express)',
    };
  }

  // 6. Default Fallback for ANY Indian Town
  const isNorth = norm.includes('punjab') || norm.includes('haryana') || norm.includes('rajasthan') || norm.includes('delhi') || norm.includes('uttar') || norm.includes('uttarakhand') || norm.includes('himachal') || norm.includes('kashmir');
  return {
    isSmallTown: true,
    nearestRailhead: `${cityInput} Main Station / Junction`,
    nearestStationCode: cityInput.slice(0, 3).toUpperCase(),
    nearestAirportHub: isNorth ? 'Delhi Indira Gandhi International (DEL T3)' : 'Mumbai International Airport (CSMIA BOM Terminal 2)',
    hubCode: isNorth ? 'DEL' : 'BOM',
    hubCity: isNorth ? 'Delhi' : 'Mumbai',
    feederMode: 'drive',
    feederDuration: '30 - 60 mins',
    feederCarrier: 'Regional Cab / Intercity Express Bus',
    feederAdvice: `Feeder transit from ${cityInput} to the nearest mainline transit corridor.`,
    railToHubCarrier: 'Superfast Express Rail / Vande Bharat to Hub',
    railToHubDuration: '3h 00m',
  };
}

/**
 * Checks if two towns are in close regional proximity (< 80 km)
 */
function isNearbyRegionalPair(orig: string, dest: string): boolean {
  const o = orig.toLowerCase().trim();
  const d = dest.toLowerCase().trim();

  // South Gujarat Cluster
  const southGujaratCluster = ['surat', 'bardoli', 'navsari', 'valsad', 'vapi', 'bilimora', 'chikhli', 'vyara', 'songadh', 'ankleshwar', 'bharuch', 'kadodara', 'kamrej', 'daman', 'silvassa'];
  const oInSG = southGujaratCluster.some((c) => o.includes(c));
  const dInSG = southGujaratCluster.some((c) => d.includes(c));
  if (oInSG && dInSG) return true;

  // Central Gujarat Cluster
  const centralGujaratCluster = ['ahmedabad', 'gandhinagar', 'vadodara', 'anand', 'nadiad', 'kalol', 'dakor'];
  const oInCG = centralGujaratCluster.some((c) => o.includes(c));
  const dInCG = centralGujaratCluster.some((c) => d.includes(c));
  if (oInCG && dInCG) return true;

  // Mumbai - Pune - Lonavala Cluster
  const mmrCluster = ['mumbai', 'thane', 'navi mumbai', 'panvel', 'lonavala', 'khandala', 'pune', 'alibaug', 'matheran'];
  const oInMMR = mmrCluster.some((c) => o.includes(c));
  const dInMMR = mmrCluster.some((c) => d.includes(c));
  if (oInMMR && dInMMR) return true;

  // Delhi NCR Cluster
  const ncrCluster = ['delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad'];
  const oInNCR = ncrCluster.some((c) => o.includes(c));
  const dInNCR = ncrCluster.some((c) => d.includes(c));
  if (oInNCR && dInNCR) return true;

  return false;
}

/**
 * Parses user input to resolve origin and destination cleanly
 */
export function parseRouteInput(inputDestination: string, inputOrigin?: string): { origin: string; destination: string } {
  let raw = (inputDestination || '').trim();
  let origin = (inputOrigin || '').trim();
  let destination = raw;

  const toPattern = /^(?:from\s+)?(.+?)\s+(?:to|->|—|-)\s+(.+)$/i;
  const match = raw.match(toPattern);
  if (match) {
    origin = match[1].trim();
    destination = match[2].trim();
  }

  origin = origin.replace(/[.,;]+$/, '').trim();
  destination = destination.replace(/[.,;]+$/, '').trim();

  if (!origin) {
    const normDest = destination.toLowerCase().trim();
    if (isLocationInIndia(normDest) && !normDest.includes('delhi') && !normDest.includes('mumbai')) {
      origin = (normDest.includes('manali') || normDest.includes('shimla') || normDest.includes('jaisalmer') || normDest.includes('jaipur') || normDest.includes('varanasi') || normDest.includes('ladakh') || normDest.includes('rishikesh'))
        ? 'Delhi'
        : 'Mumbai';
    } else {
      origin = destination;
    }
  }

  return { origin, destination };
}

/**
 * Generates realistic transit legs from any origin to any world destination,
 * explicitly supporting smaller cities, talukas, and regional gateways.
 */
export function analyzeTransitRoute(origin: string, destination: string): RouteAnalysis {
  const normOrigin = origin.toLowerCase().trim();
  const normDest = destination.toLowerCase().trim();

  // 1. Same City or District (e.g. Surat to Surat, New York to New York)
  if (
    normOrigin === normDest ||
    normOrigin.includes(normDest) ||
    normDest.includes(normOrigin) ||
    (normOrigin.includes('new york') && normDest.includes('new york')) ||
    (normOrigin.includes('delhi') && normDest.includes('delhi'))
  ) {
    return {
      isSameCity: true,
      origin,
      destination,
      country: resolveCountry(destination),
      tier: 'local',
      transitLegs: [
        {
          step: 1,
          mode: 'local',
          from: origin,
          to: `${destination} City Centers & Districts`,
          duration: '15 - 35 mins',
          carrierOrOption: 'Local Auto, Metro, Rideshare & Walking',
          advice: 'Zero intercity flights or trains needed. Seamless same-city local mobility.',
          bookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
          bookingLabel: 'Explore City Routes on Maps',
          secondaryBookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(destination)}"}`,
          secondaryBookingLabel: 'Book Local Ride / Cab',
        },
      ],
      summaryNote: `Direct local exploration in ${destination}. No long-distance transfers required.`,
    };
  }

  const isDestIntl = isInternationalLocation(normDest);
  const isOrigIntl = isInternationalLocation(normOrigin);
  const isIntl = isDestIntl || isOrigIntl || !isDomesticJourney(normOrigin, normDest);

  // 2. Nearby Regional / Short-Distance Journey (< 80 km)
  // e.g. Surat to Bardoli, Navsari to Bilimora, Bardoli to Vyara, Pune to Lonavala
  if (!isIntl && isNearbyRegionalPair(normOrigin, normDest)) {
    const cleanFrom = origin.split(/\s+/)[0] || origin;
    const cleanTo = destination.split(/\s+/)[0] || destination;

    return {
      isSameCity: false,
      origin,
      destination,
      country: 'India',
      tier: 'domestic',
      transitLegs: [
        {
          step: 1,
          mode: 'drive',
          from: origin,
          to: destination,
          duration: '35 - 55 mins',
          carrierOrOption: 'Regional Highway Express Cab / State Express Bus (GSRTC/MSRTC)',
          advice: `Direct overland highway connection via national/state highway. Frequent buses and cabs available every 10-15 mins with zero flight/overnight rail needed.`,
          bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(destination)}"}`,
          bookingLabel: 'Book Direct Ride on Uber',
          secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
          secondaryBookingLabel: 'Open Google Maps Navigation',
        },
      ],
      summaryNote: `Short Regional Route: Direct highway connection between ${origin} and ${destination} (35-55 mins).`,
    };
  }

  // 3. Smaller City or Regional Origin ➔ International Destination
  // e.g. Bardoli to London, Bilimora to USA, Surat to London, Navsari to London, Vyara to Paris
  if (isIntl && isLocationInIndia(normOrigin)) {
    const hubInfo = getNearestTransitHub(origin);
    const isUSA = normDest.includes('usa') || normDest.includes('united states') || normDest.includes('new york');
    const isSwiss = normDest.includes('switzerland') || normDest.includes('zurich') || normDest.includes('geneva') || normDest.includes('interlaken') || normDest.includes('lucerne') || normDest.includes('basel') || normDest.includes('swiss');
    const isEurope = normDest.includes('uk') || normDest.includes('london') || normDest.includes('paris') || normDest.includes('france') || normDest.includes('italy') || normDest.includes('rome') || normDest.includes('germany') || normDest.includes('berlin') || normDest.includes('munich') || normDest.includes('frankfurt') || normDest.includes('spain') || normDest.includes('barcelona') || normDest.includes('madrid') || normDest.includes('amsterdam') || normDest.includes('netherlands') || isSwiss;

    const destName = normDest.includes('london')
      ? 'London Heathrow (LHR) / Gatwick (LGW)'
      : isSwiss
      ? 'Zurich Airport (ZRH) / Geneva (GVA)'
      : normDest.includes('paris')
      ? 'Paris Charles de Gaulle (CDG)'
      : isUSA
      ? 'New York (JFK / EWR) Gateway'
      : `${destination} International Gateway`;

    const flightDuration = isUSA ? '14h - 17h' : isSwiss ? '9h 00m (Direct non-stop)' : isEurope ? '9h - 11h' : '4h - 7h';
    const flightCarrier = isSwiss
      ? 'SWISS International Air Lines (LX155 Direct Non-Stop) / Air India / Emirates'
      : isEurope
      ? 'Air India Direct Non-Stop, British Airways, or Etihad Airways'
      : 'Major International Scheduled Carrier';

    const transitLegs: TransitLeg[] = [];

    // If starting in a smaller town (e.g. Latur, Bardoli, Vyara, Bilimora):
    if (hubInfo.isSmallTown && !normOrigin.includes('surat') && !normOrigin.includes('navsari') && !normOrigin.includes('valsad')) {
      transitLegs.push({
        step: 1,
        mode: hubInfo.feederMode,
        from: origin,
        to: hubInfo.nearestRailhead,
        duration: hubInfo.feederDuration,
        carrierOrOption: hubInfo.feederCarrier,
        advice: hubInfo.feederAdvice,
        bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(hubInfo.nearestRailhead)}"}`,
        bookingLabel: 'Book Feeder Cab on Uber',
        secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(hubInfo.nearestRailhead)}`,
        secondaryBookingLabel: 'View Feeder Route on Maps',
      });

      transitLegs.push({
        step: 2,
        mode: 'train',
        from: hubInfo.nearestRailhead,
        to: `${hubInfo.hubCity} (${hubInfo.hubCode} Airport Connector)`,
        duration: hubInfo.railToHubDuration,
        carrierOrOption: hubInfo.railToHubCarrier,
        advice: `Board high-speed train or express rail directly to ${hubInfo.hubCity} airport terminal corridor.`,
        bookingUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(hubInfo.nearestStationCode)}/to/${encodeURIComponent(hubInfo.hubCode)}`,
        bookingLabel: 'Book Train on ConfirmTkt (Instant PNR)',
        secondaryBookingUrl: 'https://www.irctc.co.in/nget/train-search',
        secondaryBookingLabel: 'IRCTC Official Portal',
      });

      transitLegs.push({
        step: 3,
        mode: 'flight',
        from: hubInfo.nearestAirportHub,
        to: destName,
        duration: flightDuration,
        carrierOrOption: flightCarrier,
        advice: `Board international long-haul flight from ${hubInfo.hubCode} to ${destination}.`,
        bookingUrl: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${hubInfo.hubCode} to ${destination}`)}`,
        bookingLabel: 'Book Flight (Google Flights Live)',
        secondaryBookingUrl: isSwiss ? 'https://www.swiss.com' : 'https://www.google.com/travel/flights',
        secondaryBookingLabel: isSwiss ? 'SWISS Official Direct' : 'Official Airline Direct',
      });

      return {
        isSameCity: false,
        origin,
        destination,
        country: resolveCountry(destination),
        tier: isUSA ? 'long_haul_intl' : 'short_haul_intl',
        transitLegs,
        summaryNote: `Recommended Route: ${origin} ➔ ${hubInfo.nearestRailhead} (Cab/Bus) ➔ ${hubInfo.hubCode} (Express Rail) ➔ ${destination} (International Flight).`,
      };
    }

    // Origin is regional hub city (e.g. Surat, Navsari, Valsad, Pune, Vadodara)
    transitLegs.push({
      step: 1,
      mode: 'train',
      from: `${origin} Railway Station`,
      to: `${hubInfo.hubCity} (${hubInfo.hubCode} Airport Connector)`,
      duration: hubInfo.railToHubDuration,
      carrierOrOption: hubInfo.railToHubCarrier,
      advice: `No direct international flights operate from ${origin}. Board express rail to ${hubInfo.nearestAirportHub}.`,
      bookingUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(origin.split(/\s+/)[0] || origin)}/to/${encodeURIComponent(hubInfo.hubCity)}`,
      bookingLabel: 'Book Train on ConfirmTkt (Instant PNR)',
      secondaryBookingUrl: 'https://www.irctc.co.in/nget/train-search',
      secondaryBookingLabel: 'IRCTC Official Portal',
    });

    transitLegs.push({
      step: 2,
      mode: 'flight',
      from: hubInfo.nearestAirportHub,
      to: destName,
      duration: flightDuration,
      carrierOrOption: flightCarrier,
      advice: `Board international flight from ${hubInfo.hubCode} to ${destination}.`,
      bookingUrl: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${hubInfo.hubCode} to ${destination}`)}`,
      bookingLabel: 'Book Flight (Google Flights Live)',
      secondaryBookingUrl: isSwiss ? 'https://www.swiss.com' : 'https://www.google.com/travel/flights',
      secondaryBookingLabel: isSwiss ? 'SWISS Official Direct' : 'Official Airline Direct',
    });

    return {
      isSameCity: false,
      origin,
      destination,
      country: resolveCountry(destination),
      tier: isUSA ? 'long_haul_intl' : 'short_haul_intl',
      transitLegs,
      summaryNote: `Recommended Route: ${origin} ➔ ${hubInfo.hubCode} (Vande Bharat/Rail) ➔ ${destination} (International Flight).`,
    };
  }

  // 4. Smaller City ➔ Domestic Indian Destination
  // e.g. Bardoli to Jaisalmer, Bilimora to Delhi, Surat to Jaisalmer, Mumbai to Jaisalmer
  if (!isIntl) {
    const hubInfo = getNearestTransitHub(origin);
    const destHubInfo = getNearestTransitHub(destination);

    // If origin is a smaller town needing connection to major junction
    if (hubInfo.isSmallTown && !normOrigin.includes('surat') && !normOrigin.includes('mumbai') && !normOrigin.includes('delhi')) {
      return {
        isSameCity: false,
        origin,
        destination,
        country: 'India',
        tier: 'domestic',
        transitLegs: [
          {
            step: 1,
            mode: hubInfo.feederMode,
            from: origin,
            to: hubInfo.nearestRailhead,
            duration: hubInfo.feederDuration,
            carrierOrOption: hubInfo.feederCarrier,
            advice: hubInfo.feederAdvice,
            bookingUrl: `https://m.uber.com/looking?pickup={"addressLine1":"${encodeURIComponent(origin)}"}&drop[0]={"addressLine1":"${encodeURIComponent(hubInfo.nearestRailhead)}"}`,
            bookingLabel: 'Book Feeder Cab on Uber',
            secondaryBookingUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(hubInfo.nearestRailhead)}`,
            secondaryBookingLabel: 'View Route on Maps',
          },
          {
            step: 2,
            mode: 'train',
            from: hubInfo.nearestRailhead,
            to: `${destination} Railway Station`,
            duration: normDest.includes('jaisalmer') ? '16h 30m' : '4h - 10h',
            carrierOrOption: normDest.includes('jaisalmer') ? 'BDTS-Jaisalmer Superfast Express (#22931)' : 'Direct Superfast Express / Vande Bharat',
            advice: `Board confirmed AC 3-Tier/Sleeper berths from ${hubInfo.nearestRailhead} to ${destination}.`,
            bookingUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(hubInfo.nearestStationCode)}/to/${encodeURIComponent(destination.split(/\s+/)[0] || destination)}`,
            bookingLabel: 'Book Train on ConfirmTkt (Instant PNR)',
            secondaryBookingUrl: 'https://www.irctc.co.in/nget/train-search',
            secondaryBookingLabel: 'IRCTC Official Portal',
          },
        ],
        summaryNote: `Domestic Route: ${origin} ➔ ${hubInfo.nearestRailhead} (Feeder) ➔ ${destination} (Superfast Express Rail).`,
      };
    }

    // Direct Domestic route between cities (e.g. Mumbai to Jaisalmer, Surat to Jaisalmer, Delhi to Manali)
    const domesticCarrier = normDest.includes('jaisalmer')
      ? 'BDTS-Jaisalmer Superfast Express / Intercity AC Sleeper or Domestic Flight to JSA'
      : normDest.includes('manali')
      ? 'Himachal Volvo Express Bus / Shatabdi to Chandigarh'
      : 'Direct Express Train, Vande Bharat, or Domestic Flight';

    const cleanFrom = origin.split(/\s+/)[0] || origin;
    const cleanTo = destination.split(/\s+/)[0] || destination;

    return {
      isSameCity: false,
      origin,
      destination,
      country: 'India',
      tier: 'domestic',
      transitLegs: [
        {
          step: 1,
          mode: 'train',
          from: origin,
          to: destination,
          duration: normDest.includes('jaisalmer') ? '1h 45m flight / 16h train' : '2h flight / 5h train',
          carrierOrOption: domesticCarrier,
          advice: `Direct domestic connectivity available between ${origin} and ${destination} via express rail, interstate AC bus, or flight.`,
          bookingUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${encodeURIComponent(cleanFrom)}/to/${encodeURIComponent(cleanTo)}`,
          bookingLabel: 'Book Train on ConfirmTkt (Instant PNR)',
          secondaryBookingUrl: 'https://www.irctc.co.in/nget/train-search',
          secondaryBookingLabel: 'IRCTC Official Portal',
        },
      ],
      summaryNote: `Domestic Route: Direct connection from ${origin} to ${destination} (Rail/Air).`,
    };
  }

  // 5. Generic International Route (Direct Flight Hub to Hub)
  const cleanFrom = origin.split(/\s+/)[0] || origin;
  const cleanTo = destination.split(/\s+/)[0] || destination;

  return {
    isSameCity: false,
    origin,
    destination,
    country: resolveCountry(destination),
    tier: normDest.includes('usa') || normDest.includes('australia') ? 'long_haul_intl' : 'short_haul_intl',
    transitLegs: [
      {
        step: 1,
        mode: 'flight',
        from: origin,
        to: destination,
        duration: normDest.includes('usa') ? '14h - 18h' : '6h - 9h',
        carrierOrOption: 'International Scheduled Flight',
        advice: `Direct international connection between ${origin} and ${destination}.`,
        bookingUrl: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${cleanFrom} to ${cleanTo}`)}`,
        bookingLabel: 'Book Flight (Google Flights Live)',
        secondaryBookingUrl: 'https://www.google.com/travel/flights',
        secondaryBookingLabel: 'Official Airline Direct',
      },
    ],
    summaryNote: `Direct international connection from ${origin} to ${destination}.`,
  };
}

/**
 * Strict Budget Guardian: Checks if budget is feasible for the given trip
 */
export function validateBudgetFeasibility(params: {
  budget: number;
  currency: string;
  origin: string;
  destination: string;
  days: number;
  travelers: number;
}): {
  isPossible: boolean;
  replyMessage?: string;
  minimumRequired?: number;
  formattedMinimum?: string;
  reason?: string;
} {
  const { budget, currency, origin, destination, days, travelers } = params;
  const analysis = analyzeTransitRoute(origin, destination);
  const effectiveDays = Math.max(1, days);
  const effectivePax = Math.max(1, travelers);

  // Baselines in INR
  let transitBaselinePerPaxINR = 0;
  let dailyLivingPerPaxINR = 0;

  switch (analysis.tier) {
    case 'local':
      transitBaselinePerPaxINR = 250;
      dailyLivingPerPaxINR = 800;
      break;
    case 'domestic':
      // Realistic baseline for Indian trains (Sleeper/3AC/2S), intercity buses, budget stays & meals
      // If nearby (<80 km), transit is very cheap (~₹150-₹300)
      if (isNearbyRegionalPair(origin, destination)) {
        transitBaselinePerPaxINR = 250;
        dailyLivingPerPaxINR = 800;
      } else {
        transitBaselinePerPaxINR = 1200;
        dailyLivingPerPaxINR = 1200;
      }
      break;
    case 'short_haul_intl':
      transitBaselinePerPaxINR = 18000;
      dailyLivingPerPaxINR = 4500;
      break;
    case 'long_haul_intl':
      transitBaselinePerPaxINR = 55000;
      dailyLivingPerPaxINR = 7500;
      break;
  }

  const minRequiredINR = (transitBaselinePerPaxINR + dailyLivingPerPaxINR * effectiveDays) * effectivePax;
  const minRequiredTargetCurrency = convertCurrency(minRequiredINR, 'INR', currency);

  // Allow a 30% margin for extreme backpackers, but no further
  const strictFloor = minRequiredTargetCurrency * 0.7;

  if (budget < strictFloor) {
    const formattedFloor = formatCurrencyAmount(minRequiredTargetCurrency, currency);
    const formattedGiven = formatCurrencyAmount(budget, currency);

    return {
      isPossible: false,
      replyMessage: 'insufficient money funds (PAISA KAMAO) 💸',
      minimumRequired: minRequiredTargetCurrency,
      formattedMinimum: formattedFloor,
      reason: `Your budget of ${formattedGiven} cannot cover ${destination} for ${effectivePax} traveler(s) across ${effectiveDays} day(s). Realistic transit and stay require at least ${formattedFloor}.`,
    };
  }

  return {
    isPossible: true,
    minimumRequired: minRequiredTargetCurrency,
  };
}
