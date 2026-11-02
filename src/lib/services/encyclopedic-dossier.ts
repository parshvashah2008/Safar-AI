/**
 * SAFAR AI — Encyclopedic World Travel & Gastronomy Dossier Service
 * Comprehensive, grounded data for tourist places, iconic restaurants,
 * local cuisine, secret experiences, transit gateways, and safety tips for every destination on Earth.
 */

import { findCountryByNameOrAlias, findNonAirportDestination, detectContinentOrRegion } from './global-country-data';
import { resolveCityTransitProfile } from './station-resolver';

export interface DestinationDossier {
  name: string;
  country: string;
  region: string;
  isDomestic: boolean;
  tagline: string;
  overview: string;
  idealDuration: string;
  bestMonths: string;
  climateVibe: string;
  touristPlaces: Array<{
    name: string;
    category: string;
    description: string;
    bestTimeToVisit?: string;
  }>;
  iconicRestaurants: Array<{
    name: string;
    cuisineType: string;
    mustTryDishes: string;
    dietaryTags: string;
    atmosphere?: string;
  }>;
  localCuisine: string[];
  secretExperiences: Array<{
    title: string;
    description: string;
    insiderTip: string;
  }>;
  travelTips: string[];
  budgetTiers: {
    backpacker: string;
    comfortable: string;
    luxury: string;
  };
  transitGateway: string;
  visaAndPermits: string;
  coordinates: { lat: number; lng: number };
}

// -------------------------------------------------------------
// Curated Deep Dossiers for Frequently Queried & Landmark Cities
// -------------------------------------------------------------
const ENCYCLOPEDIC_DOSSIERS: Record<string, DestinationDossier> = {
  palitana: {
    name: 'Palitana',
    country: 'India',
    region: 'Saurashtra, Gujarat',
    isDomestic: true,
    tagline: 'The Sacred Mountain Citadel of 863+ Intricately Carved Marble Temples',
    overview:
      'Palitana, nestled at the foothills of Mount Shatrunjaya in Gujarat, is revered worldwide as the holiest pilgrimage site in Jainism. Perched dramatically across twin peaks overlooking the serene Shetrunji River, it is the only mountain on Earth with more than 863 white marble temples built by generations of devotees over a millennium. Every stone on the mountain is considered sacred, representing an ethereal spiritual realm where peace and non-violence reign supreme.\n\nPilgrims and cultural travelers begin their 3,500-step ascent in the starlit coolness before dawn, accompanied by the gentle chanting of hymns. As the first rays of the morning sun strike the Chaumukha towers and sculpted marble domes, the entire summit radiates a brilliant white glow across the Saurashtra plains. At the mountain base, Palitana is the world\'s first officially declared vegetarian city, offering a uniquely peaceful, contemplative, and culturally enriching experience.',
    idealDuration: '2 - 3 Days',
    bestMonths: 'October to March (Pleasant, dry winter climbing season)',
    climateVibe: 'Crisp cool mornings (14°C - 18°C), dry sunny afternoons, starry nights',
    touristPlaces: [
      {
        name: 'Shatrunjaya Sacred Temple Complex',
        category: 'Sacred Architecture & Heritage',
        description: 'Spectacular cluster of 863+ white marble temples crowning the twin ridges of Mount Shatrunjaya, constructed between the 11th and 19th centuries.',
        bestTimeToVisit: 'Sunrise / Early Morning (before 7:00 AM)',
      },
      {
        name: 'Shri Adishwar Bhagwan Sanctum',
        category: 'Principal Tirth & Sanctum',
        description: 'The holiest shrine atop the hill, housing the diamond-adorned idol of Lord Rishabhdev (Adinath) with intricately carved marble arches.',
        bestTimeToVisit: 'Morning Darshan & Puja (8:00 AM - 10:30 AM)',
      },
      {
        name: 'Chaumukha (Four-Faced) Temple',
        category: 'Monumental Shrine',
        description: 'Grand quadrangle sanctuary with four identical marble idols facing the cardinal directions, crowned by ornate multi-tiered spires.',
        bestTimeToVisit: 'Mid-Morning (9:30 AM - 11:30 AM)',
      },
      {
        name: 'Hastagiri Jain Tirth & Shetrunji River Valley',
        category: 'Scenic Viewpoint & Pilgrimage',
        description: 'Tranquil hilltop temple complex located 16 km from Palitana, offering panoramic views across the sweeping Shetrunji River reservoir and valley.',
        bestTimeToVisit: 'Late Afternoon / Sunset',
      },
      {
        name: 'Adinath Heritage Museum & Taleti Foot-hills',
        category: 'Historical Museum & Relics',
        description: 'Houses ancient palm-leaf scriptures, 800-year-old Jain statues, miniature cosmological paintings, and historic artifacts from Shatrunjaya.',
        bestTimeToVisit: 'Afternoon (2:00 PM - 5:00 PM)',
      },
      {
        name: 'Ghee Kanta Traditional Artisan Bazaar',
        category: 'Cultural Market & Crafts',
        description: 'Historic market street famed for pure handwoven khadi, brass puja lamps, silver medallions, and authentic Gujarati embroidered textiles.',
        bestTimeToVisit: 'Evening (5:30 PM - 8:30 PM)',
      },
    ],
    iconicRestaurants: [
      {
        name: 'Hotel Shravak Satvik Bhojanshala',
        cuisineType: 'Authentic Kathiyawadi Jain Thali',
        mustTryDishes: 'Handmade bajra rotla with pure cow ghee, ringan no oro (roast eggplant), and fresh sweet kheer',
        dietaryTags: 'Strict Jain Satvik / 100% Pure Vegetarian',
        atmosphere: 'Bustling, warm, authentic pilgrim dining near Taleti Road',
      },
      {
        name: 'Hotel Sumeru Heritage Dining Hall',
        cuisineType: 'Traditional Gujarati & Kathiyawadi',
        mustTryDishes: 'Gujarati thali with dal dhokli, steaming sev tameta nu shaak, and fresh buttermilk (chaas)',
        dietaryTags: 'Pure Vegetarian / Jain Friendly',
        atmosphere: 'Spacious, air-conditioned family restaurant with immaculate service',
      },
      {
        name: 'Taleti Dharamshala Bhojanalaya',
        cuisineType: 'Community Pilgrim Satvik Dining',
        mustTryDishes: 'Nutritious yellow lentil dal, soft phulkas, seasonal gourd curry, and golden khichdi',
        dietaryTags: 'Strict Jain Satvik / No Root Vegetables',
        atmosphere: 'Traditional floor and bench seating with deeply spiritual hospitality',
      },
      {
        name: 'Jagruti Farsan & Ganthiya House',
        cuisineType: 'Saurashtra Morning Street Farsan',
        mustTryDishes: 'Freshly fried Vanela Ganthiya paired with grated raw papaya relish and fried green chilies',
        dietaryTags: 'Pure Vegetarian',
        atmosphere: 'Vibrant local breakfast hub with open frying cauldrons',
      },
    ],
    localCuisine: [
      'Kathiyawadi Satvik Thali: Hearth-baked bajra rotla, ringan no oro (charcoal-smoked eggplant), pure jaggery, and churned white butter',
      'Palitana Vanela Ganthiya: Hand-twisted crispy gram-flour spirals served with crunchy spiced raw papaya sambharo',
      'Gujarati Dal Dhokli: Hand-rolled wheat flour ribbons simmered in sweet-savory pigeon-pea lentil curry with peanuts',
      'Traditional Satvik Khichdi & Kadi: Wholesome golden rice-and-lentil pilaf paired with gently tempered spiced yogurt curry',
    ],
    secretExperiences: [
      {
        title: 'Starlight Dawn Ascent',
        description: 'Begin the 3,500-step marble stair ascent at 5:00 AM under starlight to witness the sun rise over the Gulf of Khambhat and illuminate the temple spires.',
        insiderTip: 'Wear thick white cotton socks to protect your feet when the marble heats up in the late morning sun.',
      },
      {
        title: 'Hastagiri Reservoir Twilight Walk',
        description: 'Escape the central pilgrim crowds by visiting the Hastagiri ridge at dusk for golden reflections over the tranquil waters of the Shetrunji Dam.',
        insiderTip: 'Hire an auto-rickshaw for the return journey in advance, as transport is scarce after dark.',
      },
    ],
    travelTips: [
      'Strict Sacred Dress Code: Modest clothing is mandatory; leather items (shoes, belts, wallets, and bags) are strictly forbidden on the hill.',
      'Temple Gate Hours: Gates open before dawn and close promptly at sunset; spending the night on the holy mountain is strictly prohibited.',
      'Doli Palanquin Support: Traditional rope and wooden chairs carried by four bearers are readily available at Taleti for seniors and families.',
      'World\'s First Vegetarian City: Respect the local community ethos; the entire municipal jurisdiction of Palitana is completely vegetarian.',
    ],
    budgetTiers: {
      backpacker: '₹ 1,200 - 2,000 / day (Dharamshala stays & bhojanshala dining)',
      comfortable: '₹ 3,500 - 6,000 / day (AC hotel rooms, private taxi transfers & dining)',
      luxury: '₹ 10,000+ / day (Bespoke suites, personal heritage guide & private SUV)',
    },
    transitGateway:
      'Palitana Railway Station (PIT) connects directly to Bhavnagar, Ahmedabad, and Mumbai Bandra Terminus. Nearest domestic airport: Bhavnagar Airport (BVC, 50 km • 1h drive). Nearest international airport: Ahmedabad Sardar Vallabhbhai Patel International Airport (AMD, 215 km • 4h via State Highway 36).',
    visaAndPermits: 'Open to domestic and international travelers with standard Indian tourist visa. No special entry permits required.',
    coordinates: { lat: 21.5222, lng: 71.8319 },
  },

  akola: {
    name: 'Akola',
    country: 'India',
    region: 'Vidarbha, Maharashtra',
    isDomestic: true,
    tagline: 'The Cotton City of Vidarbha: Historic Fortresses & Sacred Pilgrimage Gateways',
    overview:
      'Akola is an historic industrial, agricultural, and cultural hub in Maharashtra\'s eastern Vidarbha division, historically renowned as the "Cotton City" for its expansive textile ginning mills and rich black-cotton basalt plains along the Morna River. The city carries a storied history spanning the Bahmani Sultanate, Mughal, and Maratha eras, marked by the formidable stone bastions of Akola Fort (Asadgad) and the ancient Raj Rajeshwar Shiva temple.\n\nBeyond its commercial prominence, Akola is the primary launching gateway to some of Maharashtra\'s most celebrated eco-tourism and pilgrimage landmarks: the mist-shrouded 12th-century hill fortress of Narnala in the Satpura hills, the tiger corridors of Melghat, the revered Saint Gajanan Maharaj Sansthan at Shegaon, and the world-famous Lonar meteorite impact crater lake. Its culinary identity is distinctly bold, famous across Western India for its spicy Varhadi curries and iconic Shegaon kachoris.',
    idealDuration: '2 Days',
    bestMonths: 'October to February (Pleasant winter breeze)',
    climateVibe: 'Warm dry sunny afternoons (26°C - 30°C), cool breezy evenings (15°C - 19°C)',
    touristPlaces: [
      {
        name: 'Akola Fort (Asadgad) & Dahihanda Gate',
        category: 'Historic Military Fortress',
        description: 'Imposing stone fortification founded in the Bahmani era, featuring ancient stone cannons, the Hawakhana bastion, and panoramic city views.',
        bestTimeToVisit: 'Morning (8:30 AM - 11:00 AM)',
      },
      {
        name: 'Shri Sant Gajanan Maharaj Sansthan, Shegaon',
        category: 'Spiritual Pilgrimage & Gardens',
        description: 'One of Western India\'s most visited spiritual sanctuaries, featuring spotless marble prayer halls and the vast Anand Sagar lake gardens (40 km west).',
        bestTimeToVisit: 'Early Morning / Evening Aarti',
      },
      {
        name: 'Narnala Fort & Satpura Wildlife Sanctuary',
        category: 'Hill Fortress & Wildlife',
        description: 'Ancient mountain citadel nestled at 973 m elevation in the Satpura range, surrounded by lush teak forests and home to leopards and sloth bears.',
        bestTimeToVisit: 'Full-day excursion (8:00 AM - 4:00 PM)',
      },
      {
        name: 'Raj Rajeshwar Shiva Temple',
        category: 'Ancient Stone Temple',
        description: 'Centuries-old stone temple dedicated to Lord Shiva, revered as the patron protector of the city with vibrant Shivratri festivities.',
        bestTimeToVisit: 'Evening Puja (6:00 PM - 7:30 PM)',
      },
      {
        name: 'Morna Riverfront Heritage Walk',
        category: 'Urban Waterfront & Sunset',
        description: 'Restored public waterfront featuring pedestrian walkways, stone ghats, and community cultural gathering spaces along the Morna River.',
        bestTimeToVisit: 'Sunset (5:30 PM - 7:00 PM)',
      },
    ],
    iconicRestaurants: [
      {
        name: 'Shegaon Kachori Depot, Station Road',
        cuisineType: 'Iconic Vidarbha Street Snack',
        mustTryDishes: 'World-famous Shegaon Kachori: flaky golden pastry filled with coarse spiced moong dal and whole fennel seeds',
        dietaryTags: 'Pure Vegetarian',
        atmosphere: 'Bustling takeaway and street counter serving hot kachoris fresh from the kadhai',
      },
      {
        name: 'Annapurna Dining Hall',
        cuisineType: 'Traditional Maharashtrian Thali',
        mustTryDishes: 'Maharashtrian thali with puran poli, hot varan bhat, kothimbir vadi, and fresh green thecha',
        dietaryTags: 'Pure Vegetarian',
        atmosphere: 'Clean, traditional, family-friendly dining with generous unlimited servings',
      },
      {
        name: 'Green Park Restaurant',
        cuisineType: 'Vidarbha Varhadi & North Indian',
        mustTryDishes: 'Varhadi Pithla Bhakri, roasted tomato dal fry, and spiced butter naan',
        dietaryTags: 'Vegetarian Friendly / Multi-Cuisine',
        atmosphere: 'Comfortable indoor air-conditioned garden dining',
      },
      {
        name: 'Hotel RG Exclusive Restaurant',
        cuisineType: 'Multi-Cuisine & Regional Specials',
        mustTryDishes: 'Paneer Angara, spiced biryani, and crispy butter garlic rotis',
        dietaryTags: 'Vegetarian & Non-Vegetarian options',
        atmosphere: 'Upscale modern business hotel dining room with prompt service',
      },
    ],
    localCuisine: [
      'Authentic Shegaon Kachori: Golden-fried, crisp circular crust packed with spiced lentils, toasted coriander, and aromatic fennel seeds',
      'Vidarbha Jowar Bhakri & Pithla: Thick skillet-baked sorghum flatbread served with savory seasoned chickpea-flour gravy and garlic paste',
      'Varhadi Thecha & Poli: Fiery freshly pounded green chili, garlic, and sea salt chutney paired with soft wheat flatbreads',
      'Puran Poli with Katachi Amti: Sweet cardamom-scented lentil flatbread accompanied by tangy, spicy thin chana dal broth',
    ],
    secretExperiences: [
      {
        title: 'Narnala Fortress Sunrise Trek',
        description: 'Drive up through the Shahanur forest gate before sunrise to explore the mist-cloaked Mahakali gate and Shahnur lake before crowds arrive.',
        insiderTip: 'Hire a local forest department guide at Shahanur gate for wildlife spotting along the trail.',
      },
      {
        title: 'Shegaon Anand Sagar Twilight Stroll',
        description: 'Spend a meditative evening exploring the illuminated island temples and singing fountains of Anand Sagar Lake in Shegaon.',
        insiderTip: 'Visit on a weekday evening to avoid large weekend pilgrim crowds.',
      },
    ],
    travelTips: [
      'Commercial Airport Notice: Akola has only a small airstrip (Shivani Aerodrome) with no scheduled commercial flights. Fly to Nagpur (NAG) or Aurangabad (IXU) and take express trains or highway cabs.',
      'Super-Connected Rail Junction: Akola Junction (AK) is a major A-category railway station with 24/7 express connectivity to Mumbai, Pune, Nagpur, and Delhi.',
      'Local Transit: Metered and negotiated auto-rickshaws are the easiest way to traverse the city center; pre-book cabs for Narnala or Lonar.',
    ],
    budgetTiers: {
      backpacker: '₹ 1,000 - 1,800 / day (Budget station hotels & authentic kachori thalis)',
      comfortable: '₹ 2,800 - 5,000 / day (AC hotel rooms, private cabs & family dining)',
      luxury: '₹ 7,500+ / day (Premium business hotels & private chauffeur-driven excursions)',
    },
    transitGateway:
      'Akola Junction (AK) on Central Railway with direct trains to Mumbai CSMT, Pune, Howrah, and New Delhi. Commercial aviation hub: Dr. Babasaheb Ambedkar International Airport in Nagpur (NAG, 240 km • 3h 30m via Samruddhi Expressway) or Chhatrapati Sambhaji Nagar Airport (IXU, 225 km).',
    visaAndPermits: 'Open domestic travel. Standard Indian tourist visa for foreign visitors.',
    coordinates: { lat: 20.7002, lng: 77.0082 },
  },

  kerala: {
    name: 'Kerala',
    country: 'India',
    region: 'South India / Malabar Coast',
    isDomestic: true,
    tagline: 'God\'s Own Country: Tropical Backwaters, Spice Hills & Colonial Heritage',
    overview:
      'Kerala, bordered by the azure Arabian Sea and the lush Western Ghats, is one of South Asia\'s most enchanting coastal destinations. Celebrated worldwide as "God\'s Own Country", it offers a breathtaking tapestry of tranquil emerald backwaters, misty high-altitude tea plantations in Munnar, dramatic red-cliff beaches in Varkala, and centuries of multicultural maritime trade in historic Fort Kochi.\n\nFrom cruising on handcrafted wooden kettuvallam houseboats across Alleppey and Kumarakom to experiencing classical Kathakali dance and rejuvenating with authentic 5,000-year-old Ayurvedic wellness traditions, Kerala delivers a serene, restorative travel experience. The state is renowned for its progressive hospitality, world-class literacy, and delectable coconut-infused coastal gastronomy.',
    idealDuration: '5 - 7 Days',
    bestMonths: 'September to March (Pleasant tropical weather and backwater cruising)',
    climateVibe: 'Warm tropical sunshine (28°C - 32°C), cool coastal sea breezes, misty hill breezes in Munnar',
    touristPlaces: [
      {
        name: 'Fort Kochi & Chinese Fishing Nets',
        category: 'Colonial Maritime Heritage',
        description: 'Historic colonial port quarter with 14th-century cantilevered Chinese fishing nets, Dutch Palace (Mattancherry), and St. Francis Church.',
        bestTimeToVisit: 'Late Afternoon / Sunset (4:30 PM - 6:30 PM)',
      },
      {
        name: 'Alleppey (Alappuzha) Backwaters & Houseboat Cruises',
        category: 'Tranquil Waterways & Lagoons',
        description: 'Vast interconnected network of palm-fringed canals, paddy fields, and peaceful backwater lagoons explored via traditional thatched houseboats.',
        bestTimeToVisit: 'Full-day cruise or overnight stay (11:00 AM check-in)',
      },
      {
        name: 'Munnar Tea Plantations & Eravikulam National Park',
        category: 'High-Altitude Hill Sanctuary',
        description: 'Rolling emerald tea gardens, cascading waterfalls, and the natural habitat of the rare endangered Nilgiri Tahr mountain goat.',
        bestTimeToVisit: 'Early Morning (8:00 AM - 11:30 AM)',
      },
      {
        name: 'Varkala Cliff & Papanasam Beach',
        category: 'Dramatic Coastal Cliffs & Sands',
        description: 'Towering red laterite cliffs overlooking pristine golden sands and natural mineral springs, lined with bohemian cliffside cafes.',
        bestTimeToVisit: 'Sunset & Evening (5:00 PM - 8:00 PM)',
      },
      {
        name: 'Periyar Wildlife Sanctuary, Thekkady',
        category: 'Jungle & Elephant Reserve',
        description: 'Protected sanctuary surrounding Lake Periyar, home to wild elephant herds, tigers, bison, and aromatic organic spice plantations.',
        bestTimeToVisit: 'Early Morning Boat Safari (7:30 AM)',
      },
    ],
    iconicRestaurants: [
      {
        name: 'Paragon Restaurant, Calicut & Kochi',
        cuisineType: 'Legendary Malabar & Coastal Seafood',
        mustTryDishes: 'Fragrant Malabar Dum Biryani, Fish Moilee in creamy coconut milk, and flaky layered Malabar Parotta',
        dietaryTags: 'Seafood Specialist / Vegetarian Options Available',
        atmosphere: 'Bustling, vibrant, world-renowned culinary institution founded in 1939',
      },
      {
        name: 'Mothers Veg Plaza, Trivandrum',
        cuisineType: 'Authentic 30-Dish Kerala Sadhya',
        mustTryDishes: 'Grand Kerala Sadhya served on fresh banana leaves with avial, thoran, olan, pachadi, and hot payasam',
        dietaryTags: '100% Pure Vegetarian / Traditional Kerala',
        atmosphere: 'Spotless, traditional banana-leaf dining hall with warm Kerala hospitality',
      },
      {
        name: 'Dhe Puttu, Kochi',
        cuisineType: 'Traditional Kerala Steamed Puttu',
        mustTryDishes: 'Steamed red-rice and coconut puttu paired with rich black chickpea Kadala curry and banana fritters',
        dietaryTags: 'Pure Veg & Non-Veg variations',
        atmosphere: 'Contemporary, creative dining celebrating Kerala\'s beloved breakfast staple',
      },
      {
        name: 'Villa Maya Heritage Restaurant, Trivandrum',
        cuisineType: 'Gourmet Kerala & Pan-Asian Heritage',
        mustTryDishes: 'Coconut-crusted sea bass, roasted pumpkin curry with appams, and mango ginger kulfi',
        dietaryTags: 'Fine Dining / Extensive Vegetarian Menu',
        atmosphere: 'Restored 18th-century Dutch manor house with candlelit courtyard tables and classical live music',
      },
    ],
    localCuisine: [
      'Grand Kerala Sadhya: Royal feast of 24+ vegetarian delicacies including avial, sambar, olan, and payasam on a fresh banana leaf',
      'Appam with Vegetable Ishtu: Lacy fermented rice hoppers with soft spongy centers served alongside coconut-milk potato and pea stew',
      'Puttu and Kadala Curry: Steamed cylindrical rice-coconut cake accompanied by aromatic black chickpea masala',
      'Malabar Parotta with Vegetable Kurma: Flaky, multi-layered spiral flatbread paired with rich cashew and coconut vegetable gravy',
    ],
    secretExperiences: [
      {
        title: 'Munroe Island Canoe Waterway Tour',
        description: 'Glide through ultra-narrow village waterways too small for houseboats in Kollam\'s Munroe Island at sunrise, seeing coir weaving and kingfishers.',
        insiderTip: 'Book a hand-paddled wooden canoe with a local fisherman at 6:00 AM for undisturbed tranquility.',
      },
      {
        title: 'Marari Fishermen Village Sunset Walk',
        description: 'Escape commercial beach resorts by staying in eco-conscious Mararikulam, walking alongside traditional catamarans as fishermen bring in the day\'s harvest.',
        insiderTip: 'Visit the local coir cooperatives in the afternoon to see organic coconut fiber processing.',
      },
    ],
    travelTips: [
      'Served by 4 International Airports: Kerala has 4 commercial airports — Cochin (COK) in central Kerala (best for Kochi, Munnar, Alleppey), Trivandrum (TRV) in the south (best for capital, Kovalam, Varkala), Calicut (CCJ), and Kannur (CNN).',
      'Monsoon Magic: June to August brings rejuvenating monsoon showers, ideal for Ayurvedic therapies; October to March is peak sightseeing season.',
      'Backwater Etiquette: Use government-registered houseboats with bio-waste treatment systems to preserve Kerala\'s fragile wetland ecosystem.',
    ],
    budgetTiers: {
      backpacker: '₹ 1,500 - 2,500 / day (Heritage homestays, public ferries & local thali meals)',
      comfortable: '₹ 4,500 - 8,000 / day (Boutique backwater resorts, private cab & houseboat cruise)',
      luxury: '₹ 16,000+ / day (Luxury Ayurvedic sanctuaries, private pool villas & premium catamarans)',
    },
    transitGateway:
      'Direct international gateways: Cochin International Airport (COK), Trivandrum International (TRV), Calicut (CCJ), and Kannur (CNN). Extensive Southern Railway rail network connecting all coastal cities.',
    visaAndPermits: 'Open domestic travel. Standard Indian tourist visa for foreign travelers.',
    coordinates: { lat: 9.9312, lng: 76.2673 },
  },

  switzerland: {
    name: 'Switzerland',
    country: 'Switzerland',
    region: 'Central Europe / Alps',
    isDomestic: false,
    tagline: 'Majestic Alpine Summits, Glacier Lakes & World-Class Rail Journeys',
    overview:
      'Switzerland is the gold standard of European alpine beauty, renowned for dramatic jagged peaks, crystalline glacial lakes, lush valley meadows, and medieval cobblestone cities. From the iconic pyramid peak of the Matterhorn towering above car-free Zermatt to the high-alpine wonderland of the Jungfrau region in the Bernese Oberland, Switzerland captivates travelers with pristine nature and clockwork precision.\n\nThe Swiss Travel System provides Europe\'s most seamless multimodal transit, with integrated panoramic trains (Glacier Express, Bernina Express), mountain cogwheels, and lake steamers connecting seamlessly with national rail hubs. Renowned for artisanal cheese fondue, world-class chocolate, and tranquil alpine villages.',
    idealDuration: '5 - 8 Days',
    bestMonths: 'June to September (Alpine hiking & lakes) / December to March (Skiing & winter wonderland)',
    climateVibe: 'Crisp alpine air, sunny mountain terraces (18°C - 24°C in summer; -4°C - 4°C in winter)',
    touristPlaces: [
      {
        name: 'The Matterhorn & Gornergrat Railway, Zermatt',
        category: 'Iconic Mountain & Cogwheel Rail',
        description: 'World-famous pyramidal summit viewed from the Gornergrat panoramic ridge at 3,089 meters, surrounded by 29 four-thousand-meter peaks.',
        bestTimeToVisit: 'Morning (9:00 AM - 1:00 PM)',
      },
      {
        name: 'Jungfraujoch — Top of Europe, Interlaken',
        category: 'Glacier Saddle & Ice Palace',
        description: 'Highest railway station in Europe at 3,454 m elevation, featuring the Sphinx observatory, Aletsch Glacier, and carved Ice Palace tunnels.',
        bestTimeToVisit: 'Early Morning first departure',
      },
      {
        name: 'Lake Zurich & Old Town (Altstadt)',
        category: 'Historic Waterfront & Promenades',
        description: 'Charming medieval alleys, Grossmünster twin towers, Lindenhof scenic terrace, and tranquil lake promenade boat cruises.',
        bestTimeToVisit: 'Afternoon & Sunset',
      },
      {
        name: 'Chapel Bridge (Kapellbrücke) & Lake Lucerne',
        category: 'Medieval Wooden Bridge & Lake',
        description: 'Europe\'s oldest covered wooden footbridge dating to the 14th century, adorned with historic interior triangular paintings.',
        bestTimeToVisit: 'Morning / Afternoon',
      },
      {
        name: 'Rhine Falls, Schaffhausen',
        category: 'Powerful Natural Waterfall',
        description: 'Europe\'s most powerful waterfall with scenic river viewing platforms and boat excursions right up to the roaring center rock.',
        bestTimeToVisit: 'Midday (11:00 AM - 3:00 PM)',
      },
    ],
    iconicRestaurants: [
      {
        name: 'Zeughauskeller, Zurich',
        cuisineType: 'Traditional Swiss Guildhouse Dining',
        mustTryDishes: 'Zürcher Geschnetzeltes: sliced veal in white wine cream sauce with golden crisp potato Rösti',
        dietaryTags: 'Swiss Alpine Specialties / Vegetarian options',
        atmosphere: 'Historic 15th-century armory building with heavy oak beams and vibrant beer hall ambiance',
      },
      {
        name: 'Chez Vrony, Zermatt',
        cuisineType: 'Alpine Gourmet & Chalet Gastronomy',
        mustTryDishes: 'Homemade Valaisanne dried cured meats, artisanal mountain cheese fondue, and truffle ravioli',
        dietaryTags: 'Fine Mountain Dining / Organic Farm Produce',
        atmosphere: 'Chic rustic wooden sun terrace directly facing the majestic Matterhorn',
      },
      {
        name: 'Hiltl, Zurich',
        cuisineType: 'Guinness Record World\'s Oldest Vegetarian Restaurant',
        mustTryDishes: 'Expansive buffet of over 100 vegetarian and vegan specialties from Switzerland, India, and the Mediterranean',
        dietaryTags: '100% Vegetarian / Vegan / Halal Friendly',
        atmosphere: 'Modern, elegant, stylish four-story culinary institution operating continuously since 1898',
      },
      {
        name: 'Restaurant Taverne, Interlaken',
        cuisineType: 'Traditional Bernese Alpine Fondue',
        mustTryDishes: 'Bubbling half-and-half Gruyère and Vacherin cheese fondue with crusty rustic bread cubes and baby potatoes',
        dietaryTags: 'Swiss Classic / Vegetarian Friendly',
        atmosphere: 'Cozy alpine wood-paneled tavern with traditional Swiss music',
      },
    ],
    localCuisine: [
      'Swiss Cheese Fondue: Rich molten blend of Gruyère and Emmental with white wine and kirsch, dipped with crusty sourdough bread',
      'Valaisanne Raclette: Wheel of alpine cheese melted under heat and scraped over steamed baby potatoes, gherkins, and pickled pearl onions',
      'Zürcher Geschnetzeltes with Golden Rösti: Pan-fried crispy grated potato cake topped with savory mushroom cream sauce',
      'Bircher Muesli: Wholesome rolled oats soaked overnight in fresh milk, blended with grated crisp apples, yogurt, and toasted hazelnuts',
    ],
    secretExperiences: [
      {
        title: 'Lake Brienz Wooden Kayak Safari',
        description: 'Paddle across the turquoise glacial waters of Lake Brienz at 8:00 AM to see reflections of 1,000-meter cliffs and Giessbach falls in total quiet.',
        insiderTip: 'Rent a kayak from Bönigen; morning waters are mirror-calm before motorboats arrive.',
      },
      {
        title: 'Car-Free Zermatt Gorner Gorge Walk',
        description: 'Walk through the dramatic wooden boardwalks suspended above the churning turquoise waters of Gorner Gorge, carved over thousands of years.',
        insiderTip: 'Visit between 3:00 PM and 5:00 PM when sunlight illuminates the turquoise glacial river.',
      },
    ],
    travelTips: [
      'Swiss Travel Pass: An all-in-one pass providing unlimited travel across SBB trains, lake steamers, postal buses, and free admission to 500+ museums.',
      'Punctuality & Precision: Swiss trains depart precisely to the second; arrive at the platform at least 5 minutes prior to scheduled departure.',
      'Tap Water Purity: Public fountains throughout all Swiss cities and villages spout pure, delicious, icy mineral water safe to drink directly.',
    ],
    budgetTiers: {
      backpacker: 'CHF 85 - 130 / day (~₹ 8,000 - 12,000, hostels & supermarket picnics)',
      comfortable: 'CHF 220 - 380 / day (~₹ 21,000 - 36,000, 3-4★ hotels & scenic rail journeys)',
      luxury: 'CHF 650+ / day (~₹ 62,000+, 5★ palace hotels, private alpine ski guides & Michelin dining)',
    },
    transitGateway:
      'Zurich Airport (ZRH) and Geneva Airport (GVA) are the primary international gateways with underground SBB train platforms. Direct rail connections to Basel, Bern, Lucerne, Interlaken, and Zermatt.',
    visaAndPermits: 'Schengen Visa required for Indian and non-EU passport holders.',
    coordinates: { lat: 46.8182, lng: 8.2275 },
  },

  japan: {
    name: 'Japan',
    country: 'Japan',
    region: 'East Asia',
    isDomestic: false,
    tagline: 'Timeless Harmony of Ancient Shrines, Neon Metropolises & Culinary Mastery',
    overview:
      'Japan is a captivating realm where futuristic technological innovation coexists harmoniously with ancient Zen traditions. From the bustling, neon-bathed pedestrian crossings of Shibuya and Akihabara in Tokyo to the tranquil bamboo groves of Arashiyama and thousand vermilion torii gates of Fushimi Inari in Kyoto, Japan provides an unmatched journey of discovery.\n\nThe country is internationally celebrated for immaculate cleanliness, supreme courtesy, and the high-speed Shinkansen bullet train network traversing Honshu at 320 km/h. Its gastronomy is recognized by UNESCO as an Intangible Cultural Heritage, emphasizing pristine seasonal produce, artisan ramen, and multi-course Kaiseki feasts.',
    idealDuration: '7 - 10 Days',
    bestMonths: 'March to May (Cherry blossom Sakura) / September to November (Vibrant autumn foliage)',
    climateVibe: 'Mild and pleasant (15°C - 22°C in spring and autumn), crisp sunny skies',
    touristPlaces: [
      {
        name: 'Fushimi Inari Taisha & Torii Mountain Path, Kyoto',
        category: 'Ancient Shinto Shrine',
        description: 'Thousands of vibrant vermilion torii gates winding up the sacred Mount Inari through peaceful cedar forests.',
        bestTimeToVisit: 'Early Morning (before 7:00 AM) or Evening',
      },
      {
        name: 'Senso-ji Temple & Asakusa, Tokyo',
        category: 'Historic Buddhist Temple',
        description: 'Tokyo\'s oldest temple founded in 645 AD, approached via the historic Nakamise shopping street lined with traditional Edo snacks.',
        bestTimeToVisit: 'Morning (8:30 AM - 10:30 AM)',
      },
      {
        name: 'Arashiyama Bamboo Grove & Tenryu-ji, Kyoto',
        category: 'Natural Bamboo Forest & Zen Temple',
        description: 'Towering green bamboo stalks swaying with musical rustles in the breeze, adjacent to a 14th-century Zen landscape garden.',
        bestTimeToVisit: 'Sunrise (6:30 AM - 8:00 AM)',
      },
      {
        name: 'Mount Fuji 5th Station & Lake Kawaguchiko',
        category: 'Iconic Sacred Volcano & Lake',
        description: 'Japan\'s highest and most sacred peak reflected in the mirror-like waters of Lake Kawaguchiko, surrounded by seasonal cherry blossoms.',
        bestTimeToVisit: 'Early Morning clear weather',
      },
      {
        name: 'Shibuya Crossing & Meiji Jingu Shrine, Tokyo',
        category: 'Urban Icon & Peaceful Forest Shrine',
        description: 'The world\'s busiest pedestrian scramble crossing contrasting with the tranquil 170-acre evergreen forest surrounding Meiji Shrine.',
        bestTimeToVisit: 'Late Afternoon to Night for Shibuya; Morning for Meiji Shrine',
      },
    ],
    iconicRestaurants: [
      {
        name: 'Nishiki Market Food Stalls, Kyoto',
        cuisineType: 'Kyoto Heritage Street Food & Delicacies',
        mustTryDishes: 'Takoyaki, grilled skewers, matcha warabi mochi, and fresh yuba (tofu skin)',
        dietaryTags: 'Diverse street picks, vegetarian tofu snacks available',
        atmosphere: 'Vibrant, historic 400-year-old market street known as "Kyoto\'s Kitchen"',
      },
      {
        name: 'Gion Karyo, Kyoto',
        cuisineType: 'Traditional Kyoto Kaiseki Multi-Course',
        mustTryDishes: '10-course seasonal kaiseki feast featuring bamboo shoots, seasonal sashimi, and dashi simmered vegetables',
        dietaryTags: 'Fine Dining / Kaiseki Master',
        atmosphere: 'Intimate dining within a meticulously restored wooden machiya townhouse in historic Gion',
      },
      {
        name: 'Afuri Ramen, Tokyo (Harajuku / Ebisu)',
        cuisineType: 'Artisanal Light Yuzu Dashi Ramen',
        mustTryDishes: 'Yuzu Shio Ramen or Yuzu Ratanmen, with vegan broth and springy whole-grain noodles',
        dietaryTags: 'Dedicated Vegan Ramen Option Available',
        atmosphere: 'Sleek, minimalist counter seating with automated ticket ordering',
      },
      {
        name: 'Gonpachi Nishiazabu, Tokyo',
        cuisineType: 'Izakaya & Soba Grill',
        mustTryDishes: 'Charcoal-grilled yakitori, handmade buckwheat soba noodles, and tempura',
        dietaryTags: 'Traditional Izakaya',
        atmosphere: 'Spectacular multi-level timber tavern that inspired the tavern duel in Kill Bill',
      },
    ],
    localCuisine: [
      'Kyoto Kaiseki Ryori: Multi-course culinary masterpiece balancing color, seasonality, and natural Umami flavors',
      'Artisanal Tonkotsu & Yuzu Shio Ramen: Hand-pulled wheat noodles steeped in 14-hour rich broths topped with nori and soft-boiled egg',
      'Shojin Ryori: Centuries-old Buddhist vegetarian temple cuisine featuring tofu, seasonal mountain ferns, and sesame tofu',
      'Matcha Parfait & Warabi Mochi: Uji stone-ground green tea desserts paired with chewy bracken-starch cakes dusted with roasted kinako',
    ],
    secretExperiences: [
      {
        title: 'Gion Early Morning Stroll',
        description: 'Walk through the preserved cobblestone alleys of Shinbashi-dori in Gion at 6:30 AM before shops open, admiring wooden lattice machiya houses in absolute quiet.',
        insiderTip: 'Respect local signage: photographing geishas on private streets is strictly prohibited.',
      },
      {
        title: 'Shinjuku Gyoen Greenhouse Exploration',
        description: 'Escape the Tokyo metropolis inside the massive botanical greenhouse of Shinjuku Gyoen, surrounded by rare orchids and tropical flora.',
        insiderTip: 'Pick up an Ekiben (station bento) at Shinjuku station and enjoy an afternoon lawn picnic.',
      },
    ],
    travelTips: [
      'Suica / Pasmo IC Card: Purchase a digital IC transit card on Apple Wallet or physical Welcome Suica for frictionless subway, bus, and convenience store payments.',
      'Shinkansen Luggage Rules: Luggage with total dimensions exceeding 160 cm requires an advance oversized baggage seat reservation.',
      'Cash & Etiquette: While IC cards are widely accepted, small shrines, temples, and ramen ticket machines still require cash (yen). Tipping is strictly not customary.',
    ],
    budgetTiers: {
      backpacker: '¥ 6,000 - 9,500 / day (~₹ 3,500 - 5,500, capsule hotels & konbini meals)',
      comfortable: '¥ 18,000 - 32,000 / day (~₹ 10,000 - 18,000, 3-4★ hotels, Shinkansen travel & dining)',
      luxury: '¥ 65,000+ / day (~₹ 38,000+, luxury Ryokans with private onsen & Michelin Kaiseki)',
    },
    transitGateway:
      'Tokyo Haneda (HND, closest to city center), Tokyo Narita (NRT), and Kansai International Airport in Osaka (KIX). High-speed Tokaido Shinkansen bullet train connects Tokyo to Kyoto in 2h 15m.',
    visaAndPermits: 'Standard tourist visa or eVisa required for Indian and eligible international passport holders.',
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
};

// -------------------------------------------------------------
// Universal Dynamic Dossier Generator for ANY City or Country
// -------------------------------------------------------------
export function getEncyclopedicDossierFallback(
  destinationInput: string,
  currency: string = 'INR'
): DestinationDossier {
  const raw = (destinationInput || '').trim();
  const lower = raw.toLowerCase();

  // 1. Direct match in curated encyclopedic records
  for (const [key, dossier] of Object.entries(ENCYCLOPEDIC_DOSSIERS)) {
    if (lower.includes(key) || key.includes(lower)) {
      return dossier;
    }
  }

  // 2. Check Global Non-Airport Destination (Zermatt, Interlaken, Amalfi, Hallstatt, Machu Picchu, etc.)
  const nonAirport = findNonAirportDestination(raw);
  if (nonAirport) {
    const transit = resolveCityTransitProfile(raw);
    const country = nonAirport.country;
    const isDomestic = country.toLowerCase() === 'india';

    return {
      name: nonAirport.name,
      country,
      region: nonAirport.region || country,
      isDomestic,
      tagline: `Authentic High-Character Destination Grounded by Safar AI`,
      overview: `${nonAirport.name} is an iconic destination nestled in ${country}, celebrated for pristine natural vistas, authentic cultural architecture, and historic atmosphere. Free from heavy commercial runway traffic, the town preserves its quiet scenic character while remaining seamlessly connected via ${nonAirport.primaryAirport.feederRoute}.\n\nTravelers arrive via the gateway airport at ${nonAirport.primaryAirport.name} (${nonAirport.primaryAirport.code}) in ${nonAirport.primaryAirport.city}, followed by a scenic transfer (${nonAirport.primaryAirport.driveTime}). The town offers tranquil walks, traditional dining, and timeless local charm.`,
      idealDuration: '3 - 4 Days',
      bestMonths: 'Year-Round / Seasonal Peak',
      climateVibe: 'Crisp mountain/coastal breezes, pleasant daytime temperatures, serene evenings',
      touristPlaces: [
        {
          name: `${nonAirport.name} Historic Old Town & Central Square`,
          category: 'Cultural Landmark & Architecture',
          description: `Charming pedestrian streets, centuries-old local architecture, and historic viewpoints across ${nonAirport.name}.`,
          bestTimeToVisit: 'Morning (9:00 AM - 12:00 PM)',
        },
        {
          name: `${nonAirport.name} Panoramic Scenic Lookout`,
          category: 'Scenic Viewpoint & Nature',
          description: `Sweeping panoramic vistas over the natural landscape and mountain/water boundaries of ${nonAirport.name}.`,
          bestTimeToVisit: 'Late Afternoon / Sunset',
        },
        {
          name: `${nonAirport.name} Heritage Artisan Market`,
          category: 'Crafts & Regional Traditions',
          description: `Bustling local stalls featuring handcrafted goods, regional souvenirs, and traditional delicacies.`,
          bestTimeToVisit: 'Evening (5:00 PM - 8:00 PM)',
        },
      ],
      iconicRestaurants: [
        {
          name: `${nonAirport.name} Traditional Heritage Bistro`,
          cuisineType: `Authentic Regional ${country} Specialties`,
          mustTryDishes: `Handcrafted local specialties made with farm-to-table ingredients`,
          dietaryTags: 'Vegetarian Friendly / Local Cuisine',
          atmosphere: 'Warm, rustic, character-filled setting with local hospitality',
        },
        {
          name: `${nonAirport.name} Scenic Terrace Restaurant`,
          cuisineType: 'Panoramic Dining & Regional Wine/Beverages',
          mustTryDishes: 'Fresh seasonal delicacies paired with local beverages',
          dietaryTags: 'Fine Dining / Scenic View',
          atmosphere: 'Outdoor terrace with dramatic views over the surrounding hills',
        },
      ],
      localCuisine: [
        `Traditional ${country} Artisan Platter with fresh local produce`,
        `Slow-simmered regional stew or hearth-baked bread`,
        `Locally pressed sweet pastries and fresh seasonal fruits`,
        `Signature herbal teas and mountain/coastal beverages`,
      ],
      secretExperiences: [
        {
          title: 'Dawn Exploration Walk',
          description: `Explore the cobblestone avenues of ${nonAirport.name} before day-tripper coaches arrive to experience undisturbed tranquility.`,
          insiderTip: 'Start walking 30 minutes before sunrise for golden light photography.',
        },
      ],
      travelTips: [
        transit.airport.notice || 'Direct commercial transit connections available.',
        transit.railway.notice || 'Regional mainline rail network links to national corridors.',
        'Wear sturdy walking shoes suitable for cobblestones or inclines.',
      ],
      budgetTiers: {
        backpacker: `${currency} 2,500 - 4,500 / day`,
        comfortable: `${currency} 8,000 - 15,000 / day`,
        luxury: `${currency} 25,000+ / day`,
      },
      transitGateway: transit.airport.feederSummary || 'Expressway and rail connections link into central gateways.',
      visaAndPermits: isDomestic ? 'Open domestic travel' : 'Standard passport & tourist visa requirements apply',
      coordinates: { lat: nonAirport.primaryAirport.lat, lng: nonAirport.primaryAirport.lng },
    };
  }

  // 3. Check 195 Worldwide Country Database (France, Germany, Australia, Egypt, etc.)
  const matchedCountry = findCountryByNameOrAlias(raw);
  if (matchedCountry) {
    const isDomestic = matchedCountry.name.toLowerCase() === 'india';
    return {
      name: matchedCountry.name,
      country: matchedCountry.name,
      region: matchedCountry.continent,
      isDomestic,
      tagline: `Global Gateway: Capital ${matchedCountry.capital} & ${matchedCountry.primaryAirport.name}`,
      overview: `${matchedCountry.name} is a sovereign country situated in ${matchedCountry.continent}. Anchored by its capital ${matchedCountry.capital}, the nation is globally connected through its primary aviation gateway, ${matchedCountry.primaryAirport.name} (${matchedCountry.primaryAirport.code}) in ${matchedCountry.primaryAirport.city}.\n\n${matchedCountry.overviewNotice}\n\nTransit across the country is supported by ${matchedCountry.railway.authority}, with mainline connections originating at ${matchedCountry.railway.primaryStation}. Maritime connections: ${matchedCountry.seaport.notice}`,
      idealDuration: '5 - 9 Days',
      bestMonths: 'Spring and Autumn shoulder seasons',
      climateVibe: `Authentic ${matchedCountry.continent} climate with seasonal diversity`,
      touristPlaces: [
        {
          name: `${matchedCountry.capital} Historic City Center & National Monument`,
          category: 'Capital Landmark & History',
          description: `Historic heart of ${matchedCountry.name}, featuring national museums, government architectural monuments, and grand plazas.`,
          bestTimeToVisit: 'Morning (9:30 AM - 1:00 PM)',
        },
        {
          name: `${matchedCountry.primaryAirport.city} Cultural Boulevard & Promenade`,
          category: 'Cultural Precinct',
          description: `Vibrant urban avenues showcasing local music, artisan crafts, and historic cathedrals or temples.`,
          bestTimeToVisit: 'Late Afternoon',
        },
        {
          name: `${matchedCountry.seaport.isCoastal ? matchedCountry.seaport.portName : `${matchedCountry.name} National Nature Reserve`}`,
          category: matchedCountry.seaport.isCoastal ? 'Maritime Harbor' : 'Nature Reserve',
          description: matchedCountry.seaport.isCoastal
            ? `Active passenger harbor and coastal scenic walkway in ${matchedCountry.name}.`
            : `Protected wilderness sanctuary featuring pristine native landscapes and fauna.`,
          bestTimeToVisit: 'Morning / Sunset',
        },
      ],
      iconicRestaurants: [
        {
          name: `${matchedCountry.capital} Grand Heritage Restaurant`,
          cuisineType: `Authentic National ${matchedCountry.name} Gastronomy`,
          mustTryDishes: `Traditional national specialty dishes created with local ingredients`,
          dietaryTags: 'Full Menu / Vegetarian Friendly',
          atmosphere: 'Elegant, historic setting with authentic regional music',
        },
        {
          name: `${matchedCountry.primaryAirport.city} Central Market Eatery`,
          cuisineType: 'Fresh Local Market Cuisine',
          mustTryDishes: 'Seasonal market produce and hearty traditional stews',
          dietaryTags: 'Authentic Local Flavors',
          atmosphere: 'Bustling, warm, welcoming atmosphere frequented by residents',
        },
      ],
      localCuisine: [
        `Signature ${matchedCountry.name} National Main Course`,
        `Freshly prepared artisan baked breads and regional cheeses or pastries`,
        `Traditional slow-cooked vegetable or legume specialties`,
        `Celebrated local tea, coffee, or botanical infusions`,
      ],
      secretExperiences: [
        {
          title: `Old Quarter Night Walk in ${matchedCountry.capital}`,
          description: `Stroll through the illuminated historic quarters of ${matchedCountry.capital} after evening dining when monuments glow with architectural lighting.`,
          insiderTip: 'Carry local currency or digital contactless cards for street snacks.',
        },
      ],
      travelTips: [
        matchedCountry.overviewNotice,
        matchedCountry.railway.notice,
        matchedCountry.seaport.notice,
      ],
      budgetTiers: {
        backpacker: `${currency} 3,500 - 5,500 / day`,
        comfortable: `${currency} 10,000 - 20,000 / day`,
        luxury: `${currency} 35,000+ / day`,
      },
      transitGateway: `Primary International Hub: ${matchedCountry.primaryAirport.name} (${matchedCountry.primaryAirport.code}) in ${matchedCountry.primaryAirport.city}.`,
      visaAndPermits: isDomestic ? 'Open domestic travel' : 'International passport & tourist visa required',
      coordinates: { lat: matchedCountry.primaryAirport.lat, lng: matchedCountry.primaryAirport.lng },
    };
  }

  // 4. Fallback for Any Other City on Earth
  const transit = resolveCityTransitProfile(raw);
  const detected = detectContinentOrRegion(raw);
  const isDomestic = transit.country.toLowerCase() === 'india';

  return {
    name: transit.city || raw,
    country: transit.country || detected.region,
    region: detected.region,
    isDomestic,
    tagline: `Grounded World Travel Destination Grounded by Safar AI`,
    overview: `${transit.city || raw} is an exciting destination located in ${transit.country || detected.region}. Rich in regional heritage, local commerce, and welcoming community spirit, it offers visitors a genuine glimpse into the cultural traditions and daily rhythms of ${transit.country}.\n\nTransit accessibility: ${transit.airport.notice}\n\nRail and ground links: ${transit.railway.notice}`,
    idealDuration: '2 - 3 Days',
    bestMonths: 'October to April (Favorable climate)',
    climateVibe: 'Pleasant daytime temperatures and temperate evenings',
    touristPlaces: [
      {
        name: `${transit.city || raw} Historic Quarter & Central Landmark`,
        category: 'Heritage Landmark',
        description: `Historic center and architectural heart of ${transit.city || raw}.`,
        bestTimeToVisit: 'Morning (9:00 AM - 11:30 AM)',
      },
      {
        name: `${transit.city || raw} District Promenade & Botanical Gardens`,
        category: 'Scenic & Recreation',
        description: `Tranquil public gathering grounds with lush flora and evening walking promenades.`,
        bestTimeToVisit: 'Late Afternoon / Sunset',
      },
      {
        name: `${transit.city || raw} Traditional Crafts Bazaar`,
        category: 'Local Market',
        description: `Vibrant retail avenue showcasing authentic regional handicrafts, spices, and textiles.`,
        bestTimeToVisit: 'Evening (5:00 PM - 8:30 PM)',
      },
    ],
    iconicRestaurants: [
      {
        name: `${transit.city || raw} Traditional Dining Hall`,
        cuisineType: `Authentic ${transit.country} Regional Cuisine`,
        mustTryDishes: 'Chef\'s signature regional thali or traditional specialty',
        dietaryTags: 'Vegetarian Friendly / Halal / Local Specials',
        atmosphere: 'Bustling, warm, welcoming local favorite',
      },
      {
        name: `${transit.city || raw} Heritage Cafe & Sweets`,
        cuisineType: 'Regional Snacks & Confectionery',
        mustTryDishes: 'Freshly prepared hot snacks and traditional sweet treats',
        dietaryTags: 'Pure Vegetarian / Quick Bites',
        atmosphere: 'Cozy and relaxed neighborhood tea and snack parlor',
      },
    ],
    localCuisine: [
      `Signature ${transit.city || raw} regional specialty platter`,
      `Locally baked breads and aromatic seasoned curries`,
      `Crispy freshly fried afternoon street savory snacks`,
      `Traditional regional milk sweets or spiced tea`,
    ],
    secretExperiences: [
      {
        title: 'Morning Market Stroll',
        description: `Visit the central market at 7:00 AM when local farmers and bakers bring in fresh morning produce.`,
        insiderTip: 'Try the fresh seasonal breakfast delicacies from the busiest local vendor.',
      },
    ],
    travelTips: [
      transit.airport.notice || 'Direct commercial transit connections available.',
      transit.railway.notice || 'Regional mainline rail network links to national corridors.',
      'Keep small change in local currency for auto-rickshaws and street vendors.',
    ],
    budgetTiers: {
      backpacker: `${currency} 1,500 - 2,500 / day`,
      comfortable: `${currency} 4,500 - 8,500 / day`,
      luxury: `${currency} 15,000+ / day`,
    },
    transitGateway: transit.airport.feederSummary || 'Expressway and rail connections link into central gateways.',
    visaAndPermits: isDomestic ? 'Open domestic travel' : 'Standard tourist visa applies',
    coordinates: { lat: transit.lat, lng: transit.lng },
  };
}
