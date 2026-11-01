import { GoogleGenerativeAI } from '@google/generative-ai';

const languageNames: Record<string, string> = {
  hi: 'Hindi',
  it: 'Italian',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  ja: 'Japanese',
  ar: 'Arabic',
  zh: 'Mandarin Chinese',
  pt: 'Portuguese',
  ru: 'Russian',
  ko: 'Korean',
  th: 'Thai',
  en: 'English',
};

const phraseDictionary: Record<string, Record<string, string>> = {
  'Where is the nearest hospital?': {
    hi: 'निकटतम अस्पताल कहाँ है? (Nikatatam aspatal kahan hai?)',
    ja: '一番近い病院はどこですか？ (Ichiban chikai byōin wa doko desu ka?)',
    fr: 'Où se trouve l’hôpital le plus proche ?',
    es: '¿Dónde está el hospital más cercano?',
    de: 'Wo ist das nächste Krankenhaus?',
    it: 'Dov’è l’ospedale più vicino?',
    ar: 'أين أقرب مستشفى؟ (Ayna aqrab mustashfa?)',
    zh: '最近的医院在哪里？ (Zuìjìn de yīyuàn zài nǎlǐ?)',
  },
  'How much does this cost?': {
    hi: 'यह कितने का है? (Yeh kitne ka hai?)',
    ja: 'これはいくらですか？ (Kore wa ikura desu ka?)',
    fr: 'Combien cela coûte-t-il ?',
    es: '¿Cuánto cuesta esto?',
    de: 'Wie viel kostet das?',
    it: 'Quanto costa questo?',
    ar: 'كم سعر هذا؟ (Kam si’r hadha?)',
    zh: '这个多少钱？ (Zhège duōshǎo qián?)',
  },
  'I need help': {
    hi: 'मुझे मदद चाहिए। (Mujhe madad chahiye.)',
    ja: '助けてください。 (Tasukete kudasai.)',
    fr: 'J’ai besoin d’aide.',
    es: 'Necesito ayuda.',
    de: 'Ich brauche Hilfe.',
    it: 'Ho bisogno di aiuto.',
    ar: 'أحتاج إلى مساعدة. (Ahtaju ila musa’adah.)',
    zh: '我需要帮助。 (Wǒ xūyào bāngzhù.)',
  },
  'Thank you very much': {
    hi: 'आपका बहुत-बहुत धन्यवाद। (Aapka bahut-bahut dhanyavaad.)',
    ja: 'どうもありがとうございます。 (Dōmo arigatō gozaimasu.)',
    fr: 'Merci beaucoup.',
    es: 'Muchas gracias.',
    de: 'Vielen Dank.',
    it: 'Grazie mille.',
    ar: 'شكراً جزيلاً. (Shukran jazeelan.)',
    zh: '非常感谢。 (Fēicháng gǎnxiè.)',
  },
  'Where is the bathroom?': {
    hi: 'शौचालय कहाँ है? (Shauchalaya kahan hai?)',
    ja: 'お手洗いはどこですか？ (Otearai wa doko desu ka?)',
    fr: 'Où sont les toilettes ?',
    es: '¿Dónde está el baño?',
    de: 'Wo ist die Toilette?',
    it: 'Dov’è il bagno?',
    ar: 'أين دورة المياه؟ (Ayna dawrat al-miyah?)',
    zh: '洗手间在哪里？ (Zhǐshǒujiān zài nǎlǐ?)',
  },
  'Can you please help with directions?': {
    hi: 'क्या आप रास्ता बताने में मदद कर सकते हैं? (Kya aap rasta batane mein madad kar sakte hain?)',
    ja: '道を教えていただけますか？ (Michi o oshiete itadakemasu ka?)',
    fr: 'Pouvez-vous m’indiquer le chemin, s’il vous plaît ?',
    es: '¿Puede indicarme el camino, por favor?',
    de: 'Können Sie mir bitte den Weg beschreiben?',
    it: 'Può indicarmi la strada, per favore?',
    ar: 'هل يمكنك مساعدتي في الاتجاهات؟ (Hal yumkinuka musa’adati?)',
    zh: '能请您指一下路吗？ (Néng qǐng nín zhǐ yīxià lù ma?)',
  },
};

const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];
const GROQ_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { text, sourceLang = 'en', targetLang = 'it' } = body;

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text string is required.' }), { status: 400 });
    }

    const cleanText = text.trim();
    const targetName = languageNames[targetLang] || targetLang;

    // 1. Instant travel dictionary check
    const dictMatch = phraseDictionary[cleanText]?.[targetLang];
    if (dictMatch) {
      return new Response(JSON.stringify({
        translatedText: dictMatch,
        source: 'verified_travel_dictionary',
        sourceLang,
        targetLang,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const prompt = `You are a professional multilingual travel translator for SAFAR AI.
Translate the following travel phrase or sentence accurately and naturally into ${targetName} (${targetLang}).
Text to translate: "${cleanText}"

Respond ONLY with valid JSON in this exact structure (no markdown, no backticks):
{
  "translatedText": "the natural translation",
  "transliteration": "pronunciation guide in Latin alphabet (if non-Latin script, otherwise null)",
  "culturalNote": "brief practical traveler advice on tone/etiquette if helpful, otherwise null"
}`;

    const geminiKey = req.headers.get('x-gemini-key') || body.apiKey || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    const groqKey = req.headers.get('x-groq-key') || body.groqApiKey || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';

    // 2. Try Gemini Models
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      for (const modelName of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
              responseMimeType: 'application/json',
            },
          });
          const result = await model.generateContent(prompt);
          const rawText = result.response.text();
          const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          return new Response(JSON.stringify({
            translatedText: parsed.translatedText,
            transliteration: parsed.transliteration || null,
            culturalNote: parsed.culturalNote || null,
            source: 'gemini',
            model: modelName,
            sourceLang,
            targetLang,
          }), { headers: { 'Content-Type': 'application/json' } });
        } catch (geminiErr: any) {
          console.warn(`Gemini translation with ${modelName} failed/quota:`, geminiErr?.message?.slice(0, 80));
          continue;
        }
      }
    }

    // 3. Try Groq Models
    if (groqKey) {
      for (const modelName of GROQ_MODELS) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'system', content: 'You are a translation assistant. Respond strictly with valid JSON only.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.2,
              response_format: { type: 'json_object' },
            }),
          });
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return new Response(JSON.stringify({
              translatedText: parsed.translatedText,
              transliteration: parsed.transliteration || null,
              culturalNote: parsed.culturalNote || null,
              source: 'groq',
              model: modelName,
              sourceLang,
              targetLang,
            }), { headers: { 'Content-Type': 'application/json' } });
          }
        } catch (groqErr: any) {
          console.warn(`Groq translation with ${modelName} failed:`, groqErr?.message?.slice(0, 80));
          continue;
        }
      }
    }

    return new Response(JSON.stringify({
      translatedText: `[${targetName}] ${cleanText}`,
      source: 'offline_fallback',
      sourceLang,
      targetLang,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Translation failed' }), { status: 500 });
  }
};
