import {
  searchRealTimeFlights,
  searchRealTimeTrains,
  searchRealTimeHotels,
  searchRealTimeDining,
  LiveFlightOffer,
  LiveTrainOffer,
  LiveHotelOffer,
  LiveDiningOffer,
} from './live-pricing-service';

export interface FreeBookingLink {
  providerName: string;
  providerLogo?: string;
  badge: 'Free API' | 'Official Zero-Markup' | 'Live Direct';
  actionUrl: string;
  title: string;
  subtitle: string;
  estimatedPrice?: string;
}

export interface TrainOption {
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  classes: string[];
  estimatedFare: string;
  bookingLinks: FreeBookingLink[];
}

export interface FlightOption {
  airline: string;
  flightCode: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabin: string;
  estimatedPrice: string;
  priceTrend?: string;
  baggageAllowance?: string;
  refundable?: boolean;
  bookingLinks: FreeBookingLink[];
}

export interface HotelOption {
  name: string;
  rating: number;
  location: string;
  pricePerNight: string;
  perks: string[];
  roomType?: string;
  bookingLinks: FreeBookingLink[];
}

export interface RestaurantOption {
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  timings: string;
  mustTry: string;
  bookingLinks: FreeBookingLink[];
}

// -------------------------------------------------------------
// Free Search Engine & Deep Link Generator
// -------------------------------------------------------------

export function getTrainBookingLinks(origin: string, destination: string, date?: string): FreeBookingLink[] {
  const originClean = encodeURIComponent(origin.trim());
  const destClean = encodeURIComponent(destination.trim());

  return [
    {
      providerName: 'IRCTC Official',
      badge: 'Official Zero-Markup',
      title: 'IRCTC e-Ticketing System',
      subtitle: 'Official Indian Railways portal — book with zero middleman surcharge',
      actionUrl: `https://www.irctc.co.in/nget/train-search`,
    },
    {
      providerName: 'ConfirmTkt Live',
      badge: 'Free API',
      title: 'ConfirmTkt PNR & Seat Prediction',
      subtitle: 'Real-time waitlist confirmation prediction & alternate train routes',
      actionUrl: `https://www.confirmtkt.com/rbooking-d/trains/from/${originClean}/to/${destClean}`,
    },
    {
      providerName: 'RailYatri',
      badge: 'Free API',
      title: 'RailYatri Live Running & Booking',
      subtitle: 'Live GPS train status, platform locators & Tatkal alerts',
      actionUrl: `https://www.railyatri.in/trains-between-stations?from=${originClean}&to=${destClean}`,
    },
  ];
}

export function getFlightBookingLinks(origin: string, destination: string, departureDate?: string, currency: string = 'INR'): FreeBookingLink[] {
  const o = encodeURIComponent(origin.trim());
  const d = encodeURIComponent(destination.trim());
  const dateStr = departureDate || new Date().toISOString().split('T')[0];

  return [
    {
      providerName: 'Google Flights',
      badge: 'Official Zero-Markup',
      title: 'Google Flights Direct Metasearch',
      subtitle: 'Track price trends, price guarantee, and direct airline checkout',
      actionUrl: `https://www.google.com/travel/flights?q=Flights%20from%20${o}%20to%20${d}%20on%20${dateStr}&curr=${currency}`,
    },
    {
      providerName: 'Skyscanner Open Search',
      badge: 'Free API',
      title: 'Skyscanner Global Comparisons',
      subtitle: 'Free aggregator comparing 1,200+ budget & premium airlines',
      actionUrl: `https://www.skyscanner.com/transport/flights/${o}/${d}/${dateStr}/`,
    },
    {
      providerName: 'Kayak Live Flights',
      badge: 'Live Direct',
      title: 'Kayak Fare Matrix & Alerts',
      subtitle: 'Live airline seat maps, multi-city fare comparisons & baggage calculators',
      actionUrl: `https://www.kayak.com/flights/${o}-${d}/${dateStr}?sort=bestflight_a`,
    },
  ];
}

export function getHotelBookingLinks(destination: string, checkIn?: string, checkOut?: string): FreeBookingLink[] {
  const destClean = encodeURIComponent(destination.trim());

  return [
    {
      providerName: 'Google Hotels',
      badge: 'Official Zero-Markup',
      title: 'Google Hotels Map Search',
      subtitle: 'Compare direct rates from hotel websites vs OTAs with real guest reviews',
      actionUrl: `https://www.google.com/travel/hotels?q=Hotels%20in%20${destClean}`,
    },
    {
      providerName: 'Booking.com',
      badge: 'Live Direct',
      title: 'Booking.com Free Cancellation Stays',
      subtitle: 'Genius discounts, book now pay later, and verified guest photos',
      actionUrl: `https://www.booking.com/searchresults.html?ss=${destClean}`,
    },
    {
      providerName: 'Agoda Stays',
      badge: 'Free API',
      title: 'Agoda Insider Deals',
      subtitle: 'Secret prices on boutique havelis, luxury resorts, and homestays',
      actionUrl: `https://www.agoda.com/search?city=${destClean}`,
    },
  ];
}

export function getRestaurantBookingLinks(destination: string, query?: string): FreeBookingLink[] {
  const search = encodeURIComponent(`${query ? query + ' ' : ''}${destination.trim()}`);

  return [
    {
      providerName: 'OpenTable',
      badge: 'Free API',
      title: 'OpenTable Instant Table Reservation',
      subtitle: 'Free instant table bookings with points & confirmed dining slots',
      actionUrl: `https://www.opentable.com/s?term=${search}`,
    },
    {
      providerName: 'Google Maps Dining',
      badge: 'Official Zero-Markup',
      title: 'Google Maps Menus & Reserve',
      subtitle: 'Verified local reviews, real-time wait times, menus, and table reserve links',
      actionUrl: `https://www.google.com/maps/search/${search}+restaurants`,
    },
    {
      providerName: 'Zomato & Swiggy Dineout',
      badge: 'Live Direct',
      title: 'Zomato Dining & Table Booking',
      subtitle: 'Dining discounts up to 30% off, verified photos, and curated menus',
      actionUrl: `https://www.zomato.com/search?q=${search}`,
    },
  ];
}

// -------------------------------------------------------------
// Curated Real-Time Travel Search Helpers
// -------------------------------------------------------------

export function getCuratedTrains(
  destination: string,
  origin: string = 'New Delhi',
  date?: string,
  currency: string = 'INR',
  rates?: Record<string, number>
): TrainOption[] {
  const liveTrains: LiveTrainOffer[] = searchRealTimeTrains(
    origin || 'New Delhi',
    destination || 'Jaipur',
    date || new Date().toISOString().split('T')[0],
    currency,
    rates
  );

  return liveTrains.map((t) => ({
    trainNumber: t.trainNumber,
    trainName: t.trainName,
    origin: t.originStation,
    destination: t.destStation,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    duration: t.duration,
    classes: t.classes.map((c) => `${c.code} (${c.formattedPrice})`),
    estimatedFare: `${t.classes[0]?.formattedPrice || '₹850'} - ${t.classes[t.classes.length - 1]?.formattedPrice || '₹2,400'}`,
    bookingLinks: [
      {
        providerName: 'IRCTC Official',
        badge: 'Official Zero-Markup',
        title: 'Book on IRCTC (Zero Fee)',
        subtitle: 'Indian Railways official ticketing engine',
        actionUrl: t.bookingLinks.irctc,
      },
      {
        providerName: 'ConfirmTkt Live',
        badge: 'Free API',
        title: 'Live Seat Availability & PNR',
        subtitle: 'Waitlist confirmation probability & Tatkal alerts',
        actionUrl: t.bookingLinks.confirmTkt,
      },
    ],
  }));
}

export function getCuratedFlights(
  destination: string,
  origin: string = 'DEL',
  departureDate?: string,
  passengers: number = 1,
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first' = 'economy',
  currency: string = 'INR',
  rates?: Record<string, number>
): FlightOption[] {
  const liveOffers: LiveFlightOffer[] = searchRealTimeFlights({
    origin: origin || 'DEL',
    destination: destination || 'JFK',
    departureDate: departureDate || new Date().toISOString().split('T')[0],
    passengers: passengers || 1,
    cabinClass,
    currency,
    liveRates: rates,
  });

  return liveOffers.map((f) => ({
    airline: f.airline,
    flightCode: f.flightNumber,
    origin: `${f.originAirport.city} (${f.originAirport.code})`,
    destination: `${f.destinationAirport.city} (${f.destinationAirport.code})`,
    departureTime: f.departureTime,
    arrivalTime: f.arrivalTime,
    duration: f.duration,
    cabin: f.cabinClass === 'economy' ? 'Economy' : f.cabinClass === 'business' ? 'Business Class' : 'Premium',
    estimatedPrice: f.priceBreakdown.formattedTotal,
    priceTrend: f.priceConfidenceText,
    baggageAllowance: f.baggageAllowance,
    refundable: f.refundable,
    bookingLinks: [
      {
        providerName: 'Google Flights',
        badge: 'Official Zero-Markup',
        title: 'Book via Google Flights (Zero Fee)',
        subtitle: 'Direct airline checkout with price trend guarantee',
        actionUrl: f.bookingLinks.googleFlights,
      },
      {
        providerName: 'Skyscanner Live',
        badge: 'Free API',
        title: 'Compare on Skyscanner',
        subtitle: 'Live fares across 1,200+ global OTAs and airlines',
        actionUrl: f.bookingLinks.skyscanner,
      },
      {
        providerName: 'Kayak Matrix',
        badge: 'Live Direct',
        title: 'Direct Airline Checkout',
        subtitle: 'Seat maps, flexible fare dates & cancellation terms',
        actionUrl: f.bookingLinks.kayak,
      },
    ],
  }));
}

export function getCuratedHotels(
  destination: string,
  checkIn?: string,
  currency: string = 'INR',
  rates?: Record<string, number>
): HotelOption[] {
  const liveHotels: LiveHotelOffer[] = searchRealTimeHotels(
    destination || 'Jaipur',
    checkIn || new Date().toISOString().split('T')[0],
    undefined,
    currency,
    rates
  );

  return liveHotels.map((h) => ({
    name: h.name,
    rating: h.rating,
    location: h.location,
    pricePerNight: h.formattedNightlyRate,
    perks: h.perks,
    roomType: h.roomType,
    bookingLinks: [
      {
        providerName: 'Google Hotels',
        badge: 'Official Zero-Markup',
        title: 'View Direct Hotel Rates',
        subtitle: 'Official hotel rates vs OTA aggregator comparison',
        actionUrl: h.bookingLinks.googleHotels,
      },
      {
        providerName: 'Booking.com',
        badge: 'Live Direct',
        title: 'Booking.com Deals',
        subtitle: 'Genius discounts with zero cancellation fee',
        actionUrl: h.bookingLinks.bookingCom,
      },
      {
        providerName: 'Agoda Stays',
        badge: 'Free API',
        title: 'Agoda Insider Stays',
        subtitle: 'Member-only secret discounts and mobile rates',
        actionUrl: h.bookingLinks.agoda,
      },
    ],
  }));
}

export function getCuratedRestaurants(
  destination: string,
  currency: string = 'INR',
  rates?: Record<string, number>
): RestaurantOption[] {
  const liveDining: LiveDiningOffer[] = searchRealTimeDining(
    destination || 'Jaipur',
    currency,
    rates
  );

  return liveDining.map((r) => ({
    name: r.name,
    cuisine: r.cuisine,
    priceRange: r.formattedCostPerPerson,
    rating: r.rating,
    timings: r.timings,
    mustTry: r.mustTryDish,
    bookingLinks: [
      {
        providerName: 'OpenTable',
        badge: 'Free API',
        title: 'Reserve Table (Free)',
        subtitle: 'Instant table confirmation with loyalty points',
        actionUrl: r.bookingLinks.openTable,
      },
      {
        providerName: 'Google Dining',
        badge: 'Official Zero-Markup',
        title: 'Google Maps Menu & Wait Times',
        subtitle: 'Verified local diner photos, real menus & reviews',
        actionUrl: r.bookingLinks.googleDining,
      },
      {
        providerName: 'Zomato Dining',
        badge: 'Live Direct',
        title: 'Zomato Table & Discounts',
        subtitle: 'Up to 25% dining discount & table hold',
        actionUrl: r.bookingLinks.zomato,
      },
    ],
  }));
}
