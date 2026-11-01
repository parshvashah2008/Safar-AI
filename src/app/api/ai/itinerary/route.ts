import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/ai/gemini';
import { getAppConfig } from '@/lib/config';
import {
  parseRouteInput,
  analyzeTransitRoute,
  validateBudgetFeasibility,
  resolveCountry,
} from '@/lib/services/transit-routing';

async function generateItineraryWithGroq(input: any, apiKey?: string): Promise<any> {
  const groqKey = apiKey || process.env.GROQ_API_KEY;
  if (!groqKey || groqKey.trim().length < 10) throw new Error('No valid Groq key available');

  const isSameDay = input.startDate === input.endDate;

  const systemPrompt = `You are SafarAI, an elite personal travel agent and itinerary curator.
Output STRICT valid JSON only with keys:
- "corrected_destination": (string) Destination name
- "trip_summary": (string) Brief 2-sentence evocative description
- "transit_advice": (string) Specific flight, train, or local transit directions from origin to destination
- "days": array of objects:
  - "date": string (YYYY-MM-DD)
  - "title": string (e.g. "Day 1: Arrival & Sunset Stupa")
  - "activities": array of objects:
    - "time": string (e.g. "09:00 AM")
    - "title": string (MUST be specific, real authentic place or experience)
    - "description": string (specific details, local dishes, or viewpoints)
    - "estimated_cost": number (in ${input.currency})
    - "duration_minutes": number
    - "category": enum ("sightseeing" | "meal" | "activity" | "accommodation" | "transport" | "shopping" | "rest")
    - "place_name": string (real specific location)
    - "latitude": number (exact GPS latitude of place)
    - "longitude": number (exact GPS longitude of place)
    - "is_optional": boolean

Rules:
1. Destination Integrity: If destination is "${input.destination}", stick STRICTLY to ${input.destination}, ${input.country}. NEVER substitute another city (e.g. never substitute New York with Delhi or anything else).
2. Same-Day Pacing: ${
    isSameDay
      ? 'Departure and arrival are on the SAME DAY. Create a tightly paced 1-day urban exploration or layover tour from 08:30 AM to 09:30 PM. No multi-day hotel reservations.'
      : 'Standard multi-day progression with balanced morning, afternoon, and evening pacing.'
  }
3. Dietary strictness: If dietary is specified (${input.dietary || 'none'}), all meals must adhere to it strictly.
4. Realistic costs in ${input.currency}.
5. Provide exact real-world GPS coordinates ("latitude" and "longitude" as numbers) for each location for internal map grounding. NEVER write raw coordinate numbers, degrees, or GPS strings in the activity 'title' or 'description' text — keep descriptions descriptive, clean, and evocative for human travelers.
6. Strict 12-Hour Clock: Each activity time MUST use standard 12-hour format with AM or PM (e.g. '09:00 AM', '01:30 PM', '07:45 PM'). NEVER output 24-hour time.`;

  const prompt = `Create a realistic itinerary from ${input.startDate} to ${input.endDate} for ${input.destination}, ${input.country}.
Origin: ${input.origin || input.destination}.
Travelers: ${input.travelers}.
Total planned budget: ${input.currency} ${input.budget}.
Interests: ${Array.isArray(input.interests) ? input.interests.join(', ') : input.interests}.
Dietary requirements: ${input.dietary || 'None specified'}.
Accessibility notes: ${input.accessibility || 'None specified'}.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq itinerary error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    source: 'groq',
    model: 'llama-3.1-8b-instant',
    days: parsed.days,
    corrected_destination: parsed.corrected_destination || input.destination,
    trip_summary: parsed.trip_summary,
    transit_advice: parsed.transit_advice,
  };
}

async function generateItineraryWithOpenAI(input: any, openAIKey: string): Promise<any> {
  const isSameDay = input.startDate === input.endDate;

  const systemPrompt = `You are SafarAI, an elite personal travel agent and itinerary curator.
Output STRICT valid JSON only with keys: "corrected_destination", "trip_summary", "transit_advice", "days" (array of { "date", "title", "activities": [{ "time", "title", "description", "estimated_cost", "duration_minutes", "category", "place_name", "latitude", "longitude", "is_optional" }] }).
Destination must strictly be ${input.destination}, ${input.country}.
${isSameDay ? 'Same-day schedule from 08:30 AM to 09:30 PM.' : ''}`;

  const prompt = `Create an itinerary from ${input.startDate} to ${input.endDate} for ${input.destination}, ${input.country}.
Origin: ${input.origin || input.destination}.
Travelers: ${input.travelers}. Budget: ${input.currency} ${input.budget}. Interests: ${Array.isArray(input.interests) ? input.interests.join(', ') : input.interests}.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    source: 'openai',
    model: 'gpt-4o-mini',
    days: parsed.days,
    corrected_destination: parsed.corrected_destination || input.destination,
    trip_summary: parsed.trip_summary,
    transit_advice: parsed.transit_advice,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destination: rawDestination,
      origin: rawOrigin,
      startDate,
      endDate,
      travelers,
      budget,
      currency,
      interests,
      dietary,
      accessibility,
    } = body;

    if (!rawDestination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, startDate, and endDate are mandatory.' },
        { status: 400 }
      );
    }

    // 1. Parse route cleanly (e.g. "Surat to USA", "New York to New York")
    const { origin, destination } = parseRouteInput(rawDestination, rawOrigin);
    const resolvedCountry = resolveCountry(destination);
    const transitAnalysis = analyzeTransitRoute(origin, destination);

    // Calculate days between start and end
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // 2. Proactive Budget Guardian Check
    const budgetCheck = validateBudgetFeasibility({
      budget: Number(budget) || 30000,
      currency: currency || 'INR',
      origin,
      destination,
      days: diffDays,
      travelers: Number(travelers) || 1,
    });

    if (!budgetCheck.isPossible) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_FUNDS',
          replyMessage: budgetCheck.replyMessage,
          reason: budgetCheck.reason,
          minimumRequired: budgetCheck.minimumRequired,
          formattedMinimum: budgetCheck.formattedMinimum,
        },
        { status: 422 }
      );
    }

    // Read custom user keys from headers if passed
    const geminiKey = req.headers.get('x-gemini-key');
    const openaiKey = req.headers.get('x-openai-key');
    const groqKey = req.headers.get('x-groq-key');

    if (geminiKey && geminiKey.trim().length > 10) {
      process.env.GEMINI_API_KEY = geminiKey.trim();
    }

    // 3. Try OpenAI if key provided
    if (openaiKey && openaiKey.trim().length > 10) {
      try {
        const result = await generateItineraryWithOpenAI(
          {
            origin,
            destination,
            country: resolvedCountry,
            startDate,
            endDate,
            travelers: Number(travelers) || 1,
            budget: Number(budget) || 30000,
            currency: currency || 'INR',
            interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Heritage', 'Local Culture'],
            dietary,
            accessibility,
          },
          openaiKey.trim()
        );
        return NextResponse.json({
          ...result,
          transitLegs: transitAnalysis.transitLegs,
          transitSummary: transitAnalysis.summaryNote,
        });
      } catch (openAiErr) {
        console.warn('Custom OpenAI itinerary call failed, proceeding to Gemini/Groq:', openAiErr);
      }
    }

    // 4. Try Gemini
    const config = getAppConfig();
    if (config.geminiConfigured) {
      try {
        const result = await generateItinerary({
          destination,
          country: resolvedCountry,
          startDate,
          endDate,
          travelers: Number(travelers) || 1,
          budget: Number(budget) || 30000,
          currency: currency || 'INR',
          interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Heritage', 'Local Culture'],
          dietary: dietary || undefined,
          accessibility: accessibility || undefined,
        });

        if (result.days && result.days.length > 0) {
          return NextResponse.json({
            source: 'gemini',
            model: 'gemini-3.5-flash',
            days: result.days,
            corrected_destination: result.corrected_destination || destination,
            trip_summary: result.trip_summary,
            transitLegs: transitAnalysis.transitLegs,
            transitSummary: transitAnalysis.summaryNote,
          });
        }
      } catch (aiErr: any) {
        console.warn('Gemini API call failed, attempting Groq fallback:', aiErr?.message);
      }
    }

    // 5. Try Groq (high-speed fallback with real authentic spots)
    try {
      const groqResult = await generateItineraryWithGroq(
        {
          origin,
          destination,
          country: resolvedCountry,
          startDate,
          endDate,
          travelers: Number(travelers) || 1,
          budget: Number(budget) || 30000,
          currency: currency || 'INR',
          interests: Array.isArray(interests) && interests.length > 0 ? interests : ['Heritage', 'Local Culture'],
          dietary: dietary || undefined,
          accessibility: accessibility || undefined,
        },
        groqKey || undefined
      );

      if (groqResult.days && groqResult.days.length > 0) {
        return NextResponse.json({
          ...groqResult,
          transitLegs: transitAnalysis.transitLegs,
          transitSummary: transitAnalysis.summaryNote,
        });
      }
    } catch (groqErr: any) {
      console.warn('Groq itinerary generation failed:', groqErr?.message);
    }

    return NextResponse.json(
      { error: 'Live AI generation failed. Could not reach upstream AI servers. Please verify API keys in Settings.' },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Itinerary generation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
