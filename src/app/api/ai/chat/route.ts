import { NextRequest, NextResponse } from 'next/server';
import { askCopilot } from '@/lib/ai/gemini';
import { getAppConfig } from '@/lib/config';
import { resolveCountry } from '@/lib/services/transit-routing';

async function askGroq(message: string, context?: any, customKey?: string): Promise<string> {
  const groqKey = customKey || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  if (!groqKey) throw new Error('No Groq key available');

  const systemPrompt = `You are SAFAR Copilot, an elite editorial travel concierge and personal itinerary designer for the SAFAR AI platform.
Tone & Style:
- Warm, sophisticated, highly visual, and curated — like an editorial travel director from Condé Nast Traveler or Monocle.
- Impeccably structured, clean, and eyecatching presentation.

Critical Rules:
1. Budget Feasibility & "PAISA KAMAO" Rule:
   If the user proposes an impossible or unrealistically low budget for a destination (for example: Surat to USA on ₹10,000 or ₹20,000, Europe on ₹15,000, or 7 days in London for $100), you MUST start your response with:
   **insufficient money funds (PAISA KAMAO) 💸**
   Followed by an honest, constructive reality check explaining the real baseline costs (international flights, visas, accommodation, daily food) and the minimum realistic budget required.

2. Transit Intelligence & Multi-Modal Routing:
   When users ask how to get from city A to B (e.g. "Surat to USA", "New York to Paris", "Delhi to Tokyo"):
   - Explicitly guide them on the exact transit route!
   - For Tier-2 / regional origins without direct international flights (e.g. Surat), tell them: "Take the Vande Bharat Express or cab from Surat to Mumbai (BOM) Airport (2h 45m), then board a direct or 1-stop international flight from Mumbai to USA."
   - For same-city queries (e.g. "New York to New York", "London to London"): Never suggest traveling to Delhi or another country! Treat it as a bespoke same-city staycation, layover, or local district crawl with subway, ferry, and walking routes.

3. Formatting Guidelines:
   - Use bold descriptive headings with relevant icons (e.g. "### 🛫 TRANSIT ROUTE & FLIGHTS", "### 🏛️ DAY 1 · Local Immersion", "### 💰 HONEST BUDGET ALLOCATION").
   - Tables: | Leg / Time | Carrier / Option | Est. Cost | Pacing & Insight |.
   - Insider Callouts:
     > 💡 **Insider Tip:** [Hidden gem or timing secret]
     > 🧭 **Pacing Insight:** [Transit buffer or rest advice]`;

  let prompt = message;
  if (context?.activeTrip) {
    prompt = `[Trip Context: Destination ${context.activeTrip.destination}, Dates ${context.activeTrip.startDate} to ${context.activeTrip.endDate}, Budget ${context.activeTrip.currency} ${context.activeTrip.budget}]\nUser Query: ${message}`;
  }

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
      temperature: 0.6,
      max_tokens: 1600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('No content from Groq');
  return reply;
}

async function askOpenAI(message: string, openAIKey: string, context?: any): Promise<string> {
  const systemPrompt = `You are SAFAR Copilot, an elite editorial travel concierge.
Rule 1: If budget is insufficient for destination (e.g. Surat to USA on ₹20,000), respond with: **insufficient money funds (PAISA KAMAO) 💸** and breakdown the real costs.
Rule 2: For Tier-2 cities (e.g. Surat to USA), advise taking high-speed train/flight to nearest hub (Mumbai BOM) then international flight.
Rule 3: If origin and destination are the same (e.g. New York to New York), do not route outside; provide a local NYC staycation.`;

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
        { role: 'user', content: message },
      ],
      temperature: 0.6,
      max_tokens: 1600,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function extractTripDetails(userMessage: string, aiReply: string) {
  const daysMatch =
    userMessage.match(/(\d+)\s*[- ]*(?:day|days|night|nights)/i) ||
    aiReply.match(/(\d+)\s*[- ]*(?:day|days|night|nights)/i);
  const daysCount = daysMatch ? Math.max(1, Math.min(30, parseInt(daysMatch[1], 10))) : 3;

  let budget = 35000;
  let currency = 'INR';
  const budgetMatch =
    userMessage.match(/(?:₹|rs\.?|inr|\$|usd|€|eur)\s*([\d,]+)/i) ||
    userMessage.match(/budget\s*(?:of|is|:)?\s*(?:₹|rs\.?|inr|\$|usd|€|eur)?\s*([\d,]+)/i);
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 500) budget = num;
  }

  const knownPlaces: Record<string, { dest: string; country: string }> = {
    'new york': { dest: 'New York City', country: 'United States' },
    nyc: { dest: 'New York City', country: 'United States' },
    usa: { dest: 'United States', country: 'United States' },
    'united states': { dest: 'United States', country: 'United States' },
    california: { dest: 'California', country: 'United States' },
    'san francisco': { dest: 'San Francisco', country: 'United States' },
    delhi: { dest: 'Delhi', country: 'India' },
    'new delhi': { dest: 'New Delhi', country: 'India' },
    surat: { dest: 'Surat', country: 'India' },
    mumbai: { dest: 'Mumbai', country: 'India' },
    jaipur: { dest: 'Jaipur', country: 'India' },
    manali: { dest: 'Manali, Himachal Pradesh', country: 'India' },
    paris: { dest: 'Paris', country: 'France' },
    tokyo: { dest: 'Tokyo', country: 'Japan' },
    kyoto: { dest: 'Kyoto', country: 'Japan' },
    london: { dest: 'London', country: 'United Kingdom' },
    dubai: { dest: 'Dubai', country: 'United Arab Emirates' },
    singapore: { dest: 'Singapore', country: 'Singapore' },
    bali: { dest: 'Bali', country: 'Indonesia' },
    bangkok: { dest: 'Bangkok', country: 'Thailand' },
    switzerland: { dest: 'Zermatt, Switzerland', country: 'Switzerland' },
    rome: { dest: 'Rome', country: 'Italy' },
    amalfi: { dest: 'Amalfi Coast', country: 'Italy' },
  };

  let destination = '';
  let country = 'India';

  const lowerUser = userMessage.toLowerCase();
  for (const [key, val] of Object.entries(knownPlaces)) {
    if (lowerUser.includes(key)) {
      destination = val.dest;
      country = val.country;
      break;
    }
  }

  if (!destination) {
    // Check if user specified a destination format
    const match = userMessage.match(/(?:trip to|travel to|visit|explore|in|for)\s+([A-Za-z\s]+?)(?:[.,?!]|$)/i);
    if (match && match[1]) {
      destination = match[1].trim();
      country = resolveCountry(destination);
    }
  }

  return {
    destination: destination || undefined,
    country,
    daysCount,
    budget,
    currency,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const customGeminiKey = req.headers.get('x-gemini-key');
    const customOpenAIKey = req.headers.get('x-openai-key');
    const customGroqKey = req.headers.get('x-groq-key');

    if (customGeminiKey && customGeminiKey.trim().length > 10) {
      process.env.GEMINI_API_KEY = customGeminiKey.trim();
    }

    // 1. Try Custom OpenAI if provided
    if (customOpenAIKey && customOpenAIKey.trim().length > 10) {
      try {
        const reply = await askOpenAI(message, customOpenAIKey.trim(), context);
        const detectedTrip = extractTripDetails(message, reply);
        return NextResponse.json({
          reply,
          source: 'openai',
          model: 'gpt-4o-mini',
          detectedTrip: detectedTrip.destination ? detectedTrip : undefined,
        });
      } catch (openAiErr) {
        console.warn('Custom OpenAI chat failed, proceeding to Gemini/Groq:', openAiErr);
      }
    }

    // 2. Try Gemini
    const config = getAppConfig();
    if (config.geminiConfigured) {
      try {
        const reply = await askCopilot({
          message,
          context,
        });

        const detectedTrip = extractTripDetails(message, reply);
        return NextResponse.json({
          reply,
          source: 'gemini',
          model: 'gemini-3.5-flash',
          detectedTrip: detectedTrip.destination ? detectedTrip : undefined,
        });
      } catch (geminiErr: any) {
        console.warn('Gemini chat failed, failing over to Groq:', geminiErr?.message);
      }
    }

    // 3. Fallback to Groq
    try {
      const reply = await askGroq(message, context, customGroqKey || undefined);
      const detectedTrip = extractTripDetails(message, reply);
      return NextResponse.json({
        reply,
        source: 'groq',
        model: 'llama-3.1-8b-instant',
        detectedTrip: detectedTrip.destination ? detectedTrip : undefined,
      });
    } catch (groqErr: any) {
      console.error('All AI chat providers failed:', groqErr?.message);
      return NextResponse.json(
        {
          error: 'AI assistant temporarily unavailable. Please verify your API keys in Settings.',
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
