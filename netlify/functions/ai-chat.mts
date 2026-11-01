import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Provider cascade: Gemini (Live Generative AI) → Groq ───
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
];

const SYSTEM_INSTRUCTION = `You are SAFAR Copilot, an elite personal travel concierge and fintech advisor for SAFAR AI.
Tone: Warm, sophisticated, hyper-practical, culturally astute, and financially prudent.
Linguistic Intelligence:
- Automatically understand, tolerate, and gently normalize typo errors in destination names, Indian & global regional places (e.g. "Sunderbans" -> Sundarbans National Park, "Tokiyo" -> Tokyo, "Benares" -> Varanasi, "Bengluru" -> Bengaluru, "Pondy" -> Puducherry, "Darjiling" -> Darjeeling).
- Respect dietary needs (e.g., veg/Jain/halal) and recommend strictly compliant local delicacies.
- Provide concrete, authentic advice. Recommend specific neighbourhoods, local trains, timing tips, and realistic budget allocations.
- Never hallucinate exact live ticket prices; give realistic estimated ranges and remind the traveler to verify bookings.`;

async function tryGemini(geminiKey: string, prompt: string): Promise<{ reply: string; model: string } | null> {
  const genAI = new GoogleGenerativeAI(geminiKey);
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[Gemini Chat] Generating live response with ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION });
      const result = await model.generateContent(prompt);
      return { reply: result.response.text(), model: `gemini/${modelName}` };
    } catch (err: any) {
      console.warn(`[Gemini Chat] Error on ${modelName}:`, err?.message || err);
      continue;
    }
  }
  return null;
}

async function tryGroq(groqKey: string, prompt: string): Promise<{ reply: string; model: string } | null> {
  for (const modelName of GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_INSTRUCTION },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2048,
          temperature: 0.6,
        }),
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return { reply: data.choices[0].message.content, model: `groq/${modelName}` };
      }
      console.warn(`Groq ${modelName} no content:`, JSON.stringify(data.error || data).slice(0, 120));
      continue;
    } catch (err: any) {
      console.warn(`Groq ${modelName} error:`, err.message?.slice(0, 100));
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
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message string is required.' }), { status: 400 });
    }

    const geminiKey = req.headers.get('x-gemini-key') || body.apiKey || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    const groqKey = req.headers.get('x-groq-key') || body.groqApiKey || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
    const prompt = `${context?.activeTrip ? `Active Trip Context: Destination: ${context.activeTrip.destination}, Budget: ${context.activeTrip.currency} ${context.activeTrip.budget}\n` : ''}User message: ${message}`;

    // 1. Try Gemini cascade
    if (geminiKey) {
      const geminiResult = await tryGemini(geminiKey, prompt);
      if (geminiResult) {
        return new Response(JSON.stringify({
          reply: geminiResult.reply,
          source: 'gemini',
          model: geminiResult.model,
          live: true,
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 2. Fallback to Groq cascade
    if (groqKey) {
      const groqResult = await tryGroq(groqKey, prompt);
      if (groqResult) {
        return new Response(JSON.stringify({
          reply: groqResult.reply,
          source: 'groq',
          model: groqResult.model,
          live: true,
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 3. All providers exhausted
    return new Response(JSON.stringify({
      reply: `All AI providers have reached their limits. Your Gemini quota resets at midnight PT. Please try again later!\n\nQuick tip for ${context?.activeTrip?.destination || 'your destination'}: allocate ~40% accommodation, ~25% food & transit, ~15% activities, ~20% buffer.`,
      source: 'fallback',
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Chat error' }), { status: 500 });
  }
};
