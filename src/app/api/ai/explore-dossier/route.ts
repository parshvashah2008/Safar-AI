import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireGeminiKey, getGeminiModel } from '@/lib/config';
import { resolveCountry, isLocationInIndia } from '@/lib/services/transit-routing';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, currency = 'INR', userOrigin = 'India' } = body;

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json({ success: false, error: 'Destination is required.' }, { status: 400 });
    }

    const resolvedCountry = resolveCountry(destination);
    const isDomestic = isLocationInIndia(destination);

    const prompt = `You are SafarAI's Chief Travel Intelligence Curator.
Destination: "${destination}"
Country: "${resolvedCountry}"
User Origin: "${userOrigin}"
Preferred Currency: "${currency}"

Generate a deeply authentic, localized, editorial travel dossier for "${destination}".
Include real local secrets, cultural highlights, authentic dishes, optimal duration, realistic budget tiers, and visa/permit advice.

Return strictly valid JSON with this schema:
{
  "name": string (official clean name of destination),
  "country": string,
  "region": string,
  "isDomestic": boolean,
  "tagline": string (evocative, one-sentence editorial hook),
  "overview": string (2-3 paragraphs of vivid travel context, history, and seasonal vibe),
  "idealDuration": string (e.g. "3 - 4 Days"),
  "bestMonths": string (e.g. "October to March"),
  "climateVibe": string (e.g. "Crisp sunny desert days (24°C), starry chilled nights (8°C)"),
  "budgetTiers": {
    "backpacker": string (e.g. "${currency} 12,000 - 18,000"),
    "comfortable": string (e.g. "${currency} 25,000 - 45,000"),
    "luxury": string (e.g. "${currency} 60,000+ ")
  },
  "secretExperiences": [
    {
      "title": string,
      "description": string,
      "insiderTip": string
    }
  ],
  "mustTasteDelicacies": [
    {
      "dish": string,
      "description": string,
      "bestPlace": string
    }
  ],
  "transitGateway": string (how to reach from ${userOrigin}: trains, flights, nearest airports),
  "visaAndPermits": string (clear domestic or international visa/permit rules)
}`;

    // 1. Try Groq
    const groqKey = req.headers.get('x-groq-key') || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
    if (groqKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are an elite travel documentary writer and destination curator. Output valid JSON only.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.5,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return NextResponse.json({ success: true, dossier: parsed, provider: 'Autonomous Neural AI' });
          }
        }
      } catch (err) {
        console.warn('Groq dossier generation failed, trying Gemini:', err);
      }
    }

    // 2. Try Gemini
    try {
      const customKey = req.headers.get('x-gemini-key');
      const apiKey = customKey || requireGeminiKey();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: getGeminiModel() || 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return NextResponse.json({ success: true, dossier: parsed, provider: 'Autonomous Neural AI' });
    } catch (geminiErr: any) {
      console.warn('Gemini explore dossier error:', geminiErr);
    }

    // 3. Fallback
    return NextResponse.json({
      success: true,
      dossier: {
        name: destination,
        country: resolvedCountry,
        region: isDomestic ? 'India' : 'International',
        isDomestic,
        tagline: `Discover the timeless allure and cultural depth of ${destination}.`,
        overview: `${destination} offers a captivating blend of local heritage, atmospheric quarters, and unforgettable local cuisine.`,
        idealDuration: '3 - 5 Days',
        bestMonths: 'October to April',
        climateVibe: 'Moderate, pleasant weather ideal for daytime exploration.',
        budgetTiers: {
          backpacker: `${currency} 15,000`,
          comfortable: `${currency} 30,000`,
          luxury: `${currency} 60,000+`,
        },
        secretExperiences: [
          {
            title: 'Dawn Heritage Stroll',
            description: 'Wander old alleys before vendors open and light floods the stone architecture.',
            insiderTip: 'Start by 06:30 AM for undisturbed photography.',
          },
          {
            title: 'Authentic Culinary Crawl',
            description: 'Taste authentic local dishes crafted with generations of heritage recipes.',
            insiderTip: 'Ask local residents for their favorite family-run haveli or eatery.',
          },
        ],
        mustTasteDelicacies: [
          {
            dish: 'Signature Local Thali',
            description: 'Hearty selection of regional breads, curries, and traditional sweets.',
            bestPlace: 'Heritage market centers',
          },
        ],
        transitGateway: `Connected via domestic express trains, interstate highways, and regional flights.`,
        visaAndPermits: isDomestic ? 'Domestic Travel: Standard government ID required.' : 'Valid Passport & Tourist Visa required.',
      },
      provider: 'Autonomous Neural AI (Resilient)',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
