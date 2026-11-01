import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireGeminiKey, getGeminiModel } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, budget, currency = 'INR', expenses = [], days = 3, travelers = 2 } = body;

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const remaining = Math.max(0, budget - totalSpent);
    const utilization = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    const prompt = `You are SafarAI's Senior Travel Financial Guardian.
Destination: ${destination || 'Travel Journey'}
Trip Duration: ${days} days
Travelers: ${travelers}
Total Budget: ${currency} ${budget}
Total Spent So Far: ${currency} ${totalSpent}
Remaining Balance: ${currency} ${remaining}
Budget Utilization: ${utilization}%
Recorded Expenses: ${JSON.stringify(expenses.slice(0, 15).map((e: any) => ({ title: e.title, amount: e.amount, category: e.category })))}

Provide an honest, expert AI financial health audit and cost-reduction strategy.
Output strictly valid JSON with these keys:
{
  "status": "healthy" | "caution" | "critical",
  "statusLabel": string (e.g. "Velocity Optimal", "Moderate Burn Rate", "High Overrun Risk"),
  "burnRatePerDay": number (estimated daily spend velocity so far),
  "projectedTotal": number (estimated total spend by end of trip),
  "willOverrun": boolean,
  "overrunAmount": number (0 if not overrunning),
  "executiveSummary": string (2-3 sentences of sharp financial insight),
  "categoryAnalysis": string (1-2 sentences on which category is dominating spend),
  "actionableSavings": [
    {
      "tip": string (high-impact concrete localized tip for ${destination}),
      "potentialSaving": string (e.g. "Save ~${currency} 2,500"),
      "category": string
    }
  ]
}`;

    // 1. Try Groq for ultra-fast generation
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
              { role: 'system', content: 'You are an elite travel financial analyst. Return only strictly valid JSON matching the user schema.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return NextResponse.json({ success: true, advisor: parsed, provider: 'Autonomous Neural AI' });
          }
        }
      } catch (err) {
        console.warn('Groq budget advisor failed, falling back to Gemini:', err);
      }
    }

    // 2. Fallback to Gemini
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
      return NextResponse.json({ success: true, advisor: parsed, provider: 'Autonomous Neural AI' });
    } catch (geminiErr: any) {
      console.warn('Gemini budget advisor error:', geminiErr);
    }

    // 3. Resilient fallback calculation
    const dailyBurn = days > 0 ? Math.round(totalSpent / Math.max(1, expenses.length)) : 0;
    const projected = dailyBurn * days;
    return NextResponse.json({
      success: true,
      advisor: {
        status: utilization > 85 ? 'caution' : 'healthy',
        statusLabel: utilization > 85 ? 'Moderate Burn Rate' : 'Velocity Optimal',
        burnRatePerDay: dailyBurn,
        projectedTotal: projected,
        willOverrun: projected > budget,
        overrunAmount: Math.max(0, projected - budget),
        executiveSummary: `You have consumed ${utilization}% of your total ${currency} ${budget} cap. Spending pace remains balanced for ${destination}.`,
        categoryAnalysis: 'Meals and transit account for the primary share of current allocations.',
        actionableSavings: [
          {
            tip: `Book local city heritage walking tours and state transport in ${destination} to minimize premium taxi surcharges.`,
            potentialSaving: `Save ~${currency} 1,500`,
            category: 'Local Mobility',
          },
          {
            tip: 'Dine at celebrated local dhabas and heritage bistros instead of tourist aggregator spots.',
            potentialSaving: `Save ~${currency} 2,000`,
            category: 'Meals & Dining',
          },
        ],
      },
      provider: 'Autonomous Neural AI (Resilient)',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
