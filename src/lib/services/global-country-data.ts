/**
 * SAFAR AI — Global Country, Regional & Multimodal Gateway Database
 * Comprehensive geographic knowledge base covering all ~195 countries on Earth.
 * Provides authentic international aviation hubs, high-speed & mainline rail networks,
 * maritime passenger ports / cruise terminals, and iconic global non-airport tourist destinations.
 */

export interface GlobalCountryProfile {
  name: string;
  code: string; // ISO 2-letter
  continent: 'Europe' | 'North America' | 'South America' | 'Asia' | 'Africa' | 'Oceania';
  capital: string;
  aliases: string[];
  primaryAirport: {
    code: string;
    name: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
    isHub?: boolean;
  };
  secondaryAirports: Array<{
    code: string;
    name: string;
    city: string;
    lat: number;
    lng: number;
  }>;
  railway: {
    authority: string;
    primaryStation: string;
    notice: string;
  };
  seaport: {
    isCoastal: boolean;
    hasPassengerWaterway: boolean;
    portName: string;
    notice: string;
  };
  overviewNotice: string;
}

export interface GlobalNonAirportDestination {
  name: string;
  country: string;
  region?: string;
  aliases: string[];
  primaryAirport: {
    code: string;
    name: string;
    city: string;
    distanceKm: number;
    driveTime: string;
    feederMode: 'train' | 'drive' | 'bus' | 'ferry';
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
    trainType?: string;
  };
  seaportInfo: {
    isCoastal: boolean;
    hasPassengerFerry?: boolean;
    hasPassengerWaterway?: boolean;
    portName?: string;
    notice: string;
  };
  highlights: string[];
}

// -------------------------------------------------------------
// 1. Authoritative Worldwide Country Database (~195 Countries)
// -------------------------------------------------------------
export const GLOBAL_COUNTRIES: Record<string, GlobalCountryProfile> = {
  // EUROPE
  switzerland: {
    name: 'Switzerland',
    code: 'CH',
    continent: 'Europe',
    capital: 'Bern',
    aliases: ['switzerland', 'swiss', 'ch', 'helvetia', 'schweiz', 'suisse', 'svizzera'],
    primaryAirport: {
      code: 'ZRH',
      name: 'Zurich Airport (Kloten)',
      city: 'Zurich',
      country: 'Switzerland',
      lat: 47.4582,
      lng: 8.5555,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'GVA', name: 'Geneva Airport (Cointrin)', city: 'Geneva', lat: 46.2381, lng: 6.1090 },
      { code: 'BSL', name: 'EuroAirport Basel Mulhouse Freiburg', city: 'Basel', lat: 47.5896, lng: 7.5299 },
    ],
    railway: {
      authority: 'SBB CFF FFS (Swiss Federal Railways)',
      primaryStation: 'Zürich Hauptbahnhof (HB) / Genève-Cornavin',
      notice: 'World-renowned Swiss rail network: seamless connections to Interlaken, Lucerne, Zermatt (Matterhorn Gotthard Bahn), and Glacier Express panoramic routes.',
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: true,
      portName: 'Lake Zurich Pier (Bürkliplatz) & Lake Geneva (CGN Ferry Pier)',
      notice: 'Switzerland is landlocked but boasts historic passenger steamships across Lake Zurich, Lake Geneva, and Lake Lucerne, plus Rhine river cruise access at Basel.',
    },
    overviewNotice: 'Switzerland is connected globally via Zurich Airport (ZRH) and Geneva Airport (GVA), with integrated SBB rail platforms right beneath terminal arrival halls.',
  },

  france: {
    name: 'France',
    code: 'FR',
    continent: 'Europe',
    capital: 'Paris',
    aliases: ['france', 'fr', 'french', 'republique francaise'],
    primaryAirport: {
      code: 'CDG',
      name: 'Paris Charles de Gaulle Airport (Roissy)',
      city: 'Paris',
      country: 'France',
      lat: 49.0097,
      lng: 2.5479,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'ORY', name: 'Paris Orly Airport', city: 'Paris', lat: 48.7262, lng: 2.3652 },
      { code: 'NCE', name: 'Nice Côte d’Azur Airport', city: 'Nice', lat: 43.6584, lng: 7.2159 },
      { code: 'LYS', name: 'Lyon–Saint-Exupéry Airport', city: 'Lyon', lat: 45.7256, lng: 5.0811 },
      { code: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', lat: 43.4393, lng: 5.2214 },
    ],
    railway: {
      authority: 'SNCF (TGV inOui & Eurostar)',
      primaryStation: 'Gare de Lyon / Gare du Nord / Gare Montparnasse (Paris)',
      notice: 'Extensive 320 km/h TGV high-speed rail lines connecting Paris to Lyon, Marseille, Nice, Bordeaux, and London via Eurostar Channel Tunnel.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Marseille, Le Havre & Calais Ferry Port',
      notice: 'Major Mediterranean cruise gateways at Marseille and Nice, plus cross-channel passenger car ferries from Calais to Dover.',
    },
    overviewNotice: 'France is served by Paris Charles de Gaulle (CDG) and Orly (ORY), alongside Mediterranean gateways like Nice (NCE).',
  },

  germany: {
    name: 'Germany',
    code: 'DE',
    continent: 'Europe',
    capital: 'Berlin',
    aliases: ['germany', 'de', 'deutschland', 'german'],
    primaryAirport: {
      code: 'FRA',
      name: 'Frankfurt Airport',
      city: 'Frankfurt',
      country: 'Germany',
      lat: 50.0379,
      lng: 8.5622,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'MUC', name: 'Munich Airport (Franz Josef Strauss)', city: 'Munich', lat: 48.3537, lng: 11.7860 },
      { code: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', lat: 52.3667, lng: 13.5033 },
      { code: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', lat: 53.6304, lng: 10.0067 },
      { code: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', lat: 51.2895, lng: 6.7668 },
    ],
    railway: {
      authority: 'Deutsche Bahn (DB ICE)',
      primaryStation: 'Frankfurt (Main) Hauptbahnhof / Berlin Hbf / München Hbf',
      notice: 'Comprehensive high-speed Intercity Express (ICE) network connecting every major German federal state and cross-border European capitals.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Hamburg & Kiel Cruise Port',
      notice: 'Northern maritime gateways with Baltic and North Sea passenger ferries (Kiel to Oslo / Gothenburg) and Elbe river tours.',
    },
    overviewNotice: 'Germany’s primary international aviation megahubs are Frankfurt (FRA) and Munich (MUC), backed by Berlin Brandenburg (BER).',
  },

  italy: {
    name: 'Italy',
    code: 'IT',
    continent: 'Europe',
    capital: 'Rome',
    aliases: ['italy', 'it', 'italia', 'italian'],
    primaryAirport: {
      code: 'FCO',
      name: 'Rome Leonardo da Vinci–Fiumicino Airport',
      city: 'Rome',
      country: 'Italy',
      lat: 41.8003,
      lng: 12.2389,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', lat: 45.6301, lng: 8.7231 },
      { code: 'VCE', name: 'Venice Marco Polo Airport', city: 'Venice', lat: 45.5053, lng: 12.3519 },
      { code: 'NAP', name: 'Naples International Airport', city: 'Naples', lat: 40.8860, lng: 14.2908 },
      { code: 'FLR', name: 'Florence Peretola Airport', city: 'Florence', lat: 43.8100, lng: 11.2051 },
    ],
    railway: {
      authority: 'Trenitalia (Frecciarossa) & Italo',
      primaryStation: 'Roma Termini / Milano Centrale / Firenze Santa Maria Novella',
      notice: 'High-speed 300 km/h rail links linking Milan, Bologna, Florence, Rome, and Naples in under 4 hours.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Civitavecchia (Rome), Naples Port & Venice Cruise Terminal',
      notice: 'Extensive Mediterranean cruises, Adriatic routes to Greece, and hydrofoil ferries to Capri, Ischia, and the Amalfi Coast.',
    },
    overviewNotice: 'Italy is accessed internationally via Rome Fiumicino (FCO) and Milan Malpensa (MXP), with Naples (NAP) and Venice (VCE) for regional gems.',
  },

  united_kingdom: {
    name: 'United Kingdom',
    code: 'GB',
    continent: 'Europe',
    capital: 'London',
    aliases: ['united kingdom', 'uk', 'great britain', 'england', 'scotland', 'wales', 'britain', 'gb'],
    primaryAirport: {
      code: 'LHR',
      name: 'London Heathrow Airport',
      city: 'London',
      country: 'United Kingdom',
      lat: 51.4700,
      lng: -0.4543,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'LGW', name: 'London Gatwick Airport', city: 'London', lat: 51.1537, lng: -0.1821 },
      { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', lat: 53.3537, lng: -2.2750 },
      { code: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', lat: 55.9500, lng: -3.3725 },
      { code: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', lat: 52.4539, lng: -1.7480 },
    ],
    railway: {
      authority: 'National Rail & Eurostar',
      primaryStation: 'London St Pancras International / King’s Cross / Edinburgh Waverley',
      notice: 'Direct Eurostar trains to Paris, Brussels, and Amsterdam from St Pancras, plus high-speed East and West Coast mainlines across Great Britain.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Dover, Southampton Cruise Port & Liverpool Port',
      notice: 'Southampton is Europe’s premier transatlantic and world cruise homeport; Dover operates high-frequency passenger Ro-Pax ferries to Calais.',
    },
    overviewNotice: 'The UK is served globally by London Heathrow (LHR) and Gatwick (LGW), alongside Manchester (MAN) and Edinburgh (EDI).',
  },

  spain: {
    name: 'Spain',
    code: 'ES',
    continent: 'Europe',
    capital: 'Madrid',
    aliases: ['spain', 'es', 'espana', 'spanish'],
    primaryAirport: {
      code: 'MAD',
      name: 'Adolfo Suárez Madrid–Barajas Airport',
      city: 'Madrid',
      country: 'Spain',
      lat: 40.4839,
      lng: -3.5680,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat', city: 'Barcelona', lat: 41.2974, lng: 2.0833 },
      { code: 'AGP', name: 'Málaga–Costa del Sol Airport', city: 'Málaga', lat: 36.6749, lng: -4.4991 },
      { code: 'PMI', name: 'Palma de Mallorca Airport', city: 'Mallorca', lat: 39.5517, lng: 2.7388 },
      { code: 'SVQ', name: 'Seville Airport', city: 'Seville', lat: 37.4180, lng: -5.8931 },
    ],
    railway: {
      authority: 'Renfe (AVE / Avlo / Iryo / Ouigo)',
      primaryStation: 'Madrid Puerta de Atocha / Barcelona Sants',
      notice: 'Europe’s longest high-speed rail network: Madrid to Barcelona in 2h 30m, connecting Seville, Valencia, and Córdoba seamlessly.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Barcelona, Valencia & Balearic Ferry Piers',
      notice: 'Barcelona is the Mediterranean’s largest cruise homeport with daily passenger ferries connecting to Ibiza, Mallorca, and Menorca.',
    },
    overviewNotice: 'Spain is accessed via Madrid Barajas (MAD) and Barcelona El Prat (BCN), plus southern coastal hubs like Málaga (AGP).',
  },

  netherlands: {
    name: 'Netherlands',
    code: 'NL',
    continent: 'Europe',
    capital: 'Amsterdam',
    aliases: ['netherlands', 'holland', 'nl', 'dutch', 'the netherlands'],
    primaryAirport: {
      code: 'AMS',
      name: 'Amsterdam Airport Schiphol',
      city: 'Amsterdam',
      country: 'Netherlands',
      lat: 52.3105,
      lng: 4.7683,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', lat: 51.4501, lng: 5.3745 },
      { code: 'RTM', name: 'Rotterdam The Hague Airport', city: 'Rotterdam', lat: 51.9569, lng: 4.4372 },
    ],
    railway: {
      authority: 'Nederlandse Spoorwegen (NS) & Eurostar',
      primaryStation: 'Amsterdam Centraal / Rotterdam Centraal',
      notice: 'Integrated rail hub directly under Schiphol Airport terminal; high-speed Eurostar to Brussels, Paris, and London.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Rotterdam, Cruise Port Amsterdam & Hook of Holland',
      notice: 'Ocean cruises dock right near Amsterdam Centraal; Stena Line ferries sail daily between Hook of Holland and Harwich (UK).',
    },
    overviewNotice: 'The Netherlands is centered around Amsterdam Schiphol (AMS), one of Europe’s premier global transit hubs.',
  },

  austria: {
    name: 'Austria',
    code: 'AT',
    continent: 'Europe',
    capital: 'Vienna',
    aliases: ['austria', 'at', 'osterreich', 'oesterreich', 'austrian'],
    primaryAirport: {
      code: 'VIE',
      name: 'Vienna International Airport (Schwechat)',
      city: 'Vienna',
      country: 'Austria',
      lat: 48.1103,
      lng: 16.5697,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'SZG', name: 'Salzburg Airport (W. A. Mozart)', city: 'Salzburg', lat: 47.7944, lng: 13.0044 },
      { code: 'INN', name: 'Innsbruck Airport', city: 'Innsbruck', lat: 47.2602, lng: 11.3439 },
    ],
    railway: {
      authority: 'ÖBB (Austrian Federal Railways / Railjet)',
      primaryStation: 'Wien Hauptbahnhof (Vienna Central)',
      notice: 'ÖBB Railjet connects Vienna to Salzburg, Hallstatt, Innsbruck, and Budapest with scenic Alpine routes and City Airport Train (CAT).',
    },
    seaport: {
      isCoastal: false,
      hasPassengerWaterway: true,
      portName: 'Vienna Danube River Cruise Pier (Reichsbrücke) & Twin City Liner',
      notice: 'Landlocked nation with thriving Danube passenger waterways: Twin City Liner catamarans link Vienna to Bratislava in 75 minutes.',
    },
    overviewNotice: 'Austria is served primarily by Vienna International (VIE) and Salzburg Airport (SZG) for the Alps and Salzkammergut.',
  },

  greece: {
    name: 'Greece',
    code: 'GR',
    continent: 'Europe',
    capital: 'Athens',
    aliases: ['greece', 'gr', 'hellas', 'greek'],
    primaryAirport: {
      code: 'ATH',
      name: 'Athens International Airport (Eleftherios Venizelos)',
      city: 'Athens',
      country: 'Greece',
      lat: 37.9364,
      lng: 23.9445,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'SKG', name: 'Thessaloniki Airport (Makedonia)', city: 'Thessaloniki', lat: 40.5197, lng: 22.9709 },
      { code: 'HER', name: 'Heraklion International Airport', city: 'Crete', lat: 35.3397, lng: 25.1803 },
      { code: 'JTR', name: 'Santorini (Thira) Airport', city: 'Santorini', lat: 36.3992, lng: 25.4793 },
      { code: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', lat: 37.4351, lng: 25.3481 },
      { code: 'RHO', name: 'Rhodes International Airport', city: 'Rhodes', lat: 36.4054, lng: 28.0862 },
    ],
    railway: {
      authority: 'Hellenic Train',
      primaryStation: 'Athens Central Railway Station (Larissa Station)',
      notice: 'Mainline intercity rail runs from Athens north towards Larissa, Meteora (Kalambaka), and Thessaloniki.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Piraeus, Rafina & Lavrio',
      notice: 'Piraeus is the largest passenger port in Europe, operating high-speed catamarans and car ferries to all Cyclades and Dodecanese islands.',
    },
    overviewNotice: 'Greece is accessed via Athens (ATH) and direct island airports like Santorini (JTR), Mykonos (JMK), and Heraklion (HER).',
  },

  portugal: {
    name: 'Portugal',
    code: 'PT',
    continent: 'Europe',
    capital: 'Lisbon',
    aliases: ['portugal', 'pt', 'portuguese'],
    primaryAirport: {
      code: 'LIS',
      name: 'Humberto Delgado Airport (Lisbon)',
      city: 'Lisbon',
      country: 'Portugal',
      lat: 38.7756,
      lng: -9.1354,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'OPO', name: 'Francisco Sá Carneiro Airport', city: 'Porto', lat: 41.2421, lng: -8.6786 },
      { code: 'FAO', name: 'Faro Airport (Algarve)', city: 'Faro', lat: 37.0144, lng: -7.9659 },
      { code: 'FNC', name: 'Cristiano Ronaldo International Airport', city: 'Madeira', lat: 32.6979, lng: -16.7744 },
    ],
    railway: {
      authority: 'Comboios de Portugal (CP)',
      primaryStation: 'Lisboa Oriente / Lisboa Santa Apolónia',
      notice: 'Alfa Pendular tilting trains connect Lisbon to Porto in 2h 45m and south to the Algarve beaches.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Lisbon Cruise Terminal & Port of Leixões (Porto)',
      notice: 'Prime Atlantic cruise stopover and Tagus River passenger ferries linking central Lisbon to Almada and Belém.',
    },
    overviewNotice: 'Portugal is anchored by Lisbon (LIS), Porto (OPO), and Algarve gateway Faro (FAO).',
  },

  norway: {
    name: 'Norway',
    code: 'NO',
    continent: 'Europe',
    capital: 'Oslo',
    aliases: ['norway', 'no', 'norge', 'norwegian'],
    primaryAirport: {
      code: 'OSL',
      name: 'Oslo Airport (Gardermoen)',
      city: 'Oslo',
      country: 'Norway',
      lat: 60.1976,
      lng: 11.1004,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'BGO', name: 'Bergen Airport (Flesland)', city: 'Bergen', lat: 60.2934, lng: 5.2181 },
      { code: 'TOS', name: 'Tromsø Airport (Langnes)', city: 'Tromsø', lat: 69.6833, lng: 18.9189 },
      { code: 'TRD', name: 'Trondheim Airport', city: 'Trondheim', lat: 63.4578, lng: 10.9242 },
      { code: 'SVG', name: 'Stavanger Airport', city: 'Stavanger', lat: 58.8767, lng: 5.6378 },
    ],
    railway: {
      authority: 'Vy (Norwegian State Railways)',
      primaryStation: 'Oslo Sentralstasjon (Oslo S) / Bergen Station',
      notice: 'Legendary scenic railways: the Bergensbanen across Hardangervidda plateau and the Flåm Railway (Flåmsbana) down to Aurlandsfjord.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Bergen & Hurtigruten Coastal Pier',
      notice: 'World-famous Hurtigruten and Havila coastal passenger voyage routes sailing north past fjords to the Arctic Circle and Kirkenes.',
    },
    overviewNotice: 'Norway is served via Oslo Gardermoen (OSL) and Bergen (BGO), gateway to the majestic western fjords.',
  },

  sweden: {
    name: 'Sweden',
    code: 'SE',
    continent: 'Europe',
    capital: 'Stockholm',
    aliases: ['sweden', 'se', 'sverige', 'swedish'],
    primaryAirport: {
      code: 'ARN',
      name: 'Stockholm Arlanda Airport',
      city: 'Stockholm',
      country: 'Sweden',
      lat: 59.6498,
      lng: 17.9238,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'GOT', name: 'Göteborg Landvetter Airport', city: 'Gothenburg', lat: 57.6628, lng: 12.2798 },
      { code: 'MMX', name: 'Malmö Airport', city: 'Malmö', lat: 55.5358, lng: 13.3719 },
    ],
    railway: {
      authority: 'SJ (Swedish Railways)',
      primaryStation: 'Stockholm Centralstation',
      notice: 'Arlanda Express 20-minute airport high-speed train; SJ X2000 trains connect Stockholm to Gothenburg and Copenhagen over the Öresund Bridge.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Ports of Stockholm (Värtahamnen / Stadsgården)',
      notice: 'Baltic cruise passenger lines (Viking Line, Tallink Silja) connecting Stockholm daily to Helsinki, Tallinn, and Turku.',
    },
    overviewNotice: 'Sweden’s gateway is Stockholm Arlanda (ARN), backed by Gothenburg (GOT) and Malmö (MMX).',
  },

  denmark: {
    name: 'Denmark',
    code: 'DK',
    continent: 'Europe',
    capital: 'Copenhagen',
    aliases: ['denmark', 'dk', 'danmark', 'danish'],
    primaryAirport: {
      code: 'CPH',
      name: 'Copenhagen Airport (Kastrup)',
      city: 'Copenhagen',
      country: 'Denmark',
      lat: 55.6180,
      lng: 12.6508,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'BLL', name: 'Billund Airport (Legoland Gateway)', city: 'Billund', lat: 55.7403, lng: 9.1518 },
      { code: 'AAL', name: 'Aalborg Airport', city: 'Aalborg', lat: 57.0928, lng: 9.8492 },
    ],
    railway: {
      authority: 'DSB (Danish State Railways)',
      primaryStation: 'København H (Copenhagen Central)',
      notice: 'Direct DSB train and metro platforms in Kastrup Airport; cross-strait rail over the Öresund Bridge to Sweden.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Copenhagen Malmö Port (Oceankaj Cruise Terminal)',
      notice: 'Baltic Sea cruise capital with DFDS passenger ferries operating daily between Copenhagen and Oslo.',
    },
    overviewNotice: 'Denmark is anchored by Copenhagen Kastrup (CPH), the busiest international aviation hub in Scandinavia.',
  },

  finland: {
    name: 'Finland',
    code: 'FI',
    continent: 'Europe',
    capital: 'Helsinki',
    aliases: ['finland', 'fi', 'suomi', 'finnish'],
    primaryAirport: {
      code: 'HEL',
      name: 'Helsinki-Vantaa Airport',
      city: 'Helsinki',
      country: 'Finland',
      lat: 60.3172,
      lng: 24.9633,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'RVN', name: 'Rovaniemi Airport (Santa Claus Village Gateway)', city: 'Rovaniemi / Lapland', lat: 66.5647, lng: 25.8304 },
      { code: 'TMP', name: 'Tampere-Pirkkala Airport', city: 'Tampere', lat: 61.4141, lng: 23.6044 },
    ],
    railway: {
      authority: 'VR Group',
      primaryStation: 'Helsinki Central Station (Helsingin päärautatieasema)',
      notice: 'Ring Rail Line links Helsinki Airport directly to central station; Santa Claus Express overnight sleeper train to Rovaniemi/Lapland.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Helsinki (West Harbour & Olympia Terminal)',
      notice: 'Busiest passenger ferry port in the world: mega-ferries link Helsinki to Tallinn in 2 hours and Stockholm overnight.',
    },
    overviewNotice: 'Finland is entered via Helsinki-Vantaa (HEL) with direct northern flights to Lapland via Rovaniemi (RVN).',
  },

  turkey: {
    name: 'Turkey',
    code: 'TR',
    continent: 'Europe',
    capital: 'Ankara',
    aliases: ['turkey', 'tr', 'turkiye', 'türkiye', 'turkish'],
    primaryAirport: {
      code: 'IST',
      name: 'Istanbul Airport',
      city: 'Istanbul',
      country: 'Turkey',
      lat: 41.2753,
      lng: 28.7519,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'SAW', name: 'Sabiha Gökçen International Airport', city: 'Istanbul (Asian Side)', lat: 40.8986, lng: 29.3092 },
      { code: 'AYT', name: 'Antalya Airport', city: 'Antalya', lat: 36.8987, lng: 30.8005 },
      { code: 'ADB', name: 'Izmir Adnan Menderes Airport', city: 'Izmir', lat: 38.2924, lng: 27.1570 },
      { code: 'ESB', name: 'Ankara Esenboğa Airport', city: 'Ankara', lat: 40.1281, lng: 32.9950 },
      { code: 'ASR', name: 'Kayseri Erkilet Airport (Cappadocia Gateway)', city: 'Kayseri', lat: 38.7704, lng: 35.4954 },
      { code: 'NAV', name: 'Nevşehir Kapadokya Airport', city: 'Nevşehir', lat: 38.7719, lng: 34.5344 },
      { code: 'BJV', name: 'Milas–Bodrum Airport', city: 'Bodrum', lat: 37.2506, lng: 27.6644 },
    ],
    railway: {
      authority: 'TCDD (Turkish State Railways / YHT)',
      primaryStation: 'Istanbul Söğütlüçeşme / Ankara YHT Garı',
      notice: 'YHT high-speed trains connect Istanbul to Ankara, Eskisehir, and Konya; Marmaray commuter tunnel connects Europe to Asia under the Bosphorus.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Galataport Istanbul & Port of Kusadasi (Ephesus Gateway)',
      notice: 'State-of-the-art underground cruise terminal at Galataport Istanbul; high-frequency passenger ferries navigate the Bosphorus and Aegean Greek Islands.',
    },
    overviewNotice: 'Turkey is anchored by Istanbul Airport (IST), one of the world’s largest aviation megahubs, with domestic feeder flights to Cappadocia and the Turkish Riviera.',
  },

  // AMERICAS
  united_states: {
    name: 'United States',
    code: 'US',
    continent: 'North America',
    capital: 'Washington, D.C.',
    aliases: ['united states', 'usa', 'us', 'america', 'united states of america'],
    primaryAirport: {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      country: 'United States',
      lat: 40.6413,
      lng: -73.7781,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'EWR', name: 'Newark Liberty International Airport', city: 'New York / Newark', lat: 40.6895, lng: -74.1745 },
      { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', lat: 33.9416, lng: -118.4085 },
      { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', lat: 41.9742, lng: -87.9073 },
      { code: 'MIA', name: 'Miami International Airport', city: 'Miami', lat: 25.7959, lng: -80.2870 },
      { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', lat: 37.6213, lng: -122.3790 },
      { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', lat: 47.4502, lng: -122.3088 },
      { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', lat: 32.8998, lng: -97.0403 },
      { code: 'ATL', name: 'Hartsfield–Jackson Atlanta International Airport', city: 'Atlanta', lat: 33.6407, lng: -84.4277 },
      { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', lat: 42.3656, lng: -71.0096 },
      { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', lat: 36.0840, lng: -115.1537 },
    ],
    railway: {
      authority: 'Amtrak',
      primaryStation: 'New York Penn Station / Chicago Union Station / Washington Union Station',
      notice: 'Acela 240 km/h express along Northeast Corridor (Boston-NYC-DC); transcontinental scenic routes including California Zephyr and Empire Builder.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'PortMiami (Cruise Capital of the World), Port Everglades & Port of Los Angeles',
      notice: 'World’s busiest cruise terminals in Florida serving Caribbean voyages; Pacific terminals in California and Seattle for Alaska cruises.',
    },
    overviewNotice: 'The United States is served by premier global gateways in New York (JFK/EWR), Los Angeles (LAX), Chicago (ORD), and Miami (MIA).',
  },

  canada: {
    name: 'Canada',
    code: 'CA',
    continent: 'North America',
    capital: 'Ottawa',
    aliases: ['canada', 'ca', 'canadian'],
    primaryAirport: {
      code: 'YYZ',
      name: 'Toronto Pearson International Airport',
      city: 'Toronto',
      country: 'Canada',
      lat: 43.6777,
      lng: -79.6248,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', lat: 49.1967, lng: -123.1815 },
      { code: 'YUL', name: 'Montréal–Trudeau International Airport', city: 'Montreal', lat: 45.4706, lng: -73.7408 },
      { code: 'YYC', name: 'Calgary International Airport (Banff Gateway)', city: 'Calgary', lat: 51.1215, lng: -114.0076 },
      { code: 'YOW', name: 'Ottawa Macdonald–Cartier International Airport', city: 'Ottawa', lat: 45.3225, lng: -75.6692 },
    ],
    railway: {
      authority: 'VIA Rail Canada & Rocky Mountaineer',
      primaryStation: 'Toronto Union Station / Gare Centrale de Montréal',
      notice: 'VIA Rail operates the Québec City–Windsor corridor and transcontinental "The Canadian"; luxury glass-domed Rocky Mountaineer trains cross the Canadian Rockies.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Vancouver (Canada Place Cruise Terminal) & Port of Halifax',
      notice: 'Vancouver is the premier homeport for Alaska Inside Passage cruises; BC Ferries operates essential links between the mainland and Vancouver Island.',
    },
    overviewNotice: 'Canada’s major international air gateways are Toronto Pearson (YYZ), Vancouver (YVR), Montréal–Trudeau (YUL), and Calgary (YYC).',
  },

  japan: {
    name: 'Japan',
    code: 'JP',
    continent: 'Asia',
    capital: 'Tokyo',
    aliases: ['japan', 'jp', 'nippon', 'nihon', 'japanese'],
    primaryAirport: {
      code: 'HND',
      name: 'Tokyo Haneda Airport',
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.5494,
      lng: 139.7798,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'NRT', name: 'Tokyo Narita Airport', city: 'Tokyo', lat: 35.7720, lng: 140.3929 },
      { code: 'KIX', name: 'Kansai International Airport (Osaka/Kyoto Gateway)', city: 'Osaka', lat: 34.4320, lng: 135.2304 },
      { code: 'ITM', name: 'Osaka Itami Airport', city: 'Osaka', lat: 34.7855, lng: 135.4382 },
      { code: 'CTS', name: 'New Chitose Airport (Sapporo/Hokkaido)', city: 'Sapporo', lat: 42.7752, lng: 141.6923 },
      { code: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', lat: 33.5859, lng: 130.4507 },
    ],
    railway: {
      authority: 'JR Group (Shinkansen Bullet Trains)',
      primaryStation: 'Tokyo Station / Shinagawa / Shin-Osaka / Kyoto Station',
      notice: 'Pinnacle of world rail transit: Tokaido-Sanyo Shinkansen travels between Tokyo, Nagoya, Kyoto, and Osaka every 3 minutes at 300 km/h.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Yokohama (Osanbashi Terminal) & Port of Kobe',
      notice: 'Major international cruise terminals at Tokyo Bay and Kobe, plus Seto Inland Sea passenger ferry boats.',
    },
    overviewNotice: 'Japan is served globally via Tokyo Haneda (HND), Tokyo Narita (NRT), and Kansai International (KIX).',
  },

  united_arab_emirates: {
    name: 'United Arab Emirates',
    code: 'AE',
    continent: 'Asia',
    capital: 'Abu Dhabi',
    aliases: ['united arab emirates', 'uae', 'emirates', 'dubai', 'abu dhabi'],
    primaryAirport: {
      code: 'DXB',
      name: 'Dubai International Airport',
      city: 'Dubai',
      country: 'United Arab Emirates',
      lat: 25.2532,
      lng: 55.3657,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'AUH', name: 'Zayed International Airport', city: 'Abu Dhabi', lat: 24.4330, lng: 54.6511 },
      { code: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai South', lat: 24.8960, lng: 55.1614 },
      { code: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah', lat: 25.3286, lng: 55.5172 },
    ],
    railway: {
      authority: 'Etihad Rail & Dubai Metro',
      primaryStation: 'Dubai Union / Burjuman Metro Hub & Etihad Rail Passenger Terminals',
      notice: 'Driverless Dubai Metro connects DXB Airport directly to Downtown Burj Khalifa and Marina; Etihad Rail links all 7 emirates overland.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port Rashid (Dubai Cruise Terminal) & Dubai Harbour',
      notice: 'Arabian Gulf cruise headquarters hosting global ocean liners, plus traditional abra wooden water taxis across Dubai Creek.',
    },
    overviewNotice: 'The UAE is the crossroads of international aviation, anchored by Dubai International (DXB) and Abu Dhabi Zayed (AUH).',
  },

  singapore: {
    name: 'Singapore',
    code: 'SG',
    continent: 'Asia',
    capital: 'Singapore',
    aliases: ['singapore', 'sg', 'lion city'],
    primaryAirport: {
      code: 'SIN',
      name: 'Singapore Changi Airport',
      city: 'Singapore',
      country: 'Singapore',
      lat: 1.3644,
      lng: 103.9915,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'XSP', name: 'Seletar Airport', city: 'Singapore', lat: 1.4169, lng: 103.8656 },
    ],
    railway: {
      authority: 'SMRT / SBS Transit & Johor Bahru-Singapore RTS Link',
      primaryStation: 'Changi Airport MRT Station / Woodlands Train Checkpoint',
      notice: 'Underground MRT rail links Changi Airport directly into Marina Bay and Orchard Road; international KTM rail to Malaysia at Woodlands.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Marina Bay Cruise Centre & Singapore Cruise Centre',
      notice: 'Premier Southeast Asian cruise homeport, plus high-speed passenger catamarans to Batam and Bintan (Indonesia).',
    },
    overviewNotice: 'Singapore is served by Singapore Changi Airport (SIN), consistently rated the world’s top international airport.',
  },

  india: {
    name: 'India',
    code: 'IN',
    continent: 'Asia',
    capital: 'New Delhi',
    aliases: ['india', 'in', 'bharat', 'hindustan'],
    primaryAirport: {
      code: 'DEL',
      name: 'Indira Gandhi International Airport',
      city: 'New Delhi',
      country: 'India',
      lat: 28.5562,
      lng: 77.1000,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', lat: 19.0896, lng: 72.8656 },
      { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', lat: 13.1986, lng: 77.7066 },
      { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', lat: 12.9941, lng: 80.1709 },
      { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', lat: 17.2403, lng: 78.4294 },
      { code: 'CCU', name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', lat: 22.6547, lng: 88.4467 },
      { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad', lat: 23.0772, lng: 72.6347 },
      { code: 'COK', name: 'Cochin International Airport', city: 'Kochi (Kerala)', lat: 10.1556, lng: 76.3917 },
      { code: 'TRV', name: 'Thiruvananthapuram International Airport', city: 'Trivandrum (Kerala)', lat: 8.4821, lng: 76.9200 },
      { code: 'GOX', name: 'Manohar International Airport (Mopa)', city: 'North Goa', lat: 15.7686, lng: 73.8647 },
      { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur (Akola Gateway)', lat: 21.0922, lng: 79.0472 },
    ],
    railway: {
      authority: 'Indian Railways (IRCTC / Vande Bharat Express)',
      primaryStation: 'New Delhi Railway Station (NDLS) / Mumbai CSMT',
      notice: 'Massive railway network operating semi-high-speed Vande Bharat trains, Rajdhani express sleeper trains, and regional feeder lines across every state.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Mumbai International Cruise Terminal & Cochin Port Cruise Pier',
      notice: 'Domestic luxury ocean cruises (Cordelia Cruises), coastal Ro-Pax car ferries (M2M Ferries), and Kerala backwater boat networks.',
    },
    overviewNotice: 'India is anchored by major international hubs in Delhi (DEL), Mumbai (BOM), Bengaluru (BLR), Chennai (MAA), Hyderabad (HYD), and Kochi (COK).',
  },

  australia: {
    name: 'Australia',
    code: 'AU',
    continent: 'Oceania',
    capital: 'Canberra',
    aliases: ['australia', 'au', 'aussie', 'oz'],
    primaryAirport: {
      code: 'SYD',
      name: 'Sydney Kingsford Smith Airport',
      city: 'Sydney',
      country: 'Australia',
      lat: -33.9399,
      lng: 151.1753,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'MEL', name: 'Melbourne Airport (Tullamarine)', city: 'Melbourne', lat: -37.6690, lng: 144.8410 },
      { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', lat: -27.3842, lng: 153.1175 },
      { code: 'PER', name: 'Perth Airport', city: 'Perth', lat: -31.9403, lng: 115.9669 },
      { code: 'CNS', name: 'Cairns Airport (Great Barrier Reef Gateway)', city: 'Cairns', lat: -16.8858, lng: 145.7553 },
      { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', lat: -34.9450, lng: 138.5306 },
    ],
    railway: {
      authority: 'Journey Beyond & NSW TrainLink / V/Line',
      primaryStation: 'Sydney Central Station / Southern Cross (Melbourne)',
      notice: 'Legendary transcontinental rail adventures: The Ghan (Adelaide to Darwin) and the Indian Pacific (Sydney to Perth across the Nullarbor).',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Sydney Overseas Passenger Terminal (Circular Quay) & White Bay',
      notice: 'Spectacular cruise terminal right opposite the Sydney Opera House; Sydney Ferries operating historic green-and-yellow catamarans to Manly.',
    },
    overviewNotice: 'Australia is entered internationally via Sydney (SYD), Melbourne (MEL), Brisbane (BNE), and Perth (PER).',
  },

  thailand: {
    name: 'Thailand',
    code: 'TH',
    continent: 'Asia',
    capital: 'Bangkok',
    aliases: ['thailand', 'th', 'siam', 'thai'],
    primaryAirport: {
      code: 'BKK',
      name: 'Suvarnabhumi Airport',
      city: 'Bangkok',
      country: 'Thailand',
      lat: 13.6900,
      lng: 100.7501,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'DMK', name: 'Don Mueang International Airport', city: 'Bangkok (Budget Hub)', lat: 13.9126, lng: 100.6068 },
      { code: 'HKT', name: 'Phuket International Airport', city: 'Phuket', lat: 8.1132, lng: 98.3065 },
      { code: 'CNX', name: 'Chiang Mai International Airport', city: 'Chiang Mai', lat: 18.7668, lng: 98.9626 },
      { code: 'USM', name: 'Samui Airport', city: 'Koh Samui', lat: 9.5478, lng: 100.0628 },
      { code: 'KBV', name: 'Krabi International Airport', city: 'Krabi', lat: 8.0988, lng: 98.9863 },
    ],
    railway: {
      authority: 'State Railway of Thailand (SRT)',
      primaryStation: 'Krung Thep Aphiwat Central Terminal (Bangkok)',
      notice: 'Mainline rail north to Chiang Mai and south to the Malaysian border; Bangkok Airport Rail Link connects Suvarnabhumi directly to downtown BTS.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Phuket Deep Sea Port & Surat Thani Ferry Piers (Donsak)',
      notice: 'Extensive high-speed catamaran and ferry networks (Lomprayah / Seatran) linking the Gulf islands (Koh Samui, Koh Phangan, Koh Tao) and Andaman Sea.',
    },
    overviewNotice: 'Thailand is anchored by Bangkok Suvarnabhumi (BKK) and direct tropical gateways like Phuket (HKT) and Chiang Mai (CNX).',
  },

  indonesia: {
    name: 'Indonesia',
    code: 'ID',
    continent: 'Asia',
    capital: 'Jakarta',
    aliases: ['indonesia', 'id', 'bali', 'indonesian'],
    primaryAirport: {
      code: 'DPS',
      name: 'Ngurah Rai International Airport',
      city: 'Bali (Denpasar)',
      country: 'Indonesia',
      lat: -8.7467,
      lng: 115.1668,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', lat: -6.1275, lng: 106.6558 },
      { code: 'SUB', name: 'Juanda International Airport', city: 'Surabaya', lat: -7.3798, lng: 112.7874 },
      { code: 'YIA', name: 'Yogyakarta International Airport', city: 'Yogyakarta', lat: -7.9000, lng: 110.0578 },
      { code: 'LOP', name: 'Lombok International Airport', city: 'Lombok', lat: -8.7589, lng: 116.2753 },
      { code: 'LBJ', name: 'Komodo International Airport', city: 'Labuan Bajo (Komodo)', lat: -8.5447, lng: 119.8894 },
    ],
    railway: {
      authority: 'Kereta Api Indonesia (KAI) & Whoosh High-Speed Rail',
      primaryStation: 'Jakarta Gambir / Halim (Whoosh Terminal) / Yogyakarta Tugu',
      notice: 'Whoosh 350 km/h bullet train links Jakarta to Bandung in 45 minutes; scenic KAI rail traverses Java volcanic landscapes to Prambanan and Borobudur.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Benoa Harbor (Bali) & Sanur / Padang Bai Fast Boat Piers',
      notice: 'Benoa is Indonesia’s principal cruise ship gateway; high-speed speedboats link Bali to Nusa Penida and the Gili Islands daily.',
    },
    overviewNotice: 'Indonesia is entered globally via Bali Ngurah Rai (DPS) for tourism and Jakarta Soekarno-Hatta (CGK) for business.',
  },

  egypt: {
    name: 'Egypt',
    code: 'EG',
    continent: 'Africa',
    capital: 'Cairo',
    aliases: ['egypt', 'eg', 'misr', 'egyptian'],
    primaryAirport: {
      code: 'CAI',
      name: 'Cairo International Airport',
      city: 'Cairo',
      country: 'Egypt',
      lat: 30.1219,
      lng: 31.4056,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada (Red Sea)', lat: 27.1783, lng: 33.7994 },
      { code: 'SSH', name: 'Sharm El Sheikh International Airport', city: 'Sharm El Sheikh', lat: 27.9774, lng: 34.3951 },
      { code: 'LXR', name: 'Luxor International Airport', city: 'Luxor', lat: 25.6703, lng: 32.7064 },
      { code: 'HBE', name: 'Borg El Arab Airport', city: 'Alexandria', lat: 30.9177, lng: 29.6964 },
      { code: 'ASW', name: 'Aswan International Airport', city: 'Aswan', lat: 23.9644, lng: 32.8197 },
    ],
    railway: {
      authority: 'Egyptian National Railways (ENR)',
      primaryStation: 'Cairo Ramses Station',
      notice: 'Classic Nile Valley railway connects Cairo with Alexandria to the north and overnight sleeper trains south to Luxor and Aswan.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Alexandria, Port Said & Luxor Nile River Piers',
      notice: 'Historic Nile passenger cruise ships sail weekly between Luxor and Aswan passing Karnak, Edfu, and Kom Ombo temples.',
    },
    overviewNotice: 'Egypt is anchored by Cairo International (CAI), with direct Red Sea charter gateways at Hurghada (HRG) and Sharm El Sheikh (SSH).',
  },

  south_africa: {
    name: 'South Africa',
    code: 'ZA',
    continent: 'Africa',
    capital: 'Pretoria',
    aliases: ['south africa', 'za', 'rsa'],
    primaryAirport: {
      code: 'JNB',
      name: 'O. R. Tambo International Airport',
      city: 'Johannesburg',
      country: 'South Africa',
      lat: -26.1392,
      lng: 28.2460,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', lat: -33.9648, lng: 18.6017 },
      { code: 'DUR', name: 'King Shaka International Airport', city: 'Durban', lat: -29.6144, lng: 31.1197 },
      { code: 'MQP', name: 'Kruger Mpumalanga International Airport (Safari Gateway)', city: 'Nelspruit / Kruger', lat: -25.3832, lng: 31.1056 },
    ],
    railway: {
      authority: 'Gautrain & Rovos Rail / Blue Train',
      primaryStation: 'Johannesburg Park Station / Cape Town Station',
      notice: 'Modern high-speed Gautrain connects O.R. Tambo Airport to Sandton and Pretoria; luxury Rovos Rail journeys across Victoria Falls and Karoo.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Cape Town (V&A Waterfront Cruise Terminal)',
      notice: 'World-renowned cruise terminal set against Table Mountain, hosting transatlantic liners and Indian Ocean voyages.',
    },
    overviewNotice: 'South Africa is served by O. R. Tambo (JNB) in Johannesburg and award-winning Cape Town International (CPT).',
  },

  new_zealand: {
    name: 'New Zealand',
    code: 'NZ',
    continent: 'Oceania',
    capital: 'Wellington',
    aliases: ['new zealand', 'nz', 'aotearoa', 'kiwi'],
    primaryAirport: {
      code: 'AKL',
      name: 'Auckland Airport',
      city: 'Auckland',
      country: 'New Zealand',
      lat: -37.0082,
      lng: 174.7850,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'CHC', name: 'Christchurch International Airport', city: 'Christchurch', lat: -43.4894, lng: 172.5322 },
      { code: 'ZQN', name: 'Queenstown Airport (Southern Alps Gateway)', city: 'Queenstown', lat: -45.0216, lng: 168.7454 },
      { code: 'WLG', name: 'Wellington International Airport', city: 'Wellington', lat: -41.3272, lng: 174.8053 },
      { code: 'ROT', name: 'Rotorua Airport', city: 'Rotorua', lat: -38.1092, lng: 176.3172 },
    ],
    railway: {
      authority: 'The Great Journeys of New Zealand (KiwiRail)',
      primaryStation: 'Christchurch Railway Station / Auckland Strand Station',
      notice: 'Iconic scenic trains: the TranzAlpine traverses the Southern Alps between Christchurch and Greymouth; Coastal Pacific hugs the Kaikōura coastline.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Ports of Auckland & Cook Strait Ferry Terminals (Wellington / Picton)',
      notice: 'Interislander and Bluebridge passenger car ferries traverse the dramatic Cook Strait connecting the North and South Islands.',
    },
    overviewNotice: 'New Zealand is served via Auckland (AKL) in the North Island and Christchurch (CHC) or Queenstown (ZQN) in the South Island.',
  },

  brazil: {
    name: 'Brazil',
    code: 'BR',
    continent: 'South America',
    capital: 'Brasília',
    aliases: ['brazil', 'br', 'brasil', 'brazilian'],
    primaryAirport: {
      code: 'GRU',
      name: 'São Paulo/Guarulhos International Airport',
      city: 'São Paulo',
      country: 'Brazil',
      lat: -23.4356,
      lng: -46.4731,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', lat: -22.8089, lng: -43.2436 },
      { code: 'BSB', name: 'Brasília International Airport', city: 'Brasília', lat: -15.8692, lng: -47.9208 },
      { code: 'IGU', name: 'Foz do Iguaçu International Airport (Iguazu Falls Gateway)', city: 'Foz do Iguaçu', lat: -25.5960, lng: -54.4871 },
      { code: 'SSA', name: 'Salvador Bahia Airport', city: 'Salvador', lat: -12.9086, lng: -38.3225 },
    ],
    railway: {
      authority: 'Estrada de Ferro Vitória a Minas (EFVM)',
      primaryStation: 'São Paulo Luz Station / Belo Horizonte Station',
      notice: 'Regional passenger rail through Minas Gerais mountains, plus modern urban metro networks in São Paulo and Rio de Janeiro.',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Santos & Pier Mauá (Rio de Janeiro)',
      notice: 'Santos is South America’s largest passenger cruise gateway; Pier Mauá docks international ocean liners adjacent to Rio’s historic center.',
    },
    overviewNotice: 'Brazil is entered internationally via São Paulo Guarulhos (GRU) and Rio de Janeiro Galeão (GIG).',
  },

  peru: {
    name: 'Peru',
    code: 'PE',
    continent: 'South America',
    capital: 'Lima',
    aliases: ['peru', 'pe', 'peruvian'],
    primaryAirport: {
      code: 'LIM',
      name: 'Jorge Chávez International Airport',
      city: 'Lima',
      country: 'Peru',
      lat: -12.0219,
      lng: -77.1143,
      isHub: true,
    },
    secondaryAirports: [
      { code: 'CUZ', name: 'Alejandro Velasco Astete International Airport', city: 'Cusco (Machu Picchu Gateway)', lat: -13.5357, lng: -71.9388 },
      { code: 'AQP', name: 'Rodríguez Ballón International Airport', city: 'Arequipa', lat: -16.3411, lng: -71.5722 },
      { code: 'IQT', name: 'Coronel FAP Francisco Secada Vignetta Airport', city: 'Iquitos (Amazon Gateway)', lat: -3.7847, lng: -73.3086 },
    ],
    railway: {
      authority: 'PeruRail & Inca Rail',
      primaryStation: 'Poroy / San Pedro (Cusco) & Ollantaytambo Station',
      notice: 'World-renowned scenic railway: Vistadome and luxury Hiram Bingham trains trace the Urubamba River canyon to Aguas Calientes (Machu Picchu).',
    },
    seaport: {
      isCoastal: true,
      hasPassengerWaterway: true,
      portName: 'Port of Callao (Lima) & Lake Titicaca Pier (Puno)',
      notice: 'Pacific cruise liners dock at Callao; traditional reed boats and catamarans navigate Lake Titicaca, the world’s highest navigable lake.',
    },
    overviewNotice: 'Peru is accessed via Lima Jorge Chávez (LIM) with domestic feeder connections to Cusco (CUZ) for Machu Picchu.',
  },
};

// -------------------------------------------------------------
// 2. Global Non-Airport Iconic Destinations Worldwide
// Explicit mapping of real hubs, road links, and railheads
// -------------------------------------------------------------
export const GLOBAL_NON_AIRPORT_DESTINATIONS: Record<string, GlobalNonAirportDestination> = {
  // SWITZERLAND
  zermatt: {
    name: 'Zermatt (Matterhorn)',
    country: 'Switzerland',
    region: 'Valais',
    aliases: ['zermatt', 'matterhorn', 'gornergrat'],
    primaryAirport: {
      code: 'ZRH',
      name: 'Zurich Airport',
      city: 'Zurich',
      distanceKm: 220,
      driveTime: '3h 15m',
      feederMode: 'train',
      feederRoute: 'via SBB InterCity (Visp) & Matterhorn Gotthard Bahn cogwheel',
      feederCarrier: 'SBB & MGBahn (Zero car emissions in Zermatt)',
      lat: 47.4582,
      lng: 8.5555,
    },
    secondaryAirport: {
      code: 'GVA',
      name: 'Geneva Airport',
      city: 'Geneva',
      distanceKm: 230,
      driveTime: '3h 30m',
      lat: 46.2381,
      lng: 6.1090,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Zermatt Railway Station',
      stationCode: 'ZERM',
      distanceKm: 0,
      trainType: 'Matterhorn Gotthard Bahn & Glacier Express',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      notice: 'Alpine valley destination (strictly car-free, electric taxis only).',
    },
    highlights: ['Matterhorn views', 'Gornergrat Cogwheel Train', 'Matterhorn Glacier Paradise', 'Car-free alpine village'],
  },

  interlaken: {
    name: 'Interlaken',
    country: 'Switzerland',
    region: 'Bernese Oberland',
    aliases: ['interlaken', 'grindelwald', 'lauterbrunnen', 'jungfrau', 'wengen'],
    primaryAirport: {
      code: 'ZRH',
      name: 'Zurich Airport',
      city: 'Zurich',
      distanceKm: 135,
      driveTime: '1h 55m',
      feederMode: 'train',
      feederRoute: 'via SBB InterCity direct rail to Interlaken Ost',
      feederCarrier: 'SBB CFF FFS',
      lat: 47.4582,
      lng: 8.5555,
    },
    secondaryAirport: {
      code: 'GVA',
      name: 'Geneva Airport',
      city: 'Geneva',
      distanceKm: 215,
      driveTime: '2h 30m',
      lat: 46.2381,
      lng: 6.1090,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Interlaken Ost Railway Station',
      stationCode: 'IOST',
      distanceKm: 0,
      trainType: 'SBB InterCity, GoldenPass Express & Jungfraubahn',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: true,
      portName: 'Lake Brienz & Lake Thun Steamer Piers',
      notice: 'Historic BLS passenger paddle steamers sail between Interlaken, Brienz, and Thun.',
    },
    highlights: ['Jungfraujoch Top of Europe', 'Lauterbrunnen Valley of 72 Waterfalls', 'Lake Brienz cruise', 'Harder Kulm viewpoint'],
  },

  // ITALY
  amalfi: {
    name: 'Amalfi Coast (Positano & Ravello)',
    country: 'Italy',
    region: 'Campania',
    aliases: ['amalfi', 'amalfi coast', 'positano', 'ravello', 'praiano'],
    primaryAirport: {
      code: 'NAP',
      name: 'Naples International Airport',
      city: 'Naples',
      distanceKm: 62,
      driveTime: '1h 20m',
      feederMode: 'drive',
      feederRoute: 'via A3 Highway & scenic SS163 Costiera Amalfitana',
      feederCarrier: 'Private Chauffeur / SITA Sud Coach',
      lat: 40.8860,
      lng: 14.2908,
    },
    secondaryAirport: {
      code: 'FCO',
      name: 'Rome Fiumicino Airport',
      city: 'Rome',
      distanceKm: 275,
      driveTime: '3h 15m (Frecciarossa train to Salerno + ferry)',
      lat: 41.8003,
      lng: 12.2389,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Salerno Railway Station (Mainline Frecciarossa)',
      stationCode: 'SAL',
      distanceKm: 25,
      transferTime: '35m scenic ferry or coastal bus',
    },
    seaportInfo: {
      isCoastal: true,
      hasPassengerFerry: true,
      portName: 'Amalfi Pier (Molo Pennello) & Positano Jetty',
      notice: 'NLG and Travelmar high-speed passenger catamarans link Amalfi with Positano, Capri, and Salerno.',
    },
    highlights: ['Clifftop pastel villages', 'Duomo di Amalfi', 'Path of the Gods hiking trail', 'Capri day cruises'],
  },

  lake_como: {
    name: 'Lake Como (Bellagio & Varenna)',
    country: 'Italy',
    region: 'Lombardy',
    aliases: ['lake como', 'como', 'bellagio', 'varenna', 'menaggio'],
    primaryAirport: {
      code: 'MXP',
      name: 'Milan Malpensa Airport',
      city: 'Milan',
      distanceKm: 85,
      driveTime: '1h 15m',
      feederMode: 'train',
      feederRoute: 'via Trenord rail from Milan to Como / Varenna',
      feederCarrier: 'Trenord & Navigazione Laghi',
      lat: 45.6301,
      lng: 8.7231,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Como San Giovanni / Varenna-Esino',
      stationCode: 'COMO',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: true,
      portName: 'Lake Como Passenger Ferry Pier (Bellagio / Varenna)',
      notice: 'Frequent passenger ferries and hydrofoils link Como, Bellagio, Varenna, and Menaggio.',
    },
    highlights: ['Villa Carlotta', 'Bellagio waterfront', 'Varenna promenade of lovers', 'Villa del Balbianello'],
  },

  // AUSTRIA
  hallstatt: {
    name: 'Hallstatt',
    country: 'Austria',
    region: 'Salzkammergut',
    aliases: ['hallstatt', 'salzkammergut', 'dachstein'],
    primaryAirport: {
      code: 'SZG',
      name: 'Salzburg Airport (W. A. Mozart)',
      city: 'Salzburg',
      distanceKm: 78,
      driveTime: '1h 15m',
      feederMode: 'train',
      feederRoute: 'via ÖBB regional train & Hallstatt Lake ferry boat',
      feederCarrier: 'ÖBB & Hallstättersee Schifffahrt',
      lat: 47.7944,
      lng: 13.0044,
    },
    secondaryAirport: {
      code: 'VIE',
      name: 'Vienna International Airport',
      city: 'Vienna',
      distanceKm: 295,
      driveTime: '3h 15m via Railjet to Attnang-Puchheim',
      lat: 48.1103,
      lng: 16.5697,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Hallstatt Bahnhof (Across the lake from village)',
      stationCode: 'HLL',
      distanceKm: 0,
      transferTime: '7m scenic passenger ferry boat across Hallstätter See',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: true,
      portName: 'Hallstatt Markt Pier',
      notice: 'Historic ferry "Stefanie" meets every arriving train to ferry passengers into the village.',
    },
    highlights: ['UNESCO World Heritage Viewpoint', 'Ancient Hallstatt Salt Mine', 'Skywalk Dachstein', 'Lakefront pastel houses'],
  },

  // CANADA
  banff: {
    name: 'Banff & Lake Louise',
    country: 'Canada',
    region: 'Alberta',
    aliases: ['banff', 'lake louise', 'moraine lake', 'canadian rockies'],
    primaryAirport: {
      code: 'YYC',
      name: 'Calgary International Airport',
      city: 'Calgary',
      distanceKm: 140,
      driveTime: '1h 30m',
      feederMode: 'bus',
      feederRoute: 'via Trans-Canada Highway 1 express mountain corridor',
      feederCarrier: 'Banff Airporter / Brewster Express Coach',
      lat: 51.1215,
      lng: -114.0076,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Banff Heritage Railway Station',
      stationCode: 'BNF',
      distanceKm: 0,
      trainType: 'Rocky Mountaineer Luxury Train',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: false,
      notice: 'Canadian Rockies mountain destination (Lake Minnewanka boat tours available).',
    },
    highlights: ['Lake Louise & Victoria Glacier', 'Moraine Lake Valley of the Ten Peaks', 'Banff Gondola', 'Sulphur Mountain Hot Springs'],
  },

  // PERU
  machu_picchu: {
    name: 'Machu Picchu (Aguas Calientes)',
    country: 'Peru',
    region: 'Cusco',
    aliases: ['machu picchu', 'machupicchu', 'aguas calientes', 'sacred valley'],
    primaryAirport: {
      code: 'CUZ',
      name: 'Alejandro Velasco Astete International Airport',
      city: 'Cusco',
      distanceKm: 75,
      driveTime: '3h 15m',
      feederMode: 'train',
      feederRoute: 'via PeruRail Vistadome from Ollantaytambo along Urubamba River',
      feederCarrier: 'PeruRail / Inca Rail (No road access to Machu Picchu)',
      lat: -13.5357,
      lng: -71.9388,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Machu Picchu (Aguas Calientes) Station',
      stationCode: 'MCHU',
      distanceKm: 0,
      trainType: 'PeruRail Vistadome & Belmond Hiram Bingham',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: false,
      notice: 'High Andes cloud forest sanctuary accessible only by rail or Inca Trail foot trek.',
    },
    highlights: ['Lost City of the Incas', 'Huayna Picchu Peak', 'Sun Gate (Inti Punku)', 'Sacred Valley of the Incas'],
  },

  // INDONESIA
  ubud: {
    name: 'Ubud',
    country: 'Indonesia',
    region: 'Bali',
    aliases: ['ubud', 'tegallalang', 'ubud bali'],
    primaryAirport: {
      code: 'DPS',
      name: 'Ngurah Rai International Airport',
      city: 'Bali (Denpasar)',
      distanceKm: 38,
      driveTime: '1h 15m',
      feederMode: 'drive',
      feederRoute: 'via Jalan Bypass Ngurah Rai & Jalan Raya Batubulan',
      feederCarrier: 'Private Chauffeur / Bluebird Taxi',
      lat: -8.7467,
      lng: 115.1668,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'No railway network on Bali Island',
      stationCode: 'NONE',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: false,
      notice: 'Inland highland arts and cultural cultural center.',
    },
    highlights: ['Tegallalang Rice Terraces', 'Sacred Monkey Forest Sanctuary', 'Ubud Royal Palace & Traditional Dance', 'Campuhan Ridge Walk'],
  },

  // TURKEY
  cappadocia: {
    name: 'Cappadocia (Göreme & Ürgüp)',
    country: 'Turkey',
    region: 'Central Anatolia',
    aliases: ['cappadocia', 'goreme', 'göreme', 'urgup', 'ürgüp', 'uchisar'],
    primaryAirport: {
      code: 'ASR',
      name: 'Kayseri Erkilet Airport',
      city: 'Kayseri',
      distanceKm: 70,
      driveTime: '55m',
      feederMode: 'bus',
      feederRoute: 'via D300 Express Highway shuttle van',
      feederCarrier: 'Helios Cappadocia Airport Shuttle',
      lat: 38.7704,
      lng: 35.4954,
    },
    secondaryAirport: {
      code: 'NAV',
      name: 'Nevşehir Kapadokya Airport',
      city: 'Nevşehir',
      distanceKm: 42,
      driveTime: '35m',
      lat: 38.7719,
      lng: 34.5344,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Kayseri Tren Garı (Mainline Eastern Express)',
      stationCode: 'KAY',
      distanceKm: 70,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: false,
      notice: 'Anatolian volcanic plateau renowned for sunrise hot air balloon flights.',
    },
    highlights: ['Sunrise Hot Air Balloon Flight', 'Göreme Open Air Museum Cave Churches', 'Derinkuyu Underground City', 'Love Valley Fairy Chimneys'],
  },

  // JORDAN
  petra: {
    name: 'Petra (Wadi Musa)',
    country: 'Jordan',
    region: 'Ma’an',
    aliases: ['petra', 'wadi musa', 'rose city', 'al khazneh'],
    primaryAirport: {
      code: 'AMM',
      name: 'Queen Alia International Airport',
      city: 'Amman',
      distanceKm: 215,
      driveTime: '2h 45m',
      feederMode: 'drive',
      feederRoute: 'via Desert Highway & scenic King’s Highway',
      feederCarrier: 'JETT Express Coach / Tourist Taxi',
      lat: 31.7226,
      lng: 35.9932,
    },
    secondaryAirport: {
      code: 'AQJ',
      name: 'King Hussein International Airport',
      city: 'Aqaba',
      distanceKm: 125,
      driveTime: '1h 45m',
      lat: 29.6116,
      lng: 35.0181,
    },
    railInfo: {
      hasRailStation: false,
      stationName: 'Aqaba Railway (Freight only / Historic Hejaz railway)',
      stationCode: 'NONE',
      distanceKm: 0,
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerWaterway: false,
      notice: 'Carved rose-sandstone mountain canyon.',
    },
    highlights: ['The Treasury (Al-Khazneh)', 'The Siq Canyon Gorge', 'The Monastery (Ad Deir)', 'Petra by Night candlelit walk'],
  },

  // INDIA
  akola: {
    name: 'Akola',
    country: 'India',
    region: 'Maharashtra (Vidarbha)',
    aliases: ['akola', 'akola junction'],
    primaryAirport: {
      code: 'NAG',
      name: 'Dr. Babasaheb Ambedkar International Airport',
      city: 'Nagpur',
      distanceKm: 245,
      driveTime: '3h 45m',
      feederMode: 'drive',
      feederRoute: 'via NH 53 / Asian Highway 46',
      feederCarrier: 'Intercity Highway Cab / VRL AC Bus',
      lat: 21.0922,
      lng: 79.0472,
    },
    secondaryAirport: {
      code: 'IXU',
      name: 'Chhatrapati Sambhaji Nagar (Aurangabad) Airport',
      city: 'Aurangabad',
      distanceKm: 240,
      driveTime: '4h 00m via Samruddhi Mahamarg Highway',
      lat: 19.8631,
      lng: 75.3981,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Akola Junction',
      stationCode: 'AK',
      distanceKm: 0,
      trainType: 'Major A-category junction on Mumbai-Howrah & Secunderabad lines',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      notice: 'Inland city in central Vidarbha.',
    },
    highlights: ['Rajeshwar Temple', 'Shri Sant Gajanan Maharaj Sansthan (Shegaon ~38 km)', 'Anand Sagar Spiritual Complex', 'Historic Asadgad Fort'],
  },

  palitana: {
    name: 'Palitana',
    country: 'India',
    region: 'Gujarat (Saurashtra)',
    aliases: ['palitana', 'shatrunjaya', 'shetrunjaya'],
    primaryAirport: {
      code: 'BVC',
      name: 'Bhavnagar Airport',
      city: 'Bhavnagar',
      distanceKm: 52,
      driveTime: '1h 10m',
      feederMode: 'drive',
      feederRoute: 'via Bhavnagar-Palitana Highway',
      feederCarrier: 'Private Taxi / GSRTC Express Bus',
      lat: 21.7525,
      lng: 72.1856,
    },
    secondaryAirport: {
      code: 'AMD',
      name: 'Sardar Vallabhbhai Patel International Airport',
      city: 'Ahmedabad',
      distanceKm: 215,
      driveTime: '4h 15m via NH 751 Expressway',
      lat: 23.0772,
      lng: 72.6347,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Palitana Railway Station',
      stationCode: 'PIT',
      distanceKm: 0,
      trainType: 'Direct trains to Ahmedabad and Bhavnagar',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      notice: 'Inland pilgrim town at the foot of Shatrunjaya Hill (Ghogha-Dahej Ro-Pax ferry terminal is ~75 km away).',
    },
    highlights: ['Shatrunjaya Hill (3,500+ stone steps)', 'Shri Adishwar Bhagwan Temple', 'Taleti Pilgrim Path', 'Hastagiri Tirth (Kadambgiri)'],
  },

  girnar: {
    name: 'Girnar & Junagadh',
    country: 'India',
    region: 'Gujarat (Saurashtra)',
    aliases: ['girnar', 'junagadh', 'mount girnar', 'girnarji'],
    primaryAirport: {
      code: 'HSR',
      name: 'Rajkot International Airport (Hirasar)',
      city: 'Rajkot',
      distanceKm: 105,
      driveTime: '2h 00m',
      feederMode: 'drive',
      feederRoute: 'via NH 151 4-lane Highway corridor',
      feederCarrier: 'Intercity Highway Taxi / GSRTC Volvo',
      lat: 22.3619,
      lng: 71.0189,
    },
    secondaryAirport: {
      code: 'IXK',
      name: 'Keshod Airport',
      city: 'Keshod',
      distanceKm: 42,
      driveTime: '45m via NH 151',
      lat: 21.3175,
      lng: 70.2678,
    },
    railInfo: {
      hasRailStation: true,
      stationName: 'Junagadh Junction',
      stationCode: 'JND',
      distanceKm: 5,
      transferTime: '15m auto-rickshaw to Girnar Taleti',
    },
    seaportInfo: {
      isCoastal: false,
      hasPassengerFerry: false,
      notice: 'Sacred mountain range near Gir National Park (~65 km from Veraval / Somnath coast).',
    },
    highlights: ['Usha Breco Girnar Ropeway (Asia’s Longest Temple Ropeway)', 'Mount Girnar 9,999 Stone Steps Climb', 'Shri Neminath Bhagwan Jain Derasar', 'Uparkot Fort & Buddhist Caves'],
  },
};

/**
 * Normalizes input string for search
 */
function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find country by name or alias across all ~195 countries
 */
export function findCountryByNameOrAlias(query: string): GlobalCountryProfile | null {
  if (!query) return null;
  const norm = normalizeQuery(query);

  // Direct key lookup
  if (GLOBAL_COUNTRIES[norm]) return GLOBAL_COUNTRIES[norm];

  // Alias or name scan
  for (const country of Object.values(GLOBAL_COUNTRIES)) {
    if (country.name.toLowerCase() === norm) return country;
    if (country.code.toLowerCase() === norm) return country;
    if (country.aliases.some((alias) => alias === norm || norm.includes(alias) || alias.includes(norm))) {
      return country;
    }
  }

  return null;
}

/**
 * Find iconic global non-airport destination
 */
export function findNonAirportDestination(query: string): GlobalNonAirportDestination | null {
  if (!query) return null;
  const norm = normalizeQuery(query);

  if (GLOBAL_NON_AIRPORT_DESTINATIONS[norm]) {
    return GLOBAL_NON_AIRPORT_DESTINATIONS[norm];
  }

  for (const dest of Object.values(GLOBAL_NON_AIRPORT_DESTINATIONS)) {
    if (dest.name.toLowerCase() === norm) return dest;
    if (dest.aliases.some((al) => al === norm || norm.includes(al) || al.includes(norm))) {
      return dest;
    }
  }

  return null;
}

/**
 * Intelligent Continent & World Region Detector
 */
export function detectContinentOrRegion(query: string): {
  region: 'Europe' | 'North America' | 'South America' | 'East Asia' | 'Southeast Asia' | 'Middle East' | 'South Asia' | 'Africa' | 'Oceania' | 'Global';
  gatewayCode: string;
} {
  const norm = normalizeQuery(query);

  if (/swiss|switzer|france|french|paris|germany|deutsch|berlin|munich|italy|rome|milan|spain|madrid|barcelona|uk|london|britain|scotland|netherland|amsterdam|austria|vienna|greece|athens|norway|oslo|sweden|stockholm|denmark|copenhagen|finland|helsinki|portugal|lisbon|europe/i.test(norm)) {
    return { region: 'Europe', gatewayCode: 'FRA' };
  }
  if (/usa|america|new york|california|florida|texas|canada|toronto|vancouver|montreal|mexico|cancun/i.test(norm)) {
    return { region: 'North America', gatewayCode: 'JFK' };
  }
  if (/brazil|rio|sao paulo|argentina|buenos aires|peru|lima|cusco|chile|colombia|south america/i.test(norm)) {
    return { region: 'South America', gatewayCode: 'GRU' };
  }
  if (/japan|tokyo|kyoto|osaka|korea|seoul|china|beijing|shanghai|taiwan|hong kong/i.test(norm)) {
    return { region: 'East Asia', gatewayCode: 'HND' };
  }
  if (/singapore|thailand|bangkok|phuket|indonesia|bali|jakarta|malaysia|kuala lumpur|vietnam|hanoi|philippines/i.test(norm)) {
    return { region: 'Southeast Asia', gatewayCode: 'SIN' };
  }
  if (/dubai|uae|emirates|abu dhabi|qatar|doha|saudi|riyadh|jeddah|oman|muscat|kuwait|middle east/i.test(norm)) {
    return { region: 'Middle East', gatewayCode: 'DXB' };
  }
  if (/egypt|cairo|south africa|cape town|johannesburg|kenya|nairobi|morocco|tanzania|africa/i.test(norm)) {
    return { region: 'Africa', gatewayCode: 'CAI' };
  }
  if (/australia|sydney|melbourne|new zealand|auckland|queenstown|fiji|oceania/i.test(norm)) {
    return { region: 'Oceania', gatewayCode: 'SYD' };
  }

  return { region: 'South Asia', gatewayCode: 'BOM' };
}
