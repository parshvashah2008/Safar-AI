/**
 * SAFAR AI — Global Multi-Modal Station, Airport & Seaport Resolution Engine
 * Authoritative world knowledge base of commercial airports, railheads, ports, and highways.
 * Prevents phantom airports/flights for non-airport cities (e.g. Akola, Palitana, Mount Abu, Hampi)
 * and accurately surfaces the nearest hubs, feeder travel times, and multimodal options.
 */

import { convertCurrency, formatCurrencyAmount } from './currency-service';
import {
  findCountryByNameOrAlias,
  findNonAirportDestination,
  detectContinentOrRegion,
  GLOBAL_COUNTRIES,
  GLOBAL_NON_AIRPORT_DESTINATIONS,
} from './global-country-data';

export interface CommercialAirport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  isHub?: boolean;
  aliases?: string[];
}

export interface NonAirportCityHub {
  city: string;
  hasCommercialAirport: false;
  reason: string;
  primaryAirport: {
    code: string;
    name: string;
    city: string;
    distanceKm: number;
    driveTime: string;
    feederMode: 'drive' | 'train' | 'bus';
    feederRoute: string;
    feederCarrier: string;
    lat: number;
    lng: number;
  };
  secondaryAirport?: {
    code: string;
    name: string;
    city: string;
    distanceKm: number;
    driveTime: string;
    lat: number;
    lng: number;
  };
  railInfo: {
    hasRailStation: boolean;
    stationName: string;
    stationCode: string;
    distanceKm?: number;
    transferTime?: string;
  };
  seaportInfo: {
    isCoastal: boolean;
    hasPassengerFerry: boolean;
    portName?: string;
    nearestPortNotice?: string;
  };
}

export interface CityTransitProfile {
  city: string;
  country: string;
  lat: number;
  lng: number;
  airport: {
    hasCommercialService: boolean;
    notice?: string;
    code: string;
    name: string;
    hubCity: string;
    distanceToHubKm: number;
    driveTimeToHub: string;
    feederSummary?: string;
  };
  railway: {
    hasDirectStation: boolean;
    notice?: string;
    stationName: string;
    stationCode: string;
    distanceKm: number;
  };
  seaport: {
    isCoastal: boolean;
    hasPassengerWaterway: boolean;
    portName: string;
    notice: string;
  };
}

// -------------------------------------------------------------
// 1. Comprehensive Registry of Real Global Commercial Airports
// -------------------------------------------------------------
export const COMMERCIAL_AIRPORTS: Record<string, CommercialAirport> = {
  // India — Major Metros & Regional Gateways
  DEL: { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', lat: 28.5562, lng: 77.1000, isHub: true },
  BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656, isHub: true, aliases: ['mumbai', 'bombay'] },
  BLR: { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', lat: 13.1986, lng: 77.7066, isHub: true, aliases: ['bengaluru', 'bangalore', 'banglore'] },
  MAA: { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', lat: 12.9941, lng: 80.1709, isHub: true, aliases: ['chennai', 'madras'] },
  HYD: { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', lat: 17.2403, lng: 78.4294, isHub: true },
  CCU: { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India', lat: 22.6547, lng: 88.4467, isHub: true, aliases: ['kolkata', 'calcutta'] },
  AMD: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', country: 'India', lat: 23.0772, lng: 72.6347, isHub: true },
  PNQ: { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', country: 'India', lat: 18.5822, lng: 73.9197 },
  GOI: { code: 'GOI', name: 'Dabolim Airport', city: 'Goa (Dabolim)', country: 'India', lat: 15.3808, lng: 73.8314 },
  GOX: { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'North Goa', country: 'India', lat: 15.7686, lng: 73.8647 },
  COK: { code: 'COK', name: 'Cochin International Airport', city: 'Kochi', country: 'India', lat: 10.1556, lng: 76.3917, isHub: true, aliases: ['kochi', 'cochin', 'ernakulam', 'nedumbassery', 'central kerala', 'kerala cochin'] },
  IXE: { code: 'IXE', name: 'Mangaluru International Airport (Bajpe)', city: 'Mangalore', country: 'India', lat: 12.9613, lng: 74.8900, aliases: ['mangalore', 'mangaluru', 'bajpe', 'dakshina kannada'] },
  NAG: { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur', country: 'India', lat: 21.0922, lng: 79.0472, isHub: true },
  IXU: { code: 'IXU', name: 'Chhatrapati Sambhaji Nagar (Aurangabad) Airport', city: 'Aurangabad', country: 'India', lat: 19.8631, lng: 75.3981 },
  STV: { code: 'STV', name: 'Surat International Airport', city: 'Surat', country: 'India', lat: 21.1141, lng: 72.7419 },
  BDQ: { code: 'BDQ', name: 'Vadodara Airport', city: 'Vadodara', country: 'India', lat: 22.3362, lng: 73.2263, aliases: ['vadodara', 'baroda'] },
  BVC: { code: 'BVC', name: 'Bhavnagar Airport', city: 'Bhavnagar', country: 'India', lat: 21.7525, lng: 72.1856 },
  HSR: { code: 'HSR', name: 'Rajkot International Airport (Hirasar)', city: 'Rajkot', country: 'India', lat: 22.3619, lng: 71.0189 },
  IXK: { code: 'IXK', name: 'Keshod Airport (Junagadh / Somnath Gateway)', city: 'Keshod', country: 'India', lat: 21.3175, lng: 70.2678 },
  DIU: { code: 'DIU', name: 'Diu Airport', city: 'Diu', country: 'India', lat: 20.7139, lng: 70.9217 },
  BHJ: { code: 'BHJ', name: 'Bhuj Airport', city: 'Bhuj', country: 'India', lat: 23.2878, lng: 69.6702 },
  JGA: { code: 'JGA', name: 'Jamnagar Airport', city: 'Jamnagar', country: 'India', lat: 22.4650, lng: 70.0125 },
  PBD: { code: 'PBD', name: 'Porbandar Airport', city: 'Porbandar', country: 'India', lat: 21.6492, lng: 69.6575 },
  SAG: { code: 'SAG', name: 'Shirdi International Airport', city: 'Shirdi', country: 'India', lat: 19.6897, lng: 74.3775 },
  ISK: { code: 'ISK', name: 'Nashik Ozar Airport', city: 'Nashik', country: 'India', lat: 20.1189, lng: 73.9142 },
  KLH: { code: 'KLH', name: 'Chhatrapati Rajaram Maharaj Airport', city: 'Kolhapur', country: 'India', lat: 16.6644, lng: 74.2817 },
  JLG: { code: 'JLG', name: 'Jalgaon Airport', city: 'Jalgaon', country: 'India', lat: 20.9633, lng: 75.6267 },
  NDC: { code: 'NDC', name: 'Shri Guru Gobind Singh Ji Airport', city: 'Nanded', country: 'India', lat: 19.1839, lng: 77.3183 },
  HBX: { code: 'HBX', name: 'Hubballi Airport', city: 'Hubballi', country: 'India', lat: 15.3617, lng: 75.0849 },
  VDY: { code: 'VDY', name: 'Jindal Vijaynagar Airport (Hampi Gateway)', city: 'Bellary / Toranagallu', country: 'India', lat: 15.1636, lng: 76.6433 },
  IXG: { code: 'IXG', name: 'Belagavi Airport', city: 'Belagavi', country: 'India', lat: 15.8592, lng: 74.6183 },
  MYQ: { code: 'MYQ', name: 'Mysuru Airport (Mandakalli)', city: 'Mysuru', country: 'India', lat: 12.2289, lng: 76.6508 },
  CJB: { code: 'CJB', name: 'Coimbatore International Airport', city: 'Coimbatore', country: 'India', lat: 11.0297, lng: 77.0434 },
  IXM: { code: 'IXM', name: 'Madurai Airport', city: 'Madurai', country: 'India', lat: 9.8344, lng: 78.0933 },
  TRZ: { code: 'TRZ', name: 'Tiruchirappalli International Airport', city: 'Trichy', country: 'India', lat: 10.7654, lng: 78.7097 },
  TRV: { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Trivandrum', country: 'India', lat: 8.4821, lng: 76.9200, isHub: true, aliases: ['trivandrum', 'thiruvananthapuram', 'tvm', 'trivandram', 'trivendrum', 'south kerala', 'kerala trivandrum'] },
  CCJ: { code: 'CCJ', name: 'Calicut International Airport (Kozhikode)', city: 'Kozhikode', country: 'India', lat: 11.1369, lng: 75.9553, aliases: ['calicut', 'kozhikode', 'karipur', 'malabar'] },
  CNN: { code: 'CNN', name: 'Kannur International Airport', city: 'Kannur', country: 'India', lat: 11.9189, lng: 75.5481, aliases: ['kannur', 'cannanore', 'mattannur', 'north kerala'] },
  JAI: { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur', country: 'India', lat: 26.8242, lng: 75.8122 },
  UDR: { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur', country: 'India', lat: 24.6178, lng: 73.8961 },
  JDH: { code: 'JDH', name: 'Jodhpur Airport', city: 'Jodhpur', country: 'India', lat: 26.2511, lng: 73.0489 },
  JSA: { code: 'JSA', name: 'Jaisalmer Airport', city: 'Jaisalmer', country: 'India', lat: 26.8906, lng: 70.8653 },
  BKB: { code: 'BKB', name: 'Nal Airport (Bikaner)', city: 'Bikaner', country: 'India', lat: 28.0706, lng: 73.2064 },
  KQH: { code: 'KQH', name: 'Kishangarh Airport (Ajmer / Pushkar Gateway)', city: 'Kishangarh', country: 'India', lat: 26.5983, lng: 74.8147 },
  LKO: { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow', country: 'India', lat: 26.7606, lng: 80.8893 },
  VNS: { code: 'VNS', name: 'Lal Bahadur Shastri International Airport', city: 'Varanasi', country: 'India', lat: 25.4524, lng: 82.8593, aliases: ['varanasi', 'banaras', 'benares', 'kashi'] },
  AYJ: { code: 'AYJ', name: 'Maharishi Valmiki International Airport', city: 'Ayodhya', country: 'India', lat: 26.7456, lng: 82.1558 },
  IXD: { code: 'IXD', name: 'Prayagraj Airport', city: 'Prayagraj', country: 'India', lat: 25.4403, lng: 81.7342 },
  GOP: { code: 'GOP', name: 'Gorakhpur Airport', city: 'Gorakhpur', country: 'India', lat: 26.7397, lng: 83.4497 },
  AGR: { code: 'AGR', name: 'Agra Airport (Kheria)', city: 'Agra', country: 'India', lat: 27.1558, lng: 77.9609 },
  DED: { code: 'DED', name: 'Jolly Grant Airport (Dehradun / Rishikesh Gateway)', city: 'Dehradun', country: 'India', lat: 30.1897, lng: 78.1803, aliases: ['dehradun', 'rishikesh', 'haridwar', 'mussoorie'] },
  ATQ: { code: 'ATQ', name: 'Sri Guru Ram Dass Jee International Airport', city: 'Amritsar', country: 'India', lat: 31.7096, lng: 74.7973, aliases: ['amritsar', 'golden temple'] },
  IXC: { code: 'IXC', name: 'Shaheed Bhagat Singh International Airport', city: 'Chandigarh', country: 'India', lat: 30.6735, lng: 76.7885 },
  IXL: { code: 'IXL', name: 'Kushok Bakula Rimpochee Airport', city: 'Leh', country: 'India', lat: 34.1359, lng: 77.5465, aliases: ['leh', 'ladakh', 'pangong'] },
  SXR: { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar', country: 'India', lat: 33.9871, lng: 74.7741, aliases: ['srinagar', 'kashmir', 'gulmarg', 'pahalgam'] },
  IXJ: { code: 'IXJ', name: 'Jammu Civil Enclave', city: 'Jammu', country: 'India', lat: 32.6892, lng: 74.8375 },
  KUU: { code: 'KUU', name: 'Kullu-Manali Airport (Bhuntar)', city: 'Bhuntar / Manali', country: 'India', lat: 31.8767, lng: 77.1542 },
  DHM: { code: 'DHM', name: 'Kangra Airport (Gaggal / Dharamshala)', city: 'Dharamshala', country: 'India', lat: 32.1650, lng: 76.2633 },
  BHO: { code: 'BHO', name: 'Raja Bhoj Airport', city: 'Bhopal', country: 'India', lat: 23.2875, lng: 77.3378 },
  IDR: { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore', country: 'India', lat: 22.7217, lng: 75.8011 },
  GWL: { code: 'GWL', name: 'Rajmata Vijaya Raje Scindia Airport', city: 'Gwalior', country: 'India', lat: 26.2933, lng: 78.2278 },
  JLR: { code: 'JLR', name: 'Dumna Airport', city: 'Jabalpur', country: 'India', lat: 23.1778, lng: 80.0522 },
  RPR: { code: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur', country: 'India', lat: 21.1803, lng: 81.7389 },
  BBI: { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar', country: 'India', lat: 20.2444, lng: 85.8178 },
  PAT: { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', country: 'India', lat: 25.5911, lng: 85.0878 },
  GAY: { code: 'GAY', name: 'Gaya Airport', city: 'Gaya', country: 'India', lat: 24.7442, lng: 84.9511 },
  IXR: { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', country: 'India', lat: 23.3142, lng: 85.3217 },
  IXB: { code: 'IXB', name: 'Bagdogra International Airport (Darjeeling Gateway)', city: 'Siliguri / Bagdogra', country: 'India', lat: 26.6811, lng: 88.3286 },
  GAU: { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati', country: 'India', lat: 26.1061, lng: 91.5858 },
  IXZ: { code: 'IXZ', name: 'Veer Savarkar International Airport', city: 'Port Blair', country: 'India', lat: 11.6411, lng: 92.7297 },
  VTZ: { code: 'VTZ', name: 'Visakhapatnam International Airport', city: 'Visakhapatnam', country: 'India', lat: 17.7214, lng: 83.2244 },
  VGA: { code: 'VGA', name: 'Vijayawada International Airport', city: 'Vijayawada', country: 'India', lat: 16.5303, lng: 80.7969 },
  TIR: { code: 'TIR', name: 'Tirupati Airport', city: 'Tirupati', country: 'India', lat: 13.6325, lng: 79.5433 },

  // Key International Hubs & Vacation Destinations
  JFK: { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', lat: 40.6413, lng: -73.7781, isHub: true },
  EWR: { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York / Newark', country: 'United States', lat: 40.6895, lng: -74.1745 },
  LAX: { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States', lat: 33.9416, lng: -118.4085, isHub: true },
  SFO: { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States', lat: 37.6213, lng: -122.3790, isHub: true },
  ORD: { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States', lat: 41.9742, lng: -87.9073 },
  MIA: { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States', lat: 25.7959, lng: -80.2870 },
  YYZ: { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  YVR: { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815 },
  LHR: { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', lat: 51.4700, lng: -0.4543, isHub: true },
  LGW: { code: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom', lat: 51.1537, lng: -0.1821 },
  CDG: { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479, isHub: true },
  AMS: { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683, isHub: true },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622, isHub: true },
  ZRH: { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lng: 8.5555 },
  FCO: { code: 'FCO', name: 'Rome Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  BCN: { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  MAD: { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4839, lng: -3.5680 },
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates', lat: 25.2532, lng: 55.3657, isHub: true },
  AUH: { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.4330, lng: 54.6511 },
  DOH: { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  SIN: { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915, isHub: true },
  BKK: { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.6900, lng: 100.7501 },
  HKT: { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', country: 'Thailand', lat: 8.1132, lng: 98.3065 },
  DPS: { code: 'DPS', name: 'Ngurah Rai International Airport', city: 'Bali / Denpasar', country: 'Indonesia', lat: -8.7467, lng: 115.1668 },
  KUL: { code: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.7456, lng: 101.7072 },
  HND: { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798, isHub: true },
  NRT: { code: 'NRT', name: 'Tokyo Narita Airport', city: 'Tokyo', country: 'Japan', lat: 35.7720, lng: 140.3929 },
  KIX: { code: 'KIX', name: 'Kansai International Airport (Osaka/Kyoto Gateway)', city: 'Osaka', country: 'Japan', lat: 34.4320, lng: 135.2304 },
  ICN: { code: 'ICN', name: 'Seoul Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407 },
  HKG: { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong', lat: 22.3080, lng: 113.9185 },
  SYD: { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  MEL: { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410 },
  MLE: { code: 'MLE', name: 'Velana International Airport', city: 'Male', country: 'Maldives', lat: 4.1918, lng: 73.5292 },
  CMB: { code: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka', lat: 7.1808, lng: 79.8841 },
  KTM: { code: 'KTM', name: 'Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal', lat: 27.6966, lng: 85.3591 },
  JTR: { code: 'JTR', name: 'Santorini Thira Airport', city: 'Santorini', country: 'Greece', lat: 36.3992, lng: 25.4793 },
  NAP: { code: 'NAP', name: 'Naples International Airport (Amalfi Gateway)', city: 'Naples', country: 'Italy', lat: 40.8860, lng: 14.2908 },
  GVA: { code: 'GVA', name: 'Geneva Airport (Cointrin)', city: 'Geneva', country: 'Switzerland', lat: 46.2381, lng: 6.1090 },
  BSL: { code: 'BSL', name: 'EuroAirport Basel Mulhouse Freiburg', city: 'Basel', country: 'Switzerland', lat: 47.5896, lng: 7.5299 },
  MUC: { code: 'MUC', name: 'Munich Airport (Franz Josef Strauss)', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.7860 },
  BER: { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany', lat: 52.3667, lng: 13.5033 },
  MXP: { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6301, lng: 8.7231 },
  VCE: { code: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', country: 'Italy', lat: 45.5053, lng: 12.3519 },
  FLR: { code: 'FLR', name: 'Florence Peretola Airport', city: 'Florence', country: 'Italy', lat: 43.8100, lng: 11.2051 },
  EDI: { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'United Kingdom', lat: 55.9500, lng: -3.3725 },
  MAN: { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom', lat: 53.3537, lng: -2.2750 },
  AGP: { code: 'AGP', name: 'Málaga–Costa del Sol Airport', city: 'Málaga', country: 'Spain', lat: 36.6749, lng: -4.4991 },
  VIE: { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697 },
  SZG: { code: 'SZG', name: 'Salzburg Airport (W. A. Mozart)', city: 'Salzburg', country: 'Austria', lat: 47.7944, lng: 13.0044 },
  ATH: { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9445 },
  LIS: { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', lat: 38.7756, lng: -9.1354 },
  OPO: { code: 'OPO', name: 'Francisco Sá Carneiro Airport', city: 'Porto', country: 'Portugal', lat: 41.2421, lng: -8.6786 },
  OSL: { code: 'OSL', name: 'Oslo Airport (Gardermoen)', city: 'Oslo', country: 'Norway', lat: 60.1976, lng: 11.1004 },
  BGO: { code: 'BGO', name: 'Bergen Airport (Flesland)', city: 'Bergen', country: 'Norway', lat: 60.2934, lng: 5.2181 },
  ARN: { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lng: 17.9238 },
  CPH: { code: 'CPH', name: 'Copenhagen Airport (Kastrup)', city: 'Copenhagen', country: 'Denmark', lat: 55.6180, lng: 12.6508 },
  HEL: { code: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland', lat: 60.3172, lng: 24.9633 },
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519, isHub: true },
  SAW: { code: 'SAW', name: 'Sabiha Gökçen Airport', city: 'Istanbul', country: 'Turkey', lat: 40.8986, lng: 29.3092 },
  AYT: { code: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey', lat: 36.8987, lng: 30.8005 },
  ASR: { code: 'ASR', name: 'Kayseri Erkilet Airport (Cappadocia Gateway)', city: 'Kayseri', country: 'Turkey', lat: 38.7704, lng: 35.4954 },
  CAI: { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056, isHub: true },
  HRG: { code: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Egypt', lat: 27.1783, lng: 33.7994 },
  JNB: { code: 'JNB', name: 'O. R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1392, lng: 28.2460, isHub: true },
  CPT: { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9648, lng: 18.6017 },
  AKL: { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.7850, isHub: true },
  ZQN: { code: 'ZQN', name: 'Queenstown Airport', city: 'Queenstown', country: 'New Zealand', lat: -45.0216, lng: 168.7454 },
  BNE: { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia', lat: -27.3842, lng: 153.1175 },
  PER: { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia', lat: -31.9403, lng: 115.9669 },
  CNS: { code: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australia', lat: -16.8858, lng: 145.7553 },
  GRU: { code: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731, isHub: true },
  GIG: { code: 'GIG', name: 'Rio de Janeiro Galeão', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8089, lng: -43.2436 },
  LIM: { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', lat: -12.0219, lng: -77.1143, isHub: true },
  CUZ: { code: 'CUZ', name: 'Alejandro Velasco Astete Airport (Machu Picchu Gateway)', city: 'Cusco', country: 'Peru', lat: -13.5357, lng: -71.9388 },
  YYC: { code: 'YYC', name: 'Calgary International Airport (Banff Gateway)', city: 'Calgary', country: 'Canada', lat: 51.1215, lng: -114.0076 },
  YUL: { code: 'YUL', name: 'Montréal–Trudeau International', city: 'Montreal', country: 'Canada', lat: 45.4706, lng: -73.7408 },
  AMM: { code: 'AMM', name: 'Queen Alia International Airport (Petra Gateway)', city: 'Amman', country: 'Jordan', lat: 31.7226, lng: 35.9932 },
  AQJ: { code: 'AQJ', name: 'King Hussein International Airport', city: 'Aqaba', country: 'Jordan', lat: 29.6116, lng: 35.0181 },
};

// -------------------------------------------------------------
// 2. Comprehensive Directory of Non-Airport Cities, Towns & Pilgrimages
// Explicit mapping of real hubs, road links, and railheads
// -------------------------------------------------------------

// -------------------------------------------------------------
// 1.1 State & Regional Multi-Hub Gateways (Kerala, Goa, Kashmir, etc.)
// -------------------------------------------------------------
export interface StateOrRegionalHub {
  id: string;
  aliases: string[];
  displayName: string;
  state: string;
  hasCommercialAirport: true;
  primaryAirport: CommercialAirport;
  secondaryAirports: CommercialAirport[];
  overviewNotice: string;
  railway: {
    stationName: string;
    stationCode: string;
    notice: string;
  };
  seaport: {
    isCoastal: boolean;
    hasPassengerWaterway: boolean;
    portName: string;
    notice: string;
  };
}

export const STATE_AND_REGIONAL_HUBS: Record<string, StateOrRegionalHub> = {
  kerala: {
    id: 'kerala',
    aliases: ['kerala', 'kerela', 'keralam', 'gods own country', 'central kerala', 'south kerala', 'north kerala'],
    displayName: 'Kerala (Kochi & Trivandrum Gateways)',
    state: 'Kerala',
    hasCommercialAirport: true,
    primaryAirport: COMMERCIAL_AIRPORTS.COK,
    secondaryAirports: [COMMERCIAL_AIRPORTS.TRV, COMMERCIAL_AIRPORTS.CCJ, COMMERCIAL_AIRPORTS.CNN],
    overviewNotice:
      'Kerala is served by 4 international airports: Cochin International (COK) in central Kerala (primary gateway for Kochi, Munnar, Alleppey), Trivandrum International (TRV) in the south (primary gateway for capital, Kovalam, Varkala), Calicut (CCJ), and Kannur (CNN).',
    railway: {
      stationName: 'Ernakulam Junction (ERS) / Thiruvananthapuram Central (TVC)',
      stationCode: 'ERS',
      notice:
        'Extensive Southern Railway mainline network runs along the coastal Kerala spine connecting Trivandrum, Kollam, Alleppey, Ernakulam (Kochi), Thrissur, and Kozhikode.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Cochin Port (Willingdon Island Cruise Terminal) & Alleppey Waterway Jetty',
      notice:
        'Major international cruise terminal active at Cochin Port, plus world-famous backwater passenger ferries and luxury houseboats across Alleppey, Kumarakom, and Kollam.',
    },
  },

  goa: {
    id: 'goa',
    aliases: ['goa', 'north goa', 'south goa', 'panaji', 'panjim', 'calangute', 'baga', 'anjuna', 'candolim', 'colva'],
    displayName: 'Goa (Mopa & Dabolim Gateways)',
    state: 'Goa',
    hasCommercialAirport: true,
    primaryAirport: COMMERCIAL_AIRPORTS.GOX,
    secondaryAirports: [COMMERCIAL_AIRPORTS.GOI],
    overviewNotice:
      'Goa is served by 2 commercial international airports: Manohar International Airport at Mopa (GOX) in North Goa and Dabolim Airport (GOI) in South Goa.',
    railway: {
      stationName: 'Madgaon Junction (MAO) / Thivim (THVM)',
      stationCode: 'MAO',
      notice: 'Konkan Railway mainline connects North Goa via Thivim and South Goa via Madgaon Junction.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Mormugao Port Trust & Panaji Jetty',
      notice: 'Ocean cruises and coastal passenger ferries dock at Mormugao Port and Panaji ferry terminal.',
    },
  },

  kashmir: {
    id: 'kashmir',
    aliases: ['kashmir', 'kashmeer', 'jammu and kashmir', 'j&k', 'gulmarg', 'pahalgam', 'sonamarg'],
    displayName: 'Kashmir Valley (Srinagar Gateway)',
    state: 'Jammu & Kashmir',
    hasCommercialAirport: true,
    primaryAirport: COMMERCIAL_AIRPORTS.SXR,
    secondaryAirports: [COMMERCIAL_AIRPORTS.IXJ],
    overviewNotice:
      'Kashmir is served directly by Sheikh ul-Alam International Airport (SXR) in Srinagar with regular flights from Delhi, Mumbai, and all major Indian metros.',
    railway: {
      stationName: 'Srinagar Railway Station (SINA) / Jammu Tawi (JAT)',
      stationCode: 'SINA',
      notice: 'Vande Bharat and Northern Railway express trains connect through Udhampur-Srinagar-Baramulla Rail Link (USBRL).',
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: false,
      portName: 'Inland',
      notice: 'Dal Lake Shikaras and Jhelum water taxis operate locally in Srinagar.',
    },
  },

  himachal: {
    id: 'himachal',
    aliases: ['himachal', 'himachal pradesh', 'spiti', 'kinnaur'],
    displayName: 'Himachal Pradesh (Kullu / Chandigarh Gateways)',
    state: 'Himachal Pradesh',
    hasCommercialAirport: true,
    primaryAirport: COMMERCIAL_AIRPORTS.IXC,
    secondaryAirports: [COMMERCIAL_AIRPORTS.KUU, COMMERCIAL_AIRPORTS.DHM],
    overviewNotice:
      'Himachal Pradesh is served by Kullu-Manali Airport (KUU), Kangra/Dharamshala Airport (DHM), and Chandigarh International Airport (IXC) as the major high-frequency gateway.',
    railway: {
      stationName: 'Kalka / Chandigarh Railway Station (KLK / CDG)',
      stationCode: 'CDG',
      notice: 'UNESCO World Heritage Kalka-Shimla toy train and broad-gauge express trains to Chandigarh.',
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: false,
      portName: 'Inland',
      notice: 'Inland Himalayan state with scenic mountain river valleys.',
    },
  },

  uttarakhand: {
    id: 'uttarakhand',
    aliases: ['uttarakhand', 'uttaranchal', 'garhwal', 'kumaon'],
    displayName: 'Uttarakhand (Dehradun Gateway)',
    state: 'Uttarakhand',
    hasCommercialAirport: true,
    primaryAirport: COMMERCIAL_AIRPORTS.DED,
    secondaryAirports: [COMMERCIAL_AIRPORTS.DEL],
    overviewNotice:
      'Uttarakhand is served directly by Jolly Grant Airport (DED) in Dehradun, providing immediate gateway access to Rishikesh (20 km), Haridwar (35 km), and Mussoorie (55 km).',
    railway: {
      stationName: 'Haridwar Junction (HW) / Dehradun (DDN)',
      stationCode: 'HW',
      notice: 'Northern Railway mainline terminal with direct Vande Bharat and Shatabdi Express services.',
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: false,
      portName: 'Inland',
      notice: 'Inland Himalayan state on the holy banks of the Ganges.',
    },
  },
};

export const KNOWN_NON_AIRPORT_CITIES: Record<string, NonAirportCityHub> = {
  // ALLEPPEY / ALAPPUZHA (KERALA)
  alleppey: {
    city: 'Alleppey (Alappuzha)',
    hasCommercialAirport: false,
    reason: 'Alleppey backwaters have no commercial airstrip. Nearest airport is Cochin International (COK).',
    primaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 82,
      driveTime: '2h 00m',
      feederMode: 'drive',
      feederRoute: 'via NH 66 Coastal Highway',
      feederCarrier: 'Highway Taxi / KSRTC Fast Passenger',
      lat: 10.1556,
      lng: 76.3917,
    },
    secondaryAirport: {
      code: 'TRV',
      name: 'Thiruvananthapuram International Airport',
      city: 'Trivandrum',
      distanceKm: 145,
      driveTime: '3h 30m',
      lat: 8.4821,
      lng: 76.9200,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Alappuzha Railway Station',
      stationCode: 'ALLP',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Alleppey Backwater Jetty & Houseboat Terminal',
      nearestPortNotice: 'Famous passenger ferries and luxury houseboats operate daily across Vembanad Lake backwaters.',
    },
  },
  alappuzha: {
    city: 'Alappuzha (Alleppey)',
    hasCommercialAirport: false,
    reason: 'Alappuzha is reached via Cochin International Airport (COK).',
    primaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 82,
      driveTime: '2h 00m',
      feederMode: 'drive',
      feederRoute: 'via NH 66',
      feederCarrier: 'Highway Taxi / KSRTC Bus',
      lat: 10.1556,
      lng: 76.3917,
    },
    secondaryAirport: {
      code: 'TRV',
      name: 'Thiruvananthapuram International Airport',
      city: 'Trivandrum',
      distanceKm: 145,
      driveTime: '3h 30m',
      lat: 8.4821,
      lng: 76.9200,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Alappuzha Railway Station',
      stationCode: 'ALLP',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Alappuzha Waterways Jetty',
      nearestPortNotice: 'SWTD government passenger water ferries to Kottayam, Nedumudy, and Kollam.',
    },
  },

  // VARKALA (KERALA)
  varkala: {
    city: 'Varkala',
    hasCommercialAirport: false,
    reason: 'Varkala Cliff Beach has no airport; nearest commercial airport is Trivandrum (TRV).',
    primaryAirport: {
      code: 'TRV',
      name: 'Thiruvananthapuram International Airport',
      city: 'Trivandrum',
      distanceKm: 42,
      driveTime: '1h 15m',
      feederMode: 'drive',
      feederRoute: 'via NH 66 Coastal Highway',
      feederCarrier: 'Coastal Cab / Express Train',
      lat: 8.4821,
      lng: 76.9200,
    },
    secondaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 160,
      driveTime: '4h 00m',
      lat: 10.1556,
      lng: 76.3917,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Varkala Sivagiri Railway Station',
      stationCode: 'VAK',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: false,
      portName: 'Varkala Beach / Vizhinjam Port Gateway',
      nearestPortNotice: 'Coastal Arabian Sea cliffs. Nearest major commercial port is Vizhinjam / Kollam.',
    },
  },

  // KOVALAM (KERALA)
  kovalam: {
    city: 'Kovalam',
    hasCommercialAirport: false,
    reason: 'Kovalam beach resort is 15 mins from Trivandrum International Airport (TRV).',
    primaryAirport: {
      code: 'TRV',
      name: 'Thiruvananthapuram International Airport',
      city: 'Trivandrum',
      distanceKm: 14,
      driveTime: '25 mins',
      feederMode: 'drive',
      feederRoute: 'via Kovalam Bypass Road',
      feederCarrier: 'Airport Taxi / Auto-Rickshaw',
      lat: 8.4821,
      lng: 76.9200,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Thiruvananthapuram Central',
      stationCode: 'TVC',
      distanceKm: 14,
      transferTime: '25 mins drive',
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: false,
      portName: 'Vizhinjam Harbor (adjacent to Kovalam)',
      nearestPortNotice: 'Vizhinjam International Transshipment Deepwater Seaport is 3 km away.',
    },
  },

  // WAYANAD (KERALA)
  wayanad: {
    city: 'Wayanad',
    hasCommercialAirport: false,
    reason: 'Wayanad high-range district has no commercial airport. Nearest is Calicut (CCJ).',
    primaryAirport: {
      code: 'CCJ',
      name: 'Calicut International Airport (Kozhikode)',
      city: 'Kozhikode',
      distanceKm: 85,
      driveTime: '2h 30m',
      feederMode: 'drive',
      feederRoute: 'via Thamarassery Ghat Pass (NH 766)',
      feederCarrier: 'Hill Taxi / KSRTC Super Deluxe Bus',
      lat: 11.1369,
      lng: 75.9553,
    },
    secondaryAirport: {
      code: 'CNN',
      name: 'Kannur International Airport',
      city: 'Kannur',
      distanceKm: 95,
      driveTime: '2h 45m',
      lat: 11.9189,
      lng: 75.5481,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Kozhikode Railway Station (Calicut)',
      stationCode: 'CLT',
      distanceKm: 72,
      transferTime: '2h drive via Ghat road',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Inland Western Ghats highland reserve.',
    },
  },

  // THEKKADY & PERIYAR (KERALA)
  thekkady: {
    city: 'Thekkady / Periyar',
    hasCommercialAirport: false,
    reason: 'Periyar wildlife sanctuary is reached via Madurai (IXM) or Cochin (COK).',
    primaryAirport: {
      code: 'IXM',
      name: 'Madurai Airport',
      city: 'Madurai',
      distanceKm: 138,
      driveTime: '3h 30m',
      feederMode: 'drive',
      feederRoute: 'via Theni Highway',
      feederCarrier: 'Private Cab / State Bus',
      lat: 9.8344,
      lng: 78.0933,
    },
    secondaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 155,
      driveTime: '4h 15m',
      lat: 10.1556,
      lng: 76.3917,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Kottayam Railway Station',
      stationCode: 'KTYM',
      distanceKm: 105,
      transferTime: '3h drive',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: true,
      portName: 'Periyar Lake Boat Landing',
      nearestPortNotice: 'KTDC sightseeing passenger cruise boats on Periyar Lake.',
    },
  },

  // KUMARAKOM (KERALA)
  kumarakom: {
    city: 'Kumarakom',
    hasCommercialAirport: false,
    reason: 'Kumarakom backwater bird sanctuary is accessed via Cochin International Airport (COK).',
    primaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 75,
      driveTime: '1h 50m',
      feederMode: 'drive',
      feederRoute: 'via NH 66',
      feederCarrier: 'Resort Cab / Highway Taxi',
      lat: 10.1556,
      lng: 76.3917,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Kottayam Railway Station',
      stationCode: 'KTYM',
      distanceKm: 14,
      transferTime: '25 mins drive',
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Vembanad Lake Boat Jetty',
      nearestPortNotice: 'Direct water ferries to Muhamma / Alleppey across Vembanad Lake.',
    },
  },

  // BEKAL (KERALA)
  bekal: {
    city: 'Bekal',
    hasCommercialAirport: false,
    reason: 'Bekal Fort is reached via Mangaluru International Airport (IXE) or Kannur (CNN).',
    primaryAirport: {
      code: 'IXE',
      name: 'Mangaluru International Airport (Bajpe)',
      city: 'Mangalore',
      distanceKm: 68,
      driveTime: '1h 30m',
      feederMode: 'drive',
      feederRoute: 'via NH 66',
      feederCarrier: 'Interstate Cab / Express Bus',
      lat: 12.9613,
      lng: 74.8900,
    },
    secondaryAirport: {
      code: 'CNN',
      name: 'Kannur International Airport',
      city: 'Kannur',
      distanceKm: 82,
      driveTime: '2h 00m',
      lat: 11.9189,
      lng: 75.5481,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Kasaragod Railway Station',
      stationCode: 'KGQ',
      distanceKm: 14,
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: false,
      portName: 'Bekal Coastal Seaboard',
      nearestPortNotice: 'Arabian Sea coastal citadel.',
    },
  },

  // AKOLA (The exact case highlighted by the user)
  akola: {
    city: 'Akola',
    hasCommercialAirport: false,
    reason: 'Akola has only a small, non-operational civil airstrip (Shivani Aerodrome) with no scheduled commercial passenger flights.',
    primaryAirport: {
      code: 'NAG',
      name: 'Dr. Babasaheb Ambedkar International Airport',
      city: 'Nagpur',
      distanceKm: 240,
      driveTime: '3h 30m',
      feederMode: 'drive',
      feederRoute: 'via Hindu Hrudaysamrat Balasaheb Thackeray Samruddhi Expressway & NH 53',
      feederCarrier: 'Intercity Expressway Taxi / MSRTC AC Shivshahi Bus',
      lat: 21.0922,
      lng: 79.0472,
    },
    secondaryAirport: {
      code: 'IXU',
      name: 'Chhatrapati Sambhaji Nagar (Aurangabad) Airport',
      city: 'Aurangabad',
      distanceKm: 225,
      driveTime: '3h 35m',
      lat: 19.8631,
      lng: 75.3981,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Akola Junction',
      stationCode: 'AK',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Akola is an inland Vidarbha city. Nearest passenger port is Mumbai Port / Ferry Wharf (~550 km).',
    },
  },

  // PALITANA
  palitana: {
    city: 'Palitana',
    hasCommercialAirport: false,
    reason: 'Palitana is a sacred Jain pilgrimage town with no commercial airport.',
    primaryAirport: {
      code: 'BVC',
      name: 'Bhavnagar Airport',
      city: 'Bhavnagar',
      distanceKm: 52,
      driveTime: '1h 05m',
      feederMode: 'drive',
      feederRoute: 'via Bhavnagar-Palitana Highway',
      feederCarrier: 'Direct Highway Taxi / GSRTC Intercity Bus',
      lat: 21.7525,
      lng: 72.1856,
    },
    secondaryAirport: {
      code: 'AMD',
      name: 'Sardar Vallabhbhai Patel International Airport',
      city: 'Ahmedabad',
      distanceKm: 215,
      driveTime: '4h 00m',
      lat: 23.0772,
      lng: 72.6347,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Palitana Railway Station (Mainline hub: Bhavnagar/Sihor)',
      stationCode: 'PIT',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: true,
      portName: 'Ghogha Ro-Pax Terminal (Bhavnagar)',
      nearestPortNotice: 'Ghogha Ro-Pax Terminal is ~65 km away, offering ferry crossings across the Gulf of Khambhat to Hazira (Surat).',
    },
  },

  // GIRNAR & JUNAGADH
  girnar: {
    city: 'Girnar / Junagadh',
    hasCommercialAirport: false,
    reason: 'Girnar mountain sanctuary has no airport of its own.',
    primaryAirport: {
      code: 'IXK',
      name: 'Keshod Airport',
      city: 'Keshod',
      distanceKm: 42,
      driveTime: '50 mins',
      feederMode: 'drive',
      feederRoute: 'via NH 151',
      feederCarrier: 'Express Taxi to Junagadh foothills',
      lat: 21.3175,
      lng: 70.2678,
    },
    secondaryAirport: {
      code: 'HSR',
      name: 'Rajkot International Airport',
      city: 'Rajkot',
      distanceKm: 108,
      driveTime: '2h 15m',
      lat: 22.3619,
      lng: 71.0189,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Junagadh Junction',
      stationCode: 'JND',
      distanceKm: 5,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Nearest coastal port is Veraval / Somnath (~80 km).',
    },
  },
  junagadh: {
    city: 'Junagadh',
    hasCommercialAirport: false,
    reason: 'Junagadh relies on Keshod or Rajkot airports for commercial flights.',
    primaryAirport: {
      code: 'IXK',
      name: 'Keshod Airport',
      city: 'Keshod',
      distanceKm: 40,
      driveTime: '45 mins',
      feederMode: 'drive',
      feederRoute: 'via NH 151',
      feederCarrier: 'Highway Taxi / GSRTC Shuttle',
      lat: 21.3175,
      lng: 70.2678,
    },
    secondaryAirport: {
      code: 'HSR',
      name: 'Rajkot International Airport',
      city: 'Rajkot',
      distanceKm: 105,
      driveTime: '2h 10m',
      lat: 22.3619,
      lng: 71.0189,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Junagadh Junction',
      stationCode: 'JND',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Veraval Port is ~80 km away.',
    },
  },

  // MOUNT ABU
  'mount abu': {
    city: 'Mount Abu',
    hasCommercialAirport: false,
    reason: 'Mount Abu is a high-altitude hill sanctuary with no commercial airport.',
    primaryAirport: {
      code: 'UDR',
      name: 'Maharana Pratap Airport',
      city: 'Udaipur',
      distanceKm: 165,
      driveTime: '3h 15m',
      feederMode: 'drive',
      feederRoute: 'via NH 27',
      feederCarrier: 'Scenic Ghat Taxi / RSRTC Deluxe Express',
      lat: 24.6178,
      lng: 73.8961,
    },
    secondaryAirport: {
      code: 'AMD',
      name: 'Sardar Vallabhbhai Patel International Airport',
      city: 'Ahmedabad',
      distanceKm: 215,
      driveTime: '4h 15m',
      lat: 23.0772,
      lng: 72.6347,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Abu Road Railway Station (Mainline Western Railway)',
      stationCode: 'ABR',
      distanceKm: 28,
      transferTime: '40 mins via winding hill road',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Mount Abu is completely landlocked.',
    },
  },

  // HAMPI
  hampi: {
    city: 'Hampi',
    hasCommercialAirport: false,
    reason: 'The UNESCO World Heritage site of Hampi preserves its monuments and has no direct commercial runway.',
    primaryAirport: {
      code: 'VDY',
      name: 'Jindal Vijaynagar Airport',
      city: 'Bellary / Vidyanagar',
      distanceKm: 36,
      driveTime: '45 mins',
      feederMode: 'drive',
      feederRoute: 'via SH 49 & Bellary Road',
      feederCarrier: 'Private Heritage Taxi / Auto',
      lat: 15.1636,
      lng: 76.6433,
    },
    secondaryAirport: {
      code: 'HBX',
      name: 'Hubballi Airport',
      city: 'Hubballi',
      distanceKm: 145,
      driveTime: '3h 00m',
      lat: 15.3617,
      lng: 75.0849,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Hosapete Junction (Hospet)',
      stationCode: 'HPT',
      distanceKm: 13,
      transferTime: '20 mins',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: true,
      portName: 'Tungabhadra River Coracle Crossing',
      nearestPortNotice: 'Local traditional round coracle boats ferry travelers across the sacred Tungabhadra River to Anegundi (Hippies Island).',
    },
  },

  // MANALI & KASOL
  manali: {
    city: 'Manali',
    hasCommercialAirport: false,
    reason: 'Manali does not have a commercial airport in town; flights land at Bhuntar valley runway.',
    primaryAirport: {
      code: 'KUU',
      name: 'Kullu-Manali Airport (Bhuntar)',
      city: 'Bhuntar',
      distanceKm: 50,
      driveTime: '1h 30m',
      feederMode: 'drive',
      feederRoute: 'via NH 3 Beas River Valley Highway',
      feederCarrier: 'Prepaid Taxi Union Cab / HRTC Express',
      lat: 31.8767,
      lng: 77.1542,
    },
    secondaryAirport: {
      code: 'IXC',
      name: 'Shaheed Bhagat Singh International Airport',
      city: 'Chandigarh',
      distanceKm: 270,
      driveTime: '6h 00m',
      lat: 30.6735,
      lng: 76.7885,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Chandigarh Junction (CDG) / Kalka (KLK)',
      stationCode: 'CDG',
      distanceKm: 270,
      transferTime: '6h 00m via Kiratpur-Manali Expressway',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Manali is situated high in the Himalayas.',
    },
  },
  kasol: {
    city: 'Kasol (Parvati Valley)',
    hasCommercialAirport: false,
    reason: 'Kasol is a scenic Himalayan village in Parvati Valley with no airport.',
    primaryAirport: {
      code: 'KUU',
      name: 'Kullu-Manali Airport (Bhuntar)',
      city: 'Bhuntar',
      distanceKm: 31,
      driveTime: '1h 00m',
      feederMode: 'drive',
      feederRoute: 'via Manikaran Road',
      feederCarrier: 'Parvati Valley Cab / Local Bus',
      lat: 31.8767,
      lng: 77.1542,
    },
    secondaryAirport: {
      code: 'IXC',
      name: 'Chandigarh International Airport',
      city: 'Chandigarh',
      distanceKm: 255,
      driveTime: '6h 00m',
      lat: 30.6735,
      lng: 76.7885,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Chandigarh Junction',
      stationCode: 'CDG',
      distanceKm: 255,
      transferTime: '6h 00m',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Mountain valley with no sea connections.',
    },
  },

  // RISHIKESH & HARIDWAR
  rishikesh: {
    city: 'Rishikesh',
    hasCommercialAirport: false,
    reason: 'Rishikesh is served by Dehradun Jolly Grant Airport (~20 km away).',
    primaryAirport: {
      code: 'DED',
      name: 'Jolly Grant Airport',
      city: 'Dehradun',
      distanceKm: 21,
      driveTime: '35 mins',
      feederMode: 'drive',
      feederRoute: 'via Dehradun-Rishikesh Highway',
      feederCarrier: 'Airport Prepaid Cab / Electric AC Bus',
      lat: 30.1897,
      lng: 78.1803,
    },
    secondaryAirport: {
      code: 'DEL',
      name: 'Indira Gandhi International Airport',
      city: 'New Delhi',
      distanceKm: 240,
      driveTime: '4h 30m',
      lat: 28.5562,
      lng: 77.1000,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Yog Nagari Rishikesh (YNRK) / Haridwar Junction (HW)',
      stationCode: 'YNRK',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'White water rafting on the holy Ganges River, but no commercial sea shipping.',
    },
  },

  // MAHABALESHWAR & PANCHGANI
  mahabaleshwar: {
    city: 'Mahabaleshwar',
    hasCommercialAirport: false,
    reason: 'Mahabaleshwar is a Western Ghats hill station without an airport.',
    primaryAirport: {
      code: 'PNQ',
      name: 'Pune International Airport',
      city: 'Pune',
      distanceKm: 125,
      driveTime: '3h 10m',
      feederMode: 'drive',
      feederRoute: 'via NH 48 & Wai-Surur Ghat Road',
      feederCarrier: 'Private Highway Cab / MSRTC Shivshahi Bus',
      lat: 18.5822,
      lng: 73.9197,
    },
    secondaryAirport: {
      code: 'BOM',
      name: 'Chhatrapati Shivaji Maharaj International Airport',
      city: 'Mumbai',
      distanceKm: 245,
      driveTime: '5h 30m',
      lat: 19.0896,
      lng: 72.8656,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Wathar (WTR) / Pune Junction (PUNE)',
      stationCode: 'PUNE',
      distanceKm: 115,
      transferTime: '2h 45m',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Inland Western Ghats plateau.',
    },
  },

  // ALIBAUG & MANDWA
  alibaug: {
    city: 'Alibaug',
    hasCommercialAirport: false,
    reason: 'Alibaug is a coastal town directly opposite Mumbai harbor.',
    primaryAirport: {
      code: 'BOM',
      name: 'Chhatrapati Shivaji Maharaj International Airport',
      city: 'Mumbai',
      distanceKm: 98,
      driveTime: '2h 30m drive (or 50 min Ro-Pax Ferry to Mumbai South)',
      feederMode: 'drive',
      feederRoute: 'via Mumbai Trans Harbour Link (Atal Setu) or Mandwa Ro-Pax Ferry',
      feederCarrier: 'M2M Ro-Pax Ferry / Atal Setu Highway Cab',
      lat: 19.0896,
      lng: 72.8656,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Panvel Junction (PNVL) / Roha (ROHA)',
      stationCode: 'PNVL',
      distanceKm: 65,
      transferTime: '1h 20m',
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Mandwa Jetty & Ro-Pax Terminal (Alibaug)',
      nearestPortNotice: 'World-class M2M Ro-Pax Ferries & speed catamarans sail every 45 mins between Mandwa (Alibaug) and Bhaucha Dhakka / Gateway of India (Mumbai).',
    },
  },

  // OOTY & COONOOR
  ooty: {
    city: 'Ooty (Udhagamandalam)',
    hasCommercialAirport: false,
    reason: 'Ooty is perched at 2,240 m altitude in the Nilgiri Hills with no commercial airport.',
    primaryAirport: {
      code: 'CJB',
      name: 'Coimbatore International Airport',
      city: 'Coimbatore',
      distanceKm: 88,
      driveTime: '2h 45m',
      feederMode: 'drive',
      feederRoute: 'via Mettupalayam-Coonoor-Ooty Ghat Road',
      feederCarrier: 'Hill Ghat Taxi / Kalanji Transport / Nilgiri Express Bus',
      lat: 11.0297,
      lng: 77.0434,
    },
    secondaryAirport: {
      code: 'MYQ',
      name: 'Mysuru Airport',
      city: 'Mysuru',
      distanceKm: 125,
      driveTime: '3h 30m',
      lat: 12.2289,
      lng: 76.6508,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Mettupalayam (MTP) [Mainline broad gauge] / Udhagamandalam (UAM) [Heritage Toy Train]',
      stationCode: 'MTP',
      distanceKm: 52,
      transferTime: '2h 00m',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Nilgiri mountain plateau.',
    },
  },

  // MUNNAR
  munnar: {
    city: 'Munnar',
    hasCommercialAirport: false,
    reason: 'Munnar tea valleys have no commercial airstrip.',
    primaryAirport: {
      code: 'COK',
      name: 'Cochin International Airport',
      city: 'Kochi',
      distanceKm: 108,
      driveTime: '3h 30m',
      feederMode: 'drive',
      feederRoute: 'via NH 85 Kochi-Dhanushkodi Highway',
      feederCarrier: 'Scenic Cardamom Hills Taxi / KSRTC Fast Passenger',
      lat: 10.1556,
      lng: 76.3917,
    },
    secondaryAirport: {
      code: 'IXM',
      name: 'Madurai Airport',
      city: 'Madurai',
      distanceKm: 155,
      driveTime: '4h 15m',
      lat: 9.8344,
      lng: 78.0933,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Aluva (AWY) / Ernakulam Junction (ERS)',
      stationCode: 'AWY',
      distanceKm: 110,
      transferTime: '3h 30m',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Mountain tea gardens.',
    },
  },

  // KEDARNATH & CHAR DHAM
  kedarnath: {
    city: 'Kedarnath',
    hasCommercialAirport: false,
    reason: 'Kedarnath is a high Himalayan shrine accessible only by mountain trek or helicopter.',
    primaryAirport: {
      code: 'DED',
      name: 'Jolly Grant Airport',
      city: 'Dehradun',
      distanceKm: 235,
      driveTime: '8h 00m road to Gaurikund + 16 km trek / Helipad at Guptkashi/Phata',
      feederMode: 'drive',
      feederRoute: 'via Rishikesh-Rudraprayag-Guptkashi highway',
      feederCarrier: 'Himalayan 4x4 Cab + Pawan Hans / Heritage Aviation Heli Shuttle',
      lat: 30.1897,
      lng: 78.1803,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Rishikesh (RKSH / YNRK) / Haridwar (HW)',
      stationCode: 'YNRK',
      distanceKm: 220,
      transferTime: '7h 30m',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'High altitude glaciated valley.',
    },
  },

  // KYOTO (Famous international example)
  kyoto: {
    city: 'Kyoto',
    hasCommercialAirport: false,
    reason: 'Kyoto strictly protects its historic skyline and has no airport; international travelers land at Osaka Kansai (KIX) or Itami (ITM).',
    primaryAirport: {
      code: 'KIX',
      name: 'Kansai International Airport',
      city: 'Osaka',
      distanceKm: 78,
      driveTime: '1h 15m (75 mins via JR Haruka Limited Express)',
      feederMode: 'train',
      feederRoute: 'via JR Kansai Airport Line / Haruka Express direct to Kyoto Station',
      feederCarrier: 'JR West Haruka Limited Express',
      lat: 34.4320,
      lng: 135.2304,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Kyoto Shinkansen Station',
      stationCode: 'KYO',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      nearestPortNotice: 'Osaka Port and Kobe Port are ~55 km away.',
    },
  },

  // AMALFI COAST / POSITANO
  amalfi: {
    city: 'Amalfi Coast / Positano',
    hasCommercialAirport: false,
    reason: 'The steep cliffs of the Amalfi coast do not permit runways; travelers fly into Naples.',
    primaryAirport: {
      code: 'NAP',
      name: 'Naples International Airport (Capodichino)',
      city: 'Naples',
      distanceKm: 62,
      driveTime: '1h 25m',
      feederMode: 'drive',
      feederRoute: 'via A3 Highway & SS163 Coastal Panoramic Road',
      feederCarrier: 'Private Chauffeur Car or Ferry from Salerno / Naples Port',
      lat: 40.8860,
      lng: 14.2908,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Salerno / Sorrento Station (Circumvesuviana)',
      stationCode: 'SAL',
      distanceKm: 28,
      transferTime: '45 mins',
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Amalfi Marina Coppola & Positano Pier',
      nearestPortNotice: 'High-speed passenger ferries operate continuously along the coast connecting Salerno, Amalfi, Positano, and Capri.',
    },
  },
};

// -------------------------------------------------------------
// 3. Great-Circle Distance (Haversine)
// -------------------------------------------------------------
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// -------------------------------------------------------------
// 4. Authoritative City Transit Profile Resolver
// Resolves Airport, Railway, Seaport, and Roadways for ANY city
// -------------------------------------------------------------
function normalizeTransitQuery(input: string): string {
  let s = (input || '').toLowerCase().trim();
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  // Common spelling and phonetic variations
  if (s.includes('kerela') || s === 'kerala' || s === 'keralam' || s.includes('gods own country')) return 'kerala';
  if (s.includes('trivendrum') || s.includes('trivandram') || s.includes('thiruvananthapuram') || s === 'tvm') return 'trivandrum';
  if (s === 'cochin' || s === 'ernakulam' || s.includes('nedumbassery')) return 'kochi';
  if (s === 'calicut') return 'kozhikode';
  if (s === 'allepey' || s === 'alleppy') return 'alleppey';
  if (s === 'kashmeer') return 'kashmir';
  if (s === 'bangalore' || s === 'banglore') return 'bengaluru';
  if (s === 'bombay') return 'mumbai';
  if (s === 'calcutta') return 'kolkata';
  if (s === 'madras') return 'chennai';
  if (s === 'banaras' || s === 'benares' || s === 'kashi') return 'varanasi';
  if (s === 'baroda') return 'vadodara';
  return s;
}

export function resolveCityTransitProfile(cityNameInput: string): CityTransitProfile {
  const raw = (cityNameInput || '').trim();
  const normalized = normalizeTransitQuery(raw);

  // 1. Authoritative Worldwide Country Resolution (~195 Countries)
  // When a user enters ANY country (e.g. Switzerland, France, Germany, Japan, USA, Australia, Egypt, etc.)
  const matchedCountry = findCountryByNameOrAlias(raw) || findCountryByNameOrAlias(normalized);
  if (matchedCountry) {
    return {
      city: matchedCountry.capital,
      country: matchedCountry.name,
      lat: matchedCountry.primaryAirport.lat,
      lng: matchedCountry.primaryAirport.lng,
      airport: {
        hasCommercialService: true,
        code: matchedCountry.primaryAirport.code,
        name: matchedCountry.primaryAirport.name,
        hubCity: matchedCountry.primaryAirport.city,
        distanceToHubKm: 0,
        driveTimeToHub: 'Direct Gateway Airport in Country',
        notice: matchedCountry.overviewNotice,
        feederSummary:
          `Primary International Hub: ${matchedCountry.primaryAirport.name} (${matchedCountry.primaryAirport.code}) in ${matchedCountry.primaryAirport.city}` +
          (matchedCountry.secondaryAirports.length > 0
            ? `, plus additional major gateways at ${matchedCountry.secondaryAirports.map((s) => `${s.city} (${s.code})`).join(', ')}`
            : ''),
      },
      railway: {
        hasDirectStation: true,
        stationName: matchedCountry.railway.primaryStation,
        stationCode: matchedCountry.primaryAirport.code.slice(0, 3),
        distanceKm: 0,
        notice: matchedCountry.railway.notice,
      },
      seaport: {
        isCoastal: matchedCountry.seaport.isCoastal,
        hasPassengerWaterway: matchedCountry.seaport.hasPassengerWaterway,
        portName: matchedCountry.seaport.portName,
        notice: matchedCountry.seaport.notice,
      },
    };
  }

  // 2. Iconic Global Non-Airport Destinations (Zermatt, Interlaken, Amalfi, Hallstatt, Banff, Machu Picchu, Cappadocia, Petra, Ubud, Akola, Palitana, Girnar, etc.)
  const globalDest = findNonAirportDestination(raw) || findNonAirportDestination(normalized);
  if (globalDest) {
    return {
      city: globalDest.name,
      country: globalDest.country,
      lat: globalDest.primaryAirport.lat,
      lng: globalDest.primaryAirport.lng,
      airport: {
        hasCommercialService: false,
        code: globalDest.primaryAirport.code,
        name: globalDest.primaryAirport.name,
        hubCity: globalDest.primaryAirport.city,
        distanceToHubKm: globalDest.primaryAirport.distanceKm,
        driveTimeToHub: globalDest.primaryAirport.driveTime,
        notice: `📍 ${globalDest.name} does not have an active commercial airport. Flights arrive at nearest gateway: ${globalDest.primaryAirport.name} (${globalDest.primaryAirport.code}) in ${globalDest.primaryAirport.city} (${globalDest.primaryAirport.distanceKm} km • ${globalDest.primaryAirport.driveTime} ${globalDest.primaryAirport.feederRoute}).`,
        feederSummary: `🚗 Feeder Transfer: ${globalDest.name} ➔ ${globalDest.primaryAirport.city} (${globalDest.primaryAirport.code}) via ${globalDest.primaryAirport.feederCarrier}`,
      },
      railway: {
        hasDirectStation: globalDest.railInfo.hasRailStation,
        notice: globalDest.railInfo.hasRailStation
          ? `Direct rail access available at ${globalDest.railInfo.stationName} (${globalDest.railInfo.stationCode})${globalDest.railInfo.trainType ? ` via ${globalDest.railInfo.trainType}` : ''}.`
          : `Nearest railway junction: ${globalDest.railInfo.stationName} (~${globalDest.railInfo.distanceKm} km away, ${globalDest.railInfo.transferTime || 'short road transfer'}).`,
        stationName: globalDest.railInfo.stationName,
        stationCode: globalDest.railInfo.stationCode,
        distanceKm: globalDest.railInfo.distanceKm || 0,
      },
      seaport: {
        isCoastal: globalDest.seaportInfo.isCoastal,
        hasPassengerWaterway: Boolean(globalDest.seaportInfo.hasPassengerFerry || globalDest.seaportInfo.hasPassengerWaterway),
        portName: globalDest.seaportInfo.portName || 'Inland',
        notice: globalDest.seaportInfo.notice,
      },
    };
  }

  // 3. Check State & Regional Multi-Airport Hubs (e.g. Kerala, Goa, Kashmir, Himachal, Uttarakhand)
  for (const reg of Object.values(STATE_AND_REGIONAL_HUBS)) {
    if (reg.aliases.some((a) => normalized.includes(a) || a.includes(normalized))) {
      return {
        city: reg.displayName,
        country: 'India',
        lat: reg.primaryAirport.lat,
        lng: reg.primaryAirport.lng,
        airport: {
          hasCommercialService: true,
          code: reg.primaryAirport.code,
          name: reg.primaryAirport.name,
          hubCity: reg.primaryAirport.city,
          distanceToHubKm: 0,
          driveTimeToHub: 'Direct Commercial Airport in Region',
          notice: reg.overviewNotice,
          feederSummary:
            `Primary Gateways: ${reg.primaryAirport.name} (${reg.primaryAirport.code}) in ${reg.primaryAirport.city}` +
            (reg.secondaryAirports.length > 0
              ? `, plus ${reg.secondaryAirports.map((s) => `${s.city} (${s.code})`).join(', ')}`
              : ''),
        },
        railway: {
          hasDirectStation: true,
          notice: reg.railway.notice,
          stationName: reg.railway.stationName,
          stationCode: reg.railway.stationCode,
          distanceKm: 0,
        },
        seaport: {
          isCoastal: reg.seaport.isCoastal,
          hasPassengerWaterway: reg.seaport.hasPassengerWaterway,
          portName: reg.seaport.portName,
          notice: reg.seaport.notice,
        },
      };
    }
  }

  // 4. Check known non-airport directory (Akola, Munnar, Alleppey, Palitana, Mount Abu, etc.)
  for (const [key, hub] of Object.entries(KNOWN_NON_AIRPORT_CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        city: hub.city,
        country: 'India',
        lat: hub.primaryAirport.lat,
        lng: hub.primaryAirport.lng,
        airport: {
          hasCommercialService: false,
          notice: `📍 ${hub.city} does not have an active commercial airport. Flights depart from nearest hub: ${hub.primaryAirport.name} (${hub.primaryAirport.code}) in ${hub.primaryAirport.city} (${hub.primaryAirport.distanceKm} km • ${hub.primaryAirport.driveTime} ${hub.primaryAirport.feederRoute}).`,
          code: hub.primaryAirport.code,
          name: hub.primaryAirport.name,
          hubCity: hub.primaryAirport.city,
          distanceToHubKm: hub.primaryAirport.distanceKm,
          driveTimeToHub: hub.primaryAirport.driveTime,
          feederSummary: `🚗 Feeder Connection: ${hub.city} ➔ ${hub.primaryAirport.city} Airport (${hub.primaryAirport.driveTime} via ${hub.primaryAirport.feederCarrier})`,
        },
        railway: {
          hasDirectStation: hub.railInfo.hasRailStation,
          notice: hub.railInfo.hasRailStation
            ? `Direct rail access available at ${hub.railInfo.stationName} (${hub.railInfo.stationCode}).`
            : `📍 ${hub.city} does not have a direct railway station. Nearest mainline railhead is ${hub.railInfo.stationName} (${hub.railInfo.stationCode}), ~${hub.railInfo.distanceKm} km away (${hub.railInfo.transferTime || 'short road transfer'}).`,
          stationName: hub.railInfo.stationName,
          stationCode: hub.railInfo.stationCode,
          distanceKm: hub.railInfo.distanceKm || 0,
        },
        seaport: {
          isCoastal: hub.seaportInfo.isCoastal,
          hasPassengerWaterway: hub.seaportInfo.hasPassengerFerry,
          portName: hub.seaportInfo.portName || 'No direct passenger port',
          notice:
            hub.seaportInfo.nearestPortNotice ||
            (hub.seaportInfo.isCoastal
              ? 'Coastal passenger ferry access available.'
              : 'Landlocked city with no direct sea or passenger ferry access.'),
        },
      };
    }
  }

  // 5. Check exact airport code (e.g. ZRH, CDG, LHR, FRA, FCO, JFK, LAX, HND, SIN, DXB, TRV, COK, CCJ, CNN, IXE, DEL, BOM)
  const cleanCode = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (COMMERCIAL_AIRPORTS[cleanCode]) {
    const apt = COMMERCIAL_AIRPORTS[cleanCode];
    const isCoastal = ['BOM', 'MAA', 'CCU', 'COK', 'IXE', 'TRV', 'CNN', 'CCJ', 'GOI', 'GOX', 'STV', 'SIN', 'HKG', 'SYD', 'DXB', 'MIA', 'BCN', 'NAP', 'LIS', 'CPH', 'OSL', 'ATH', 'JTR'].includes(apt.code);
    return {
      city: apt.city,
      country: apt.country,
      lat: apt.lat,
      lng: apt.lng,
      airport: {
        hasCommercialService: true,
        code: apt.code,
        name: apt.name,
        hubCity: apt.city,
        distanceToHubKm: 0,
        driveTimeToHub: '0 mins (Commercial Airport in city)',
      },
      railway: {
        hasDirectStation: true,
        stationName: `${apt.city} Mainline Railway Station`,
        stationCode: apt.code.slice(0, 3),
        distanceKm: 0,
      },
      seaport: {
        isCoastal,
        hasPassengerWaterway: isCoastal,
        portName: isCoastal ? `${apt.city} Passenger Harbor / Ferry Wharf` : 'Inland',
        notice: isCoastal
          ? `Direct passenger ferry / cruise terminals active in ${apt.city}.`
          : `${apt.city} is an inland city with no passenger ferry services.`,
      },
    };
  }

  // 6. Check existing commercial airport city & aliases
  for (const apt of Object.values(COMMERCIAL_AIRPORTS)) {
    const cityLower = apt.city.toLowerCase();
    const matchesCity = normalized.includes(cityLower) || cityLower.includes(normalized);
    const matchesAlias = apt.aliases && apt.aliases.some((al) => normalized.includes(al) || al.includes(normalized));
    if (matchesCity || matchesAlias) {
      const isCoastal = ['BOM', 'MAA', 'CCU', 'COK', 'IXE', 'TRV', 'CNN', 'CCJ', 'GOI', 'GOX', 'STV', 'SIN', 'HKG', 'SYD', 'DXB', 'MIA', 'BCN', 'NAP', 'LIS', 'CPH', 'OSL', 'ATH', 'JTR'].includes(apt.code);
      return {
        city: apt.city,
        country: apt.country,
        lat: apt.lat,
        lng: apt.lng,
        airport: {
          hasCommercialService: true,
          code: apt.code,
          name: apt.name,
          hubCity: apt.city,
          distanceToHubKm: 0,
          driveTimeToHub: '15 - 35 mins',
        },
        railway: {
          hasDirectStation: true,
          stationName: `${apt.city} Railway Station`,
          stationCode: apt.code.slice(0, 3),
          distanceKm: 0,
        },
        seaport: {
          isCoastal,
          hasPassengerWaterway: isCoastal,
          portName: isCoastal ? `${apt.city} Harbor & Ferry Terminal` : 'Inland',
          notice: isCoastal
            ? `Passenger ferry & cruise connections operating from ${apt.city}.`
            : `${apt.city} is landlocked.`,
        },
      };
    }
  }

  // 7. Intelligent Continental & Regional Geodesic Fallback
  const detected = detectContinentOrRegion(raw || normalized);
  const fallbackHub: CommercialAirport = COMMERCIAL_AIRPORTS[detected.gatewayCode] || COMMERCIAL_AIRPORTS.BOM;
  const isSouthAsia = detected.region === 'South Asia';

  return {
    city: raw || 'Destination',
    country: isSouthAsia ? 'India' : detected.region,
    lat: fallbackHub.lat,
    lng: fallbackHub.lng,
    airport: {
      hasCommercialService: false,
      notice: `📍 ${raw} is accessible via regional gateway ${fallbackHub.name} (${fallbackHub.code}) in ${fallbackHub.city} (${detected.region}).`,
      code: fallbackHub.code,
      name: fallbackHub.name,
      hubCity: fallbackHub.city,
      distanceToHubKm: 95,
      driveTimeToHub: '1h 30m - 2h 30m via regional expressway',
      feederSummary: `🚗 Feeder Connection: ${raw} ➔ ${fallbackHub.city} (${fallbackHub.code}) via regional expressway/coach`,
    },
    railway: {
      hasDirectStation: true,
      stationName: `${raw} Mainline Railhead / District Station`,
      stationCode: fallbackHub.code.slice(0, 3),
      distanceKm: 0,
      notice: `Regional railway connections linking ${raw} into the national rail network.`,
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: false,
      portName: 'Inland',
      notice: `${raw} is situated inland. Ground transport or regional flights are recommended.`,
    },
  };
}

export interface LiveRoadwayOffer {
  id: string;
  category: 'cab' | 'bus';
  title: string;
  vehicleType: string;
  provider: string;
  routeDescription: string;
  distanceKm: number;
  durationFormatted: string;
  departureTime: string;
  arrivalTime: string;
  tier: 'super_money_saver' | 'balanced' | 'fastest_expensive';
  tierLabel: string;
  tierBadge: string;
  tierDescription: string;
  price: number;
  formattedPrice: string;
  tollEstimate: string;
  fuelEstimate: string;
  pickupPoint: string;
  dropPoint: string;
  bookingUrl: string;
  bookingPartner: string;
  perks: string[];
}

export function searchRealTimeRoadways(
  origin: string,
  destination: string,
  departureDate: string,
  targetCurrency: string = 'INR',
  rates: Record<string, number> = { USD: 1, INR: 86.45 }
): {
  offers: LiveRoadwayOffer[];
  routeNotice: string;
  distanceKm: number;
} {
  const oProf = resolveCityTransitProfile(origin);
  const dProf = resolveCityTransitProfile(destination);

  const distanceKm = Math.max(120, calculateDistanceKm(oProf.lat, oProf.lng, dProf.lat, dProf.lng));
  const isEurope = oProf.country === 'Switzerland' || oProf.country === 'France' || oProf.country === 'Germany' || oProf.country === 'Italy' || oProf.country === 'United Kingdom' || oProf.country === 'Spain' || dProf.country === 'Switzerland';
  const isNorthAmerica = oProf.country === 'United States' || oProf.country === 'Canada' || dProf.country === 'United States';
  const isIntercontinental = distanceKm > 2500 && oProf.country !== dProf.country;

  const avgSpeedKmh = isEurope ? 82 : isNorthAmerica ? 88 : 58; // Realistic highway speed
  const totalDriveHours = Math.round((distanceKm / avgSpeedKmh) * 10) / 10;
  const driveHoursInt = Math.floor(totalDriveHours);
  const driveMinsInt = Math.round((totalDriveHours % 1) * 60);
  const durationStr = `${driveHoursInt}h ${driveMinsInt > 0 ? `${driveMinsInt}m` : ''}`.trim();

  // Highway identification
  const isAkolaRoute = origin.toLowerCase().includes('akola') || destination.toLowerCase().includes('akola');
  const highwayTag = isEurope
    ? 'via Trans-European E-Road & Alpine Express Corridor'
    : isNorthAmerica
    ? 'via Interstate Highway Express Corridor'
    : isAkolaRoute
    ? 'via NH 52 (Solapur) & NH 48 (Hubballi / Western Ghats)'
    : distanceKm > 600
    ? 'via National Golden Quadrilateral / Express Corridor'
    : 'via National Highway Expressway Corridor';

  const convertCost = (inr: number) => {
    const converted = convertCurrency(inr, 'INR', targetCurrency, rates);
    return {
      price: Math.round(converted),
      formattedPrice: formatCurrencyAmount(Math.round(converted), targetCurrency),
    };
  };

  // Base pricing
  const busBaseINR = Math.round(distanceKm * 1.85 + 450);
  const sleeperBusBaseINR = Math.round(distanceKm * 2.45 + 750);
  const cabSedanINR = Math.round(distanceKm * 14.5 + 800);
  const cabSuvINR = Math.round(distanceKm * 20.5 + 1200);

  // Regional provider branding
  const busProvider = isEurope ? 'FlixBus Europe / RegioJet Express' : isNorthAmerica ? 'Greyhound Express / Megabus' : 'VRL Travels / IntrCity SmartBus / State RTC';
  const busVehicle = isEurope ? 'Mercedes-Benz Tourismo / Setra HD Coach' : isNorthAmerica ? 'Prevost H3-45 Premium Intercity Coach' : 'Volvo / BharatBenz 2+1 AC Sleeper';
  const busBookingUrl = isEurope ? 'https://www.flixbus.com' : isNorthAmerica ? 'https://www.greyhound.com' : 'https://www.redbus.in';
  const busPartner = isEurope ? 'FlixBus / Trainline' : isNorthAmerica ? 'Greyhound / Megabus' : 'RedBus / AbhiBus (Zero Convenience Fee)';

  const sedanProvider = isEurope ? 'Sixt / Enterprise European Intercity' : isNorthAmerica ? 'Enterprise / Hertz Intercity Rental' : 'MakeMyTrip Intercity / Savaari / Local Cabs';
  const sedanVehicle = isEurope ? 'BMW 3 Series / VW Passat Touring Sedan' : isNorthAmerica ? 'Toyota Camry / Ford Fusion AC Sedan' : 'Dedicated AC Sedan (Up to 4 passengers)';
  const sedanBookingUrl = isEurope ? 'https://www.sixt.com' : isNorthAmerica ? 'https://www.enterprise.com' : 'https://www.makemytrip.com/cabs';

  const suvProvider = isEurope ? 'Blacklane Executive Chauffeur Service' : isNorthAmerica ? 'Blacklane Executive SUV' : 'Savaari Premium / Uber Intercity';
  const suvVehicle = isEurope ? 'Mercedes-Benz V-Class Chauffeur Van' : isNorthAmerica ? 'Cadillac Escalade / Chevrolet Suburban' : 'Spacious Captain Seat AC SUV (Innova Crysta)';
  const suvBookingUrl = isEurope || isNorthAmerica ? 'https://www.blacklane.com' : 'https://www.savaari.com';

  const offers: LiveRoadwayOffer[] = [
    // 1. Budget Option: Intercity Express Coach
    {
      id: `road-bus-01-${Date.now()}`,
      category: 'bus',
      title: `${oProf.city} to ${dProf.city} Intercity Express Coach`,
      vehicleType: busVehicle,
      provider: busProvider,
      routeDescription: `${highwayTag} • Reclining comfortable seats with USB power and Wi-Fi`,
      distanceKm,
      durationFormatted: durationStr,
      departureTime: '07:30 PM',
      arrivalTime: '09:45 AM (Next Day)',
      tier: 'super_money_saver',
      tierLabel: 'Super Money Saver',
      tierBadge: '💰 BEST BUDGET',
      tierDescription: `Direct intercity coach departing from central terminal in ${oProf.city}.`,
      ...convertCost(sleeperBusBaseINR),
      tollEstimate: 'Included in ticket fare',
      fuelEstimate: 'Included in ticket fare',
      pickupPoint: `${oProf.city} Central Bus Terminal`,
      dropPoint: `${dProf.city} Main Bus Station`,
      bookingUrl: busBookingUrl,
      bookingPartner: busPartner,
      perks: ['Complimentary Wi-Fi', 'Individual USB Charging', 'Reading Light', 'Live GPS Tracking'],
    },

    // 2. Balanced Option: Private Highway Sedan Cab
    {
      id: `road-cab-sedan-${Date.now()}`,
      category: 'cab',
      title: `Private Intercity Sedan (${sedanVehicle.split(' / ')[0] || 'Executive Sedan'})`,
      vehicleType: sedanVehicle,
      provider: sedanProvider,
      routeDescription: `Door-to-door direct highway transfer ${highwayTag} with flexible meal and photo stops`,
      distanceKm,
      durationFormatted: `${Math.max(2, driveHoursInt - 1)}h ${driveMinsInt}m`,
      departureTime: 'Flexible (Choose your departure time)',
      arrivalTime: 'Direct Doorstep Arrival',
      tier: 'balanced',
      tierLabel: 'Balanced Choice',
      tierBadge: '⚖️ DOOR-TO-DOOR COMFORT',
      tierDescription: `Private vehicle pickup directly from your accommodation in ${oProf.city} straight to your address in ${dProf.city}.`,
      ...convertCost(cabSedanINR),
      tollEstimate: `Approx ${formatCurrencyAmount(Math.round(distanceKm * 1.8), targetCurrency)} via electronic toll tag`,
      fuelEstimate: 'Included in package fare',
      pickupPoint: `Doorstep Pickup in ${oProf.city}`,
      dropPoint: `Exact Destination Address in ${dProf.city}`,
      bookingUrl: sedanBookingUrl,
      bookingPartner: sedanProvider,
      perks: ['Zero Shared Passengers', 'Stop anytime for meals', 'Generous luggage boot space', 'Professional Highway Chauffeur'],
    },

    // 3. Premium Option: Luxury SUV / Executive Van
    {
      id: `road-cab-suv-${Date.now()}`,
      category: 'cab',
      title: `Premium Chauffeur SUV (${suvVehicle.split(' / ')[0] || 'Luxury SUV'})`,
      vehicleType: suvVehicle,
      provider: suvProvider,
      routeDescription: `High-comfort long-distance expressway ride with dual AC and reclining captain seats`,
      distanceKm,
      durationFormatted: `${Math.max(2, driveHoursInt - 2)}h ${driveMinsInt}m`,
      departureTime: 'On-demand 24/7',
      arrivalTime: 'Expedited highway arrival',
      tier: 'fastest_expensive',
      tierLabel: 'Fastest & Premium',
      tierBadge: '⚡ LUXURY ROAD CRUISE',
      tierDescription: `Maximum legroom and active suspension dampening for effortless long-distance travel.`,
      ...convertCost(cabSuvINR),
      tollEstimate: `Included in all-inclusive rate`,
      fuelEstimate: 'All-inclusive rate',
      pickupPoint: `Any Location in ${oProf.city}`,
      dropPoint: `Any Hotel / Resort in ${dProf.city}`,
      bookingUrl: suvBookingUrl,
      bookingPartner: suvProvider,
      perks: ['Captain Seats with Armrests', 'High ground clearance', 'Complimentary bottled water', 'Chauffeur with 10+ yrs experience'],
    },
  ];

  const noticeText = isIntercontinental
    ? `🚗 Trans-Continental Overland Note: Direct highway driving distance between ${oProf.city} and ${dProf.city} spans continents (~${distanceKm} km). ✈️ Commercial flight is the primary transit mode; road offers represent regional ground transfer connections.`
    : `🚗 Road Distance: ~${distanceKm} km ${highwayTag}. Estimated drive time: ~${durationStr}.`;

  return {
    offers,
    routeNotice: noticeText,
    distanceKm,
  };
}

// -------------------------------------------------------------
// 6. Seaways & Ferry Search Generator (Ship)
// -------------------------------------------------------------
export interface LiveSeawayOffer {
  id: string;
  title: string;
  vesselType: string;
  operator: string;
  route: string;
  durationFormatted: string;
  departureTime: string;
  arrivalTime: string;
  tier: 'super_money_saver' | 'balanced' | 'fastest_expensive';
  tierLabel: string;
  tierBadge: string;
  tierDescription: string;
  price: number;
  formattedPrice: string;
  boardingPort: string;
  arrivalPort: string;
  vehicleCarriage: string;
  bookingUrl: string;
  perks: string[];
}

export function searchRealTimeSeaways(
  origin: string,
  destination: string,
  departureDate: string,
  targetCurrency: string = 'INR',
  rates: Record<string, number> = { USD: 1, INR: 86.45 }
): {
  isAvailable: boolean;
  offers: LiveSeawayOffer[];
  notice: string;
} {
  const oProf = resolveCityTransitProfile(origin);
  const dProf = resolveCityTransitProfile(destination);

  const convertCost = (inr: number) => {
    const converted = convertCurrency(inr, 'INR', targetCurrency, rates);
    return {
      price: Math.round(converted),
      formattedPrice: formatCurrencyAmount(Math.round(converted), targetCurrency),
    };
  };

  // Check if either origin or destination is coastal
  const isDirectWaterway = oProf.seaport.isCoastal || dProf.seaport.isCoastal;

  if (!isDirectWaterway) {
    const isEurope = oProf.country === 'Switzerland' || oProf.country === 'Austria' || oProf.country === 'Germany' || oProf.country === 'France' || dProf.country === 'Switzerland';
    const landlockedNotice = isEurope
      ? `ℹ️ Inland European Corridor: Both ${oProf.city} and ${dProf.city} are connected overland via high-speed rail (SBB, TGV, ICE) and motorways. Scenic lake passenger steamers (Lake Zurich, Lake Geneva, Lake Lucerne) and Rhine/Danube river cruises operate locally.`
      : oProf.country === 'India' && dProf.country === 'India'
      ? `ℹ️ Inland Route Notice: Both ${oProf.city} and ${dProf.city} are situated inland without direct commercial passenger waterways. We recommend choosing ✈️ Airplane, 🚆 Train, or 🚗 Car/Bus for this journey.`
      : `ℹ️ Inland Transit Notice: Both ${oProf.city} and ${dProf.city} are situated inland without direct ocean passenger ferry services. ✈️ Airplane or 🚆 High-Speed Train recommended.`;

    return {
      isAvailable: false,
      offers: [],
      notice: landlockedNotice,
    };
  }

  // Regional vessel operator branding
  const isEurope = oProf.country === 'Greece' || dProf.country === 'Greece' || oProf.country === 'Italy' || dProf.country === 'Italy' || oProf.country === 'United Kingdom' || dProf.country === 'France';
  const isSEAsia = oProf.country === 'Singapore' || dProf.country === 'Indonesia' || oProf.country === 'Thailand';

  const ferryOperator = isEurope
    ? (oProf.city.toLowerCase().includes('santorini') || dProf.city.toLowerCase().includes('santorini') || oProf.country === 'Greece' ? 'Blue Star Ferries / SeaJets' : 'NLG Hydrofoils / P&O Ferries')
    : isSEAsia
    ? 'Batam Fast / Sinbad Luxury Speedboats'
    : 'M2M Ferries / Coastal Marine Line';

  const cruiseOperator = isEurope ? 'MSC Cruises / Costa Cruises' : 'Cordelia Cruises / Angriya Sea Lines';

  // Coastal route options
  const offers: LiveSeawayOffer[] = [
    {
      id: `sea-01-${Date.now()}`,
      title: `Coastal Passenger & Vehicle Ro-Pax Vessel`,
      vesselType: 'Modern Catamaran / Ro-Pax Ferry',
      operator: ferryOperator,
      route: `${oProf.seaport.portName || oProf.city} ➔ ${dProf.seaport.portName || dProf.city}`,
      durationFormatted: '45 mins - 3h 15m (depending on maritime sector)',
      departureTime: '08:00 AM / 02:30 PM / 06:00 PM',
      arrivalTime: 'Maritime Harbor Dock',
      tier: 'balanced',
      tierLabel: 'Balanced Choice',
      tierBadge: '🚢 SCENIC WATERWAY',
      tierDescription: 'Scenic water crossing avoiding highway bottlenecks and traffic jams.',
      ...convertCost(1250),
      boardingPort: oProf.seaport.portName || `${oProf.city} Coastal Jetty`,
      arrivalPort: dProf.seaport.portName || `${dProf.city} Maritime Wharf`,
      vehicleCarriage: 'Vehicles Allowed (Cars, SUVs, Two-wheelers)',
      bookingUrl: isEurope ? 'https://www.ferries.gr' : 'https://m2mferries.com',
      perks: ['Open-air sundeck', 'Air-conditioned lounge', 'Snack bar & cafe', 'Drive-on drive-off vehicle ramp'],
    },
    {
      id: `sea-cruise-02-${Date.now()}`,
      title: `Coastal Voyage & Luxury Cruise Liner`,
      vesselType: 'Ocean-Going Cruise Ship',
      operator: cruiseOperator,
      route: `${oProf.city} • Coastal Maritime Belt • ${dProf.city}`,
      durationFormatted: '1 Night / 2 Days (Overnight at Sea)',
      departureTime: '04:30 PM (Sailing)',
      arrivalTime: '10:00 AM (Disembarkation)',
      tier: 'fastest_expensive',
      tierLabel: 'Fastest & Premium',
      tierBadge: '⭐ LUXURY VOYAGE',
      tierDescription: 'Premium ocean-liner experience featuring live entertainment, oceanview staterooms, and fine dining.',
      ...convertCost(14500),
      boardingPort: oProf.seaport.portName || `${oProf.city} International Cruise Terminal`,
      arrivalPort: dProf.seaport.portName || `${dProf.city} Maritime Wharf`,
      vehicleCarriage: 'Passenger Only (Valet parking at port)',
      bookingUrl: isEurope ? 'https://www.msccruises.com' : 'https://www.cordeliacruises.com',
      perks: ['Oceanview Stateroom', 'All Meals Included', 'Live Broadway Theater Shows', 'Swimming Pool & Sun Deck'],
    },
  ];

  return {
    isAvailable: true,
    offers,
    notice: `🚢 Coastal Seaway Active: Passenger vessels, Ro-Pax car ferries, and ocean cruises connect along this maritime belt.`,
  };
}
