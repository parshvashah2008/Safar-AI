import { dateRange } from '@/lib/utils';
import { formatTo12Hour } from '@/lib/utils/time-format';
import { convertCurrency } from './currency-service';
import { resolveStopCoordinates } from '@/lib/geo/gps';
import type { AIItineraryDay, StopCategory } from '@/types';

interface FallbackParams {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests?: string[];
  dietary?: string | null;
  accessibility?: string | null;
}

export function generateFallbackItinerary(params: {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests?: string[];
  dietary?: string | null;
  accessibility?: string | null;
}): AIItineraryDay[] {
  const {
    destination,
    country,
    startDate,
    endDate,
    travelers,
    currency,
    dietary,
  } = params;

  const dates = dateRange(startDate, endDate);
  const normDest = destination.toLowerCase().trim();
  const dietaryNote = dietary && dietary.toLowerCase() !== 'none' ? ` (${dietary} friendly)` : '';

  // 1. Switzerland Curation
  if (normDest.includes('swiss') || normDest.includes('switzerland') || normDest.includes('zurich') || normDest.includes('geneva') || normDest.includes('interlaken')) {
    const swissDaysData = [
      {
        title: 'Day 1: Arrival & Lake Zurich Promenade',
        activities: [
          {
            time: '10:00 AM',
            title: 'Arrival in Zurich & Old Town Walk',
            description: 'Explore the historic Altstadt with cobblestone streets, Lindenhof viewpoint, and Grossmünster cathedral.',
            estimated_cost: convertCurrency(15 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Lindenhof Hill, Zurich',
            latitude: 47.3725,
            longitude: 8.5414,
            is_optional: false,
          },
          {
            time: '01:00 PM',
            title: `Traditional Swiss Alpine Lunch${dietaryNote}`,
            description: 'Enjoy Swiss Rösti, fresh sourdough, and local delicacies at a classic guild-house cafe along Limmat river.',
            estimated_cost: convertCurrency(32 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Zeughauskeller, Zurich',
            latitude: 47.3703,
            longitude: 8.5401,
            is_optional: false,
          },
          {
            time: '04:30 PM',
            title: 'Lake Zurich Golden Hour Cruise',
            description: 'Scenic boat ride across Lake Zurich taking in views of the distant snowcapped Glarus Alps.',
            estimated_cost: convertCurrency(25 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'activity' as StopCategory,
            place_name: 'Bürkliplatz Pier, Zurich',
            latitude: 47.3667,
            longitude: 8.5417,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Artisan Fondue & Dinner Experience${dietaryNote}`,
            description: 'Warm, cozy Swiss dinner featuring Gruyère and Emmental fondue with roasted potatoes and fresh greens.',
            estimated_cost: convertCurrency(45 * travelers, 'USD', currency),
            duration_minutes: 105,
            category: 'meal' as StopCategory,
            place_name: 'Swiss Chuchi Restaurant, Niederdorf',
            latitude: 47.3735,
            longitude: 8.5442,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 2: Lucerne Heritage & Mount Pilatus',
        activities: [
          {
            time: '09:00 AM',
            title: 'GoldenPass Express to Lucerne & Chapel Bridge',
            description: 'Stroll across the iconic 14th-century wooden Kapellbrücke and the poignant Lion Monument.',
            estimated_cost: convertCurrency(28 * travelers, 'USD', currency),
            duration_minutes: 150,
            category: 'sightseeing' as StopCategory,
            place_name: 'Kapellbrücke, Lucerne',
            latitude: 47.0516,
            longitude: 8.3073,
            is_optional: false,
          },
          {
            time: '01:15 PM',
            title: `Lakeside Terrace Lunch${dietaryNote}`,
            description: 'Waterfront dining along Lake Lucerne with views of Mount Rigi and Mount Pilatus.',
            estimated_cost: convertCurrency(35 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Schweizerhof Quay, Lucerne',
            latitude: 47.0538,
            longitude: 8.3115,
            is_optional: false,
          },
          {
            time: '03:00 PM',
            title: 'Mount Pilatus Dragon Ride Aerial Cableway',
            description: 'Ascend to 2,132 meters for 360-degree panoramic views of 73 Alpine peaks.',
            estimated_cost: convertCurrency(72 * travelers, 'USD', currency),
            duration_minutes: 180,
            category: 'activity' as StopCategory,
            place_name: 'Pilatus Kulm',
            latitude: 46.9798,
            longitude: 8.2547,
            is_optional: false,
          },
          {
            time: '08:00 PM',
            title: `Lucerne Old Town Dinner${dietaryNote}`,
            description: 'Relax with artisanal pasta, fresh Alpine cheeses, and warm herbal tea.',
            estimated_cost: convertCurrency(40 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Weinmarkt, Lucerne',
            latitude: 47.0526,
            longitude: 8.3051,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 3: Interlaken & Lauterbrunnen Waterfalls',
        activities: [
          {
            time: '08:30 AM',
            title: 'Scenic Train to Lauterbrunnen Valley of 72 Waterfalls',
            description: 'Marvel at the dramatic U-shaped valley with sheer cliff faces and roaring glacial waters.',
            estimated_cost: convertCurrency(25 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Staubbach Falls, Lauterbrunnen',
            latitude: 46.5947,
            longitude: 7.9079,
            is_optional: false,
          },
          {
            time: '12:30 PM',
            title: `Chalet Alpine Lunch${dietaryNote}`,
            description: 'Hearty Alpine vegetable soup, fresh bread, and cheese platters overlooking Jungfrau.',
            estimated_cost: convertCurrency(30 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Hotel Oberland Cafe, Lauterbrunnen',
            latitude: 46.5975,
            longitude: 7.9072,
            is_optional: false,
          },
          {
            time: '02:30 PM',
            title: 'Trümmelbach Glacier Waterfalls Inside the Mountain',
            description: 'Explore the subterranean waterfalls cutting directly through the mountain rock with illuminated caverns.',
            estimated_cost: convertCurrency(18 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'activity' as StopCategory,
            place_name: 'Trümmelbachfälle, Stechelberg',
            latitude: 46.5694,
            longitude: 7.9133,
            is_optional: false,
          },
          {
            time: '07:15 PM',
            title: `Interlaken Höheweg Dinner${dietaryNote}`,
            description: 'Dinner overlooking the open green meadow with views towards the illuminated Jungfrau summit.',
            estimated_cost: convertCurrency(42 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Höheweg Promenade, Interlaken',
            latitude: 46.6863,
            longitude: 7.8632,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 4: Zermatt & Matterhorn Glacier Paradise',
        activities: [
          {
            time: '09:00 AM',
            title: 'Gornergrat Cogwheel Mountain Railway',
            description: 'Spectacular train climb up to Gornergrat (3,089m) facing the iconic Matterhorn and Gorner Glacier.',
            estimated_cost: convertCurrency(85 * travelers, 'USD', currency),
            duration_minutes: 180,
            category: 'activity' as StopCategory,
            place_name: 'Gornergrat Station, Zermatt',
            latitude: 45.9833,
            longitude: 7.7833,
            is_optional: false,
          },
          {
            time: '01:30 PM',
            title: `Panorama Alpine Lunch${dietaryNote}`,
            description: 'Warm polenta, roasted wild mushrooms, and fresh berry tarts at 3,000 meters elevation.',
            estimated_cost: convertCurrency(38 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: '3100 Kulmhotel Gornergrat',
            latitude: 45.9838,
            longitude: 7.7845,
            is_optional: false,
          },
          {
            time: '04:00 PM',
            title: 'Car-Free Zermatt Old Village Stroll',
            description: 'Walk past 500-year-old sun-blackened wooden barns in the Hinterdorf quarter.',
            estimated_cost: convertCurrency(10 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'sightseeing' as StopCategory,
            place_name: 'Hinterdorfstrasse, Zermatt',
            latitude: 45.9839,
            longitude: 7.7491,
            is_optional: false,
          },
          {
            time: '07:45 PM',
            title: `Matterhorn Evening Hearth Dinner${dietaryNote}`,
            description: 'Alpine dinner with crackling wood fire, local raclette, and herbal tea.',
            estimated_cost: convertCurrency(48 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Bahnhofstrasse, Zermatt',
            latitude: 46.0212,
            longitude: 7.7475,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 5: Lake Geneva & Chateau de Chillon',
        activities: [
          {
            time: '09:30 AM',
            title: 'Montreux Floral Promenade & Chillon Castle',
            description: 'Walk along Lake Geneva palm-lined promenade and explore the romantic medieval island fortress.',
            estimated_cost: convertCurrency(22 * travelers, 'USD', currency),
            duration_minutes: 150,
            category: 'sightseeing' as StopCategory,
            place_name: 'Château de Chillon, Veytaux',
            latitude: 46.4142,
            longitude: 6.9275,
            is_optional: false,
          },
          {
            time: '01:00 PM',
            title: `French-Swiss Bistro Lunch${dietaryNote}`,
            description: 'Crisp lake salads, vegetable quiche, and fresh pastries overlooking Lake Geneva.',
            estimated_cost: convertCurrency(32 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Grand-Rue, Montreux',
            latitude: 46.4312,
            longitude: 6.9106,
            is_optional: false,
          },
          {
            time: '04:00 PM',
            title: 'Geneva Jet d’Eau & Old Town Bastions',
            description: 'See the magnificent 140-meter water fountain in the lake basin and visit St. Pierre Cathedral.',
            estimated_cost: convertCurrency(15 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Jet d’Eau, Geneva',
            latitude: 46.2074,
            longitude: 6.1559,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Celebration Farewell Dinner in Geneva${dietaryNote}`,
            description: 'Reflect on an unforgettable journey across Switzerland with fine lakeside dining.',
            estimated_cost: convertCurrency(50 * travelers, 'USD', currency),
            duration_minutes: 105,
            category: 'meal' as StopCategory,
            place_name: 'Place du Bourg-de-Four, Geneva',
            latitude: 46.2007,
            longitude: 6.1492,
            is_optional: false,
          },
        ],
      },
    ];

    return dates.map((date, idx) => {
      const template = swissDaysData[idx % swissDaysData.length];
      return {
        date,
        title: `Day ${idx + 1}: ${template.title.split(': ')[1] || template.title}`,
        activities: template.activities.map((act) => ({
          ...act,
          estimated_cost: Math.round(act.estimated_cost),
        })),
      };
    });
  }

  // 2. United Kingdom / London / England Curation
  if (
    normDest === 'uk' ||
    normDest === 'u.k.' ||
    normDest.includes('london') ||
    normDest.includes('united kingdom') ||
    normDest.includes('england') ||
    normDest.includes('britain') ||
    normDest.includes('scotland') ||
    normDest.includes('edinburgh')
  ) {
    const ukDaysData = [
      {
        title: 'Day 1: Westminster, Big Ben & The Thames Riverbank',
        activities: [
          {
            time: '09:30 AM',
            title: 'Westminster Abbey & Parliament Square Walk',
            description: 'Visit the historic coronation church of British monarchs and witness Big Ben and the Houses of Parliament.',
            estimated_cost: convertCurrency(28 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Westminster Abbey, London',
            latitude: 51.4993,
            longitude: -0.1273,
            is_optional: false,
          },
          {
            time: '01:00 PM',
            title: `Traditional Gastropub Lunch${dietaryNote}`,
            description: 'Enjoy classic British pub fare with artisan pies, seasonal vegetables, and craft ales along the Thames.',
            estimated_cost: convertCurrency(26 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'The Anchor Bankside, Southwark',
            latitude: 51.5065,
            longitude: -0.0915,
            is_optional: false,
          },
          {
            time: '03:30 PM',
            title: 'The London Eye & South Bank Promenade',
            description: 'Soar 135 meters above London in a climate-controlled capsule for 360-degree views stretching 25 miles.',
            estimated_cost: convertCurrency(35 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'activity' as StopCategory,
            place_name: 'The London Eye, Riverside Building',
            latitude: 51.5033,
            longitude: -0.1195,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Covent Garden Evening & Dinner${dietaryNote}`,
            description: 'Atmospheric dinner amid the cobblestone piazza street performers, heritage market halls, and boutique bistros.',
            estimated_cost: convertCurrency(38 * travelers, 'USD', currency),
            duration_minutes: 105,
            category: 'meal' as StopCategory,
            place_name: 'Covent Garden Piazza, London',
            latitude: 51.5117,
            longitude: -0.1238,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 2: Royal Palaces, St. James’s Park & The British Museum',
        activities: [
          {
            time: '10:00 AM',
            title: 'Buckingham Palace & Changing of the Guard',
            description: 'Observe the historic ceremony at the official royal residence, then walk through lush St. James’s Park.',
            estimated_cost: 0,
            duration_minutes: 90,
            category: 'sightseeing' as StopCategory,
            place_name: 'Buckingham Palace, London',
            latitude: 51.5014,
            longitude: -0.1419,
            is_optional: false,
          },
          {
            time: '01:00 PM',
            title: `Artisanal Afternoon Lunch in Bloomsbury${dietaryNote}`,
            description: 'Refined local British deli boards, fresh seasonal soups, and warm scones with clotted cream.',
            estimated_cost: convertCurrency(24 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Bloomsbury Bistro & Tearoom',
            latitude: 51.5185,
            longitude: -0.1265,
            is_optional: false,
          },
          {
            time: '02:45 PM',
            title: 'The British Museum Great Court & Antiquities',
            description: 'Marvel at the Rosetta Stone, Parthenon Sculptures, and world civilizational treasures under the Norman Foster glass dome.',
            estimated_cost: convertCurrency(5 * travelers, 'USD', currency),
            duration_minutes: 150,
            category: 'activity' as StopCategory,
            place_name: 'The British Museum, Great Russell St',
            latitude: 51.5194,
            longitude: -0.1270,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Soho Heritage Dining & Theatre Walk${dietaryNote}`,
            description: 'Explore the vibrant neon-lit alleys of Soho and Dean Street featuring curated international cuisine.',
            estimated_cost: convertCurrency(42 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Dean Street, Soho, London',
            latitude: 51.5136,
            longitude: -0.1325,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 3: Tower of London, Tower Bridge & Borough Market',
        activities: [
          {
            time: '09:30 AM',
            title: 'Tower of London & The Crown Jewels',
            description: 'Discover 1,000 years of royal intrigue, medieval armor, and the glittering Crown Jewels guarded by Yeoman Warders.',
            estimated_cost: convertCurrency(34 * travelers, 'USD', currency),
            duration_minutes: 150,
            category: 'sightseeing' as StopCategory,
            place_name: 'Tower of London, Tower Hill',
            latitude: 51.5081,
            longitude: -0.0759,
            is_optional: false,
          },
          {
            time: '12:30 PM',
            title: 'Tower Bridge Glass Floor High Walkway',
            description: 'Walk across the iconic Victorian suspension bridge with panoramic views down to the river traffic below.',
            estimated_cost: convertCurrency(14 * travelers, 'USD', currency),
            duration_minutes: 60,
            category: 'activity' as StopCategory,
            place_name: 'Tower Bridge Road, London',
            latitude: 51.5055,
            longitude: -0.0754,
            is_optional: false,
          },
          {
            time: '02:00 PM',
            title: `Borough Market Gourmet Food Exploration${dietaryNote}`,
            description: 'Sample artisanal cheeses, freshly baked breads, hot mushroom risotto, and cider at London’s oldest gourmet food market.',
            estimated_cost: convertCurrency(25 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Borough Market, Southwark',
            latitude: 51.5055,
            longitude: -0.0910,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Sky Garden Sunset Panorama Dinner${dietaryNote}`,
            description: 'Dine in London’s highest public garden atop the Walkie Talkie building with 360-degree night skyline views.',
            estimated_cost: convertCurrency(50 * travelers, 'USD', currency),
            duration_minutes: 105,
            category: 'meal' as StopCategory,
            place_name: 'Sky Garden, 20 Fenchurch St',
            latitude: 51.5112,
            longitude: -0.0836,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 4: Kensington Palaces, Royal Parks & Notting Hill',
        activities: [
          {
            time: '10:00 AM',
            title: 'Kensington Palace & Gardens Walk',
            description: 'Birthplace of Queen Victoria and royal residence set within tranquil manicured sunken gardens.',
            estimated_cost: convertCurrency(26 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Kensington Palace, Kensington',
            latitude: 51.5050,
            longitude: -0.1877,
            is_optional: false,
          },
          {
            time: '01:00 PM',
            title: `Kensington High Street Terrace Lunch${dietaryNote}`,
            description: 'Refined garden dining featuring crisp salads, seasonal British produce, and artisan teas.',
            estimated_cost: convertCurrency(30 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Kensington High Street, London',
            latitude: 51.5015,
            longitude: -0.1915,
            is_optional: false,
          },
          {
            time: '03:00 PM',
            title: 'Portobello Road Market & Pastel Streets',
            description: 'Browse the famous antique stalls, vintage bookshops, and cheerful pastel Victorian townhouses of Notting Hill.',
            estimated_cost: convertCurrency(10 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'activity' as StopCategory,
            place_name: 'Portobello Road, Notting Hill',
            latitude: 51.5173,
            longitude: -0.2057,
            is_optional: false,
          },
          {
            time: '07:45 PM',
            title: `Notting Hill Cozy Bistro Dinner${dietaryNote}`,
            description: 'Relaxed bohemian dining with candlelit tables and modern European plates.',
            estimated_cost: convertCurrency(45 * travelers, 'USD', currency),
            duration_minutes: 90,
            category: 'meal' as StopCategory,
            place_name: 'Westbourne Grove, Notting Hill',
            latitude: 51.5152,
            longitude: -0.1995,
            is_optional: false,
          },
        ],
      },
      {
        title: 'Day 5: Royal Observatory Greenwich & Thames Clipper',
        activities: [
          {
            time: '10:00 AM',
            title: 'Thames Clipper River Boat Cruise to Greenwich',
            description: 'Glide east down the Thames past St. Paul’s Cathedral and Canary Wharf to maritime Greenwich.',
            estimated_cost: convertCurrency(12 * travelers, 'USD', currency),
            duration_minutes: 60,
            category: 'activity' as StopCategory,
            place_name: 'Greenwich Pier, Cutty Sark',
            latitude: 51.4833,
            longitude: -0.0090,
            is_optional: false,
          },
          {
            time: '11:30 AM',
            title: 'Royal Observatory & Prime Meridian Line',
            description: 'Stand with one foot in the eastern hemisphere and one in the western at Longitude 0° atop Greenwich Hill.',
            estimated_cost: convertCurrency(20 * travelers, 'USD', currency),
            duration_minutes: 120,
            category: 'sightseeing' as StopCategory,
            place_name: 'Royal Observatory, Greenwich Park',
            latitude: 51.4769,
            longitude: 0.0005,
            is_optional: false,
          },
          {
            time: '02:00 PM',
            title: `Greenwich Historic Village Tavern Lunch${dietaryNote}`,
            description: 'Riverfront meal at a 17th-century naval pub watching ships navigate the Thames.',
            estimated_cost: convertCurrency(28 * travelers, 'USD', currency),
            duration_minutes: 75,
            category: 'meal' as StopCategory,
            place_name: 'Greenwich Church Street',
            latitude: 51.4815,
            longitude: -0.0105,
            is_optional: false,
          },
          {
            time: '07:30 PM',
            title: `Farewell London Lights Dinner in Mayfair${dietaryNote}`,
            description: 'Celebrate a landmark journey through the United Kingdom with celebratory dining in historic Mayfair.',
            estimated_cost: convertCurrency(55 * travelers, 'USD', currency),
            duration_minutes: 105,
            category: 'meal' as StopCategory,
            place_name: 'Berkeley Square, Mayfair',
            latitude: 51.5095,
            longitude: -0.1475,
            is_optional: false,
          },
        ],
      },
    ];

    return dates.map((date, idx) => {
      const template = ukDaysData[idx % ukDaysData.length];
      return {
        date,
        title: `Day ${idx + 1}: ${template.title.split(': ')[1] || template.title}`,
        activities: template.activities.map((act) => ({
          ...act,
          estimated_cost: Math.round(act.estimated_cost),
        })),
      };
    });
  }

  // 3. Generic World / India Destination Generator
  return dates.map((date, idx) => {
    const dayNum = idx + 1;
    const isFirst = idx === 0;
    const isLast = idx === dates.length - 1;

    const baseCost = convertCurrency(18 * travelers, 'USD', currency);
    const resolvedCoords = resolveStopCoordinates({ title: destination }, destination, idx);

    return {
      date,
      title: isFirst
        ? `Day 1: Arrival & Landmark Orientation in ${destination}`
        : isLast
        ? `Day ${dayNum}: Hidden Gems & Farewell Experience in ${destination}`
        : `Day ${dayNum}: Cultural Immersion & Heritage of ${destination}`,
      activities: [
        {
          time: '09:00 AM',
          title: isFirst
            ? `Arrival & Central District Exploration in ${destination}`
            : `Morning Heritage & Landmark Walk at ${destination}`,
          description: `Discover historic architectural highlights, viewpoints, and local character around ${destination}.`,
          estimated_cost: Math.round(baseCost * 0.8),
          duration_minutes: 120,
          category: 'sightseeing' as StopCategory,
          place_name: `${destination} Central Heritage Quarter`,
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          is_optional: false,
        },
        {
          time: '01:00 PM',
          title: `Authentic Local Gastronomy Lunch${dietaryNote}`,
          description: `Savor authentic regional dishes curated specifically for ${dietary || 'local food lovers'} in a highly rated restaurant.`,
          estimated_cost: Math.round(baseCost * 1.2),
          duration_minutes: 75,
          category: 'meal' as StopCategory,
          place_name: `Renowned Local Restaurant, ${destination}`,
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          is_optional: false,
        },
        {
          time: '04:30 PM',
          title: `Cultural Experience & Scenic Viewpoint`,
          description: `Immerse in iconic vistas, bustling artisanal bazaars, and scenic photo stops across ${destination}.`,
          estimated_cost: Math.round(baseCost * 0.9),
          duration_minutes: 105,
          category: 'activity' as StopCategory,
          place_name: `${destination} Scenic Point / Promenade`,
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          is_optional: false,
        },
        {
          time: '07:30 PM',
          title: `Evening Culinary Dinner & Night Walk${dietaryNote}`,
          description: `Relax with curated dinner, local beverages, and an evening stroll through the illuminated streets of ${destination}.`,
          estimated_cost: Math.round(baseCost * 1.5),
          duration_minutes: 90,
          category: 'meal' as StopCategory,
          place_name: `${destination} Evening Dining Quarter`,
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          is_optional: false,
        },
      ],
    };
  });
}
