import { NextRequest, NextResponse } from 'next/server';
import { searchRealTimeFlights } from '@/lib/services/live-pricing-service';
import { fetchLiveExchangeRates } from '@/lib/services/currency-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || 'DEL';
    const destination = searchParams.get('destination') || 'JFK';
    const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
    const returnDate = searchParams.get('returnDate') || undefined;
    const passengers = Number(searchParams.get('passengers')) || 1;
    const cabinClass = (searchParams.get('cabinClass') as any) || 'economy';
    const currency = searchParams.get('currency') || 'INR';

    const ratesData = await fetchLiveExchangeRates().catch(() => ({ rates: { USD: 1, INR: 86.45 }, lastUpdated: '', isLive: false }));

    const flights = searchRealTimeFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass,
      currency,
      liveRates: ratesData.rates,
    });

    return NextResponse.json({
      success: true,
      query: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
        currency,
      },
      exchangeRateTimestamp: ratesData.lastUpdated,
      resultsCount: flights.length,
      offers: flights,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to search real-time flight offers',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ratesData = await fetchLiveExchangeRates().catch(() => ({ rates: { USD: 1, INR: 86.45 }, lastUpdated: '', isLive: false }));

    const flights = searchRealTimeFlights({
      origin: body.origin || 'DEL',
      destination: body.destination || 'JFK',
      departureDate: body.departureDate || new Date().toISOString().split('T')[0],
      returnDate: body.returnDate,
      passengers: Number(body.passengers) || 1,
      cabinClass: body.cabinClass || 'economy',
      currency: body.currency || 'INR',
      liveRates: ratesData.rates,
    });

    return NextResponse.json({
      success: true,
      offers: flights,
      resultsCount: flights.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process flight search request',
      },
      { status: 500 }
    );
  }
}
