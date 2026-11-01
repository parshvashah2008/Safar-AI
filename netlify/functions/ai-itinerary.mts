import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Provider cascade: Gemini (Live Generative AI) → Groq ───
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];
const GROQ_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

function createFallbackItinerary(destination: string, startDate: string, endDate: string) {
  const start = new Date(startDate || Date.now());
  const end = new Date(endDate || (Date.now() + 3 * 86400000));
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  const days = [];
  for (let i = 0; i < diffDays; i++) {
    const curDate = new Date(start.getTime() + i * 86400000);
    days.push({
      date: curDate.toISOString().split('T')[0],
      title: i === 0 ? `Arrival & Heritage Walk in ${destination}` : `Exploring the Best of ${destination}`,
      activities: [
        { time: '09:30 AM', title: 'Iconic Landmark Exploration', description: `Visit the central cultural landmark of ${destination}.`, estimated_cost: 300, duration_minutes: 120, category: 'sightseeing', place_name: `${destination} Heritage Center`, is_optional: false },
        { time: '01:00 PM', title: 'Authentic Regional Lunch', description: 'Savor culinary specialties at a well-regarded local cafe.', estimated_cost: 800, duration_minutes: 60, category: 'meal', place_name: 'Local Gourmet Spot', is_optional: false },
        { time: '04:30 PM', title: 'Artisanal Market & Cultural Discovery', description: 'Stroll through vibrant bazaar lanes or waterfront walkways.', estimated_cost: 500, duration_minutes: 90, category: 'shopping', place_name: `${destination} Central Quarter`, is_optional: true },
      ],
    });
  }
  return days;
}

function buildPrompt(
  destination: string,
  country: string,
  startDate: string,
  endDate: string,
  travelers: number,
  budget: number,
  interests: string[],
  currency: string,
  dietary?: string,
  accessibility?: string
) {
  return `You are SAFAR AI, an elite global travel planner with advanced linguistic and geographical intelligence.
TASK:
1. Destination Normalization & Typo Auto-Correction:
   - Check the destination: "${destination}".
   - Automatically correct any typos, informal phonetic spellings, or misspellings (e.g., "Sunderbans" -> "Sundarbans National Park, West Bengal", "Tokiyo" -> "Tokyo", "Benares / Banaras" -> "Varanasi", "Bengluru" -> "Bengaluru", "Amritsir" -> "Amritsar", "Pondy" -> "Puducherry", "Darjiling" -> "Darjeeling", etc.).
   - Set "corrected_destination" to the normalized, officially recognized destination name.
2. Dietary Strictness:
   - Dietary requirement specified: "${dietary || 'None specified'}".
   - If "veg food only", "vegetarian", "Jain", "vegan", or "halal" is specified, ALL meal activities MUST recommend authentic places serving this specific dietary requirement (e.g. for pure veg in Bengal/Sundarbans, recommend traditional Bengali vegetarian thali with shukto, luchi alur dom, and sweet mishti doi, never seafood/fish).
3. Realistic Day-by-Day Itinerary:
   - Country / Region: ${country || 'Auto-detect'}.
   - Dates: from ${startDate} to ${endDate}.
   - Travelers: ${travelers}.
   - Total Budget: ${currency} ${budget}.
   - Interests: ${interests.length ? interests.join(', ') : 'Culture, Food, Walkability, Nature'}.
   - Accessibility notes: "${accessibility || 'None specified'}".
   - Include authentic local places with realistic timings, costs in ${currency}, and real place names.
4. Conciseness for Real-Time Execution:
   - Provide 3-4 distinct activities per day.
   - Keep each description to 1-2 vivid, practical sentences with authentic insider advice.

Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "corrected_destination": "Proper Destination Name, Region",
  "trip_summary": "Two-sentence evocative summary of this journey",
  "total_estimated_cost": 45000,
  "days": [
    {
      "date": "YYYY-MM-DD",
      "title": "Creative evocative day title",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Specific activity name",
          "description": "Specific, practical description with authentic cultural or dining tips",
          "estimated_cost": 250,
          "duration_minutes": 90,
          "category": "sightseeing",
          "place_name": "Exact landmark/place name",
          "is_optional": false
        }
      ]
    }
  ]
}`;
}

async function tryGemini(geminiKey: string, prompt: string) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[Gemini API] Requesting live itinerary with ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        return { parsed, model: `gemini/${modelName}` };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Error on ${modelName}:`, err?.message || err);
      continue;
    }
  }
  return null;
}

async function tryGroq(groqKey: string, prompt: string) {
  for (const modelName of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: 'You are SAFAR AI, an elite global travel planner. You MUST respond ONLY with valid JSON matching the requested schema. No markdown, no code fences, no explanation — just pure JSON.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 4096,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return { parsed, model: `groq/${modelName}` };
      }
      continue;
    } catch (err: any) {
      console.warn(`Groq ${modelName} itinerary error:`, err.message?.slice(0, 100));
      continue;
    }
  }
  return null;
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const {
      destination,
      country = '',
      startDate,
      endDate,
      travelers = 1,
      budget = 50000,
      interests = [],
      currency = 'INR',
      dietary = '',
      accessibility = '',
    } = body;

    if (!destination) {
      return new Response(JSON.stringify({ error: 'Destination is required' }), { status: 400 });
    }

    const geminiKey =
      req.headers.get('x-gemini-key') ||
      body.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY || '';
    const groqKey =
      req.headers.get('x-groq-key') ||
      body.groqApiKey ||
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY || '';
    const prompt = buildPrompt(
      destination,
      country,
      startDate,
      endDate,
      travelers,
      budget,
      interests,
      currency,
      dietary,
      accessibility
    );

    // 1. Try Gemini
    if (geminiKey) {
      const result = await tryGemini(geminiKey, prompt);
      if (result) {
        return new Response(
          JSON.stringify({
            corrected_destination: result.parsed.corrected_destination || destination,
            days: result.parsed.days,
            trip_summary: result.parsed.trip_summary || `Curated itinerary for ${destination}`,
            total_estimated_cost: result.parsed.total_estimated_cost || budget,
            source: 'gemini',
            model: result.model,
            live: true,
            generated_at: new Date().toISOString(),
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Fallback to Groq (live AI)
    if (groqKey) {
      const result = await tryGroq(groqKey, prompt);
      if (result) {
        return new Response(
          JSON.stringify({
            corrected_destination: result.parsed.corrected_destination || destination,
            days: result.parsed.days,
            trip_summary: result.parsed.trip_summary || `AI-curated itinerary for ${destination}`,
            total_estimated_cost: result.parsed.total_estimated_cost || budget,
            source: 'groq',
            model: result.model,
            live: true,
            generated_at: new Date().toISOString(),
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Static fallback
    const fallbackDays = createFallbackItinerary(destination, startDate, endDate);
    return new Response(
      JSON.stringify({
        corrected_destination: destination,
        days: fallbackDays,
        trip_summary: `Starter itinerary for ${destination}. AI providers are temporarily unavailable.`,
        total_estimated_cost: budget,
        source: 'fallback',
        live: false,
        generated_at: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Itinerary generation error' }), { status: 500 });
  }
};
