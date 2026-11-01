import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { requireGeminiKey, getGeminiModel } from '@/lib/config';
import type { AIItineraryDay, AIDestinationSuggestion } from '@/types';

let currentKey = '';
let genAIClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const key = requireGeminiKey();
  if (!genAIClient || currentKey !== key) {
    currentKey = key;
    genAIClient = new GoogleGenerativeAI(key);
  }
  return genAIClient;
}

export interface GenerateItineraryInput {
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests: string[];
  dietary?: string;
  accessibility?: string;
}

export interface GenerateItineraryResult {
  days: AIItineraryDay[];
  corrected_destination?: string;
  trip_summary?: string;
}

export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryResult> {
  const client = getClient();
  const modelName = getGeminiModel();

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: `You are SafarAI, an elite personal travel agent and itinerary curator with high geographic intelligence.
Rules:
1. Destination Normalization: Examine "${input.destination}". If there is a typo, misspelling, or informal phonetic spelling (e.g. "Sunderbans" -> "Sundarbans National Park, West Bengal", "Tokiyo" -> "Tokyo", "Benares" -> "Varanasi", "Bengluru" -> "Bengaluru"), automatically correct it and set "corrected_destination".
2. Dietary Strictness: If dietary restrictions are specified (${input.dietary || 'None specified'}), every single recommended meal activity MUST strictly adhere to it (e.g., if veg food only, recommend exclusively pure vegetarian local delicacies and restaurants). Never suggest non-vegetarian dishes.
3. Specific Places: Always include real, authentic places, heritage sites, scenic viewpoints, and local spots in 'place_name' and 'title'.
4. Structure the schedule with sensible pacing, realistic transit buffers, and rest intervals.
5. Provide realistic local cost estimates in ${input.currency}.
6. Output strictly structured JSON matching the requested schema.
7. Accurate GPS Coordinates & Clean Titles: For EVERY activity, you MUST provide precise real-world GPS coordinates ("latitude" and "longitude" as floating-point numbers, e.g. Amer Fort: 26.9855, 75.8513; Solang Valley: 32.3166, 77.1583). These coordinates are strictly for the interactive map engine. NEVER write raw coordinate numbers, latitude, longitude, or degree strings (e.g. '26.98° N, 75.85° E' or 'GPS: ...') inside the activity 'title', 'place_name', or 'description' text — keep titles and descriptions clean, evocative, and readable for human travelers.
8. Strict 12-Hour Clock: Output ALL activity times exclusively in standard 12-hour format with AM or PM (e.g. '09:00 AM', '01:30 PM', '07:45 PM'). NEVER use 24-hour notation.`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          corrected_destination: { type: SchemaType.STRING },
          trip_summary: { type: SchemaType.STRING },
          days: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                date: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                activities: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      time: { type: SchemaType.STRING },
                      title: { type: SchemaType.STRING },
                      description: { type: SchemaType.STRING },
                      estimated_cost: { type: SchemaType.NUMBER, nullable: true },
                      duration_minutes: { type: SchemaType.INTEGER, nullable: true },
                      category: {
                        type: SchemaType.STRING,
                        format: 'enum',
                        enum: ['transport', 'accommodation', 'meal', 'activity', 'sightseeing', 'shopping', 'rest', 'other'],
                      },
                      place_name: { type: SchemaType.STRING, nullable: true },
                      latitude: { type: SchemaType.NUMBER, nullable: true },
                      longitude: { type: SchemaType.NUMBER, nullable: true },
                      is_optional: { type: SchemaType.BOOLEAN },
                    },
                    required: ['time', 'title', 'description', 'category', 'is_optional'],
                  },
                },
              },
              required: ['date', 'title', 'activities'],
            },
          },
        },
        required: ['days'],
      },
    },
  });

  const prompt = `Create a complete day-by-day itinerary from ${input.startDate} to ${input.endDate} for ${input.destination}, ${input.country}.
Travelers: ${input.travelers}.
Total planned budget: ${input.currency} ${input.budget}.
Interests: ${input.interests.join(', ')}.
Dietary requirements: ${input.dietary || 'None specified'}.
Accessibility notes: ${input.accessibility || 'None specified'}.
Provide exact real-world GPS coordinates (latitude, longitude) for every activity so they can be mapped.
Provide dates formatted as YYYY-MM-DD.`;

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = JSON.parse(text) as {
    days: AIItineraryDay[];
    corrected_destination?: string;
    trip_summary?: string;
  };
  return {
    days: parsed.days,
    corrected_destination: parsed.corrected_destination || input.destination,
    trip_summary: parsed.trip_summary,
  };
}

export async function askCopilot(params: {
  message: string;
  context?: {
    activeTrip?: { destination: string; budget: number; currency: string; startDate: string; endDate: string };
    walletBalance?: number;
    travelers?: number;
    userPreferences?: string[];
  };
}): Promise<string> {
  const client = getClient();
  const modelName = getGeminiModel();

  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: `You are SAFAR Copilot, an elite editorial travel concierge and personal itinerary designer for the SAFAR AI platform.
Tone & Style:
- Warm, sophisticated, highly visual, and curated — like an editorial travel director from Condé Nast Traveler or Monocle.
- Formatting must be impeccably structured, clean, and eyecatching.

Formatting Guidelines:
1. Headings & Visual Structure: Use descriptive, evocative headings with relevant icons (e.g., "### 🏛️ DAY 1 · Arrival & Sunset Heritage Walk", "### 🌿 WHERE TO STAY · Neighbourhood Curation", "### 💰 SMART BUDGET ALLOCATION").
2. Tables & Schedules:
   - When providing day-by-day itineraries, use clean, readable format. If using a table, limit to 4-5 focused columns: | Day / Time | Experience & Location | Est. Cost | Curated Insight |.
   - Always supplement or format day plans with clear time blocks: Morning (8:00 AM - 12:00 PM), Afternoon (1:00 PM - 5:00 PM), Golden Hour & Evening (6:00 PM - 9:30 PM).
3. Insider Callouts: Highlight secret gems and pacing wisdom using blockquotes:
   > 💡 **Insider Tip:** [Specific hidden viewpoint, best timing to avoid crowds, or exact local dish to order]
   > 🧭 **Pacing Insight:** [Realistic transit buffer, walking distance, or rest recommendation]
4. Specificity: Never give generic recommendations like "visit local cafe". Always name real, authentic locations (e.g., "Hauz Khas Social overlooking the reservoir", "Indian Accent for modern inventive cuisine", "Amer Fort mirror hall at 8:30 AM before the heat").
5. Financial Precision: Quote realistic local estimates with currency symbols (e.g., ₹, $, €, ¥) matching context.
6. Typo Tolerance: If the user inputs misspellings (e.g., "Sunderbans", "Benares", "Bengluru", "Pariis"), recognize the authentic place seamlessly.`,
  });

  let prompt = params.message;
  if (params.context?.activeTrip) {
    prompt = `[Trip Context: Destination ${params.context.activeTrip.destination}, Dates ${params.context.activeTrip.startDate} to ${params.context.activeTrip.endDate}, Budget ${params.context.activeTrip.currency} ${params.context.activeTrip.budget}, Wallet Balance ${params.context.walletBalance ?? 'N/A'}]
User query: ${params.message}`;
  }

  const response = await model.generateContent(prompt);
  return response.response.text();
}
