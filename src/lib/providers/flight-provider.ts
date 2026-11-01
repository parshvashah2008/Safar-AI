import { searchRealTimeFlights, LiveFlightOffer } from '../services/live-pricing-service';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
  currency?: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  aircraft?: string;
  originAirport: string;
  destinationAirport: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  durationFormatted: string;
  stops: number;
  stopDetails?: string;
  price: number;
  currency: string;
  formattedPrice: string;
  cabinClass: string;
  baggageAllowance: string;
  refundable: boolean;
  mealsIncluded: boolean;
  priceTrend: string;
  provider: 'safar_live_aggregator' | 'google_flights_direct' | 'amadeus_live';
  isEstimate: boolean;
  bookingUrl: string;
}

export interface FlightProviderAdapter {
  search(params: FlightSearchParams): Promise<FlightOffer[]>;
}

class RealTimeFlightAdapter implements FlightProviderAdapter {
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    const liveResults = searchRealTimeFlights({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.passengers,
      cabinClass: params.cabinClass || 'economy',
      currency: params.currency || 'INR',
    });

    return liveResults.map((item: LiveFlightOffer) => ({
      id: item.id,
      airline: item.airline,
      airlineCode: item.airlineCode,
      flightNumber: item.flightNumber,
      aircraft: item.aircraft,
      originAirport: `${item.originAirport.city} (${item.originAirport.code})`,
      destinationAirport: `${item.destinationAirport.city} (${item.destinationAirport.code})`,
      departureTime: item.departureTime,
      arrivalTime: item.arrivalTime,
      durationMinutes: item.durationMinutes,
      durationFormatted: item.duration,
      stops: item.stops,
      stopDetails: item.stopDetails,
      price: item.priceBreakdown.total,
      currency: item.priceBreakdown.currency,
      formattedPrice: item.priceBreakdown.formattedTotal,
      cabinClass: item.cabinClass,
      baggageAllowance: item.baggageAllowance,
      refundable: item.refundable,
      mealsIncluded: item.mealsIncluded,
      priceTrend: item.priceConfidenceText,
      provider: 'safar_live_aggregator',
      isEstimate: false,
      bookingUrl: item.bookingLinks.googleFlights,
    }));
  }
}

export const flightProvider: FlightProviderAdapter = new RealTimeFlightAdapter();
