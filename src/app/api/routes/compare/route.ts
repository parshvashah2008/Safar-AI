import { NextRequest, NextResponse } from 'next/server';
import { compareRoutesWithGemini } from '@/lib/services/gemini-route-service';
import { fetchLiveExchangeRates } from '@/lib/services/currency-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customGeminiKey = request.headers.get('x-gemini-key') || undefined;

    const ratesData = await fetchLiveExchangeRates().catch(() => ({
      rates: { USD: 1, INR: 86.45, EUR: 0.94, GBP: 0.81 },
      lastUpdated: '',
      isLive: false,
    }));

    const result = await compareRoutesWithGemini({
      origin: body.origin || 'Surat',
      destination: body.destination || 'USA',
      departureDate: body.departureDate,
      travelers: Number(body.travelers) || 1,
      budget: Number(body.budget) || 50000,
      currency: body.currency || 'INR',
      customGeminiKey,
      liveRates: ratesData.rates,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to compare routes with Gemini',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || 'Surat';
    const destination = searchParams.get('destination') || 'USA';
    const currency = searchParams.get('currency') || 'INR';
    const travelers = Number(searchParams.get('travelers')) || 1;
    const budget = Number(searchParams.get('budget')) || 50000;
    const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];

    const result = await compareRoutesWithGemini({
      origin,
      destination,
      departureDate,
      travelers,
      budget,
      currency,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve route comparison',
      },
      { status: 500 }
    );
  }
}
