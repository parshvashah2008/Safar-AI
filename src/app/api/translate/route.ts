import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAppConfig, requireGeminiKey, getGeminiModel } from '@/lib/config';

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
    zh: '洗手间在哪里？ (Xǐshǒujiān zài nǎlǐ?)',
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, sourceLang = 'en', targetLang = 'it' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text string is required.' }, { status: 400 });
    }

    const cleanText = text.trim();
    const targetName = languageNames[targetLang] || targetLang;

    // 1. Check verified instant travel dictionary
    const dictMatch = phraseDictionary[cleanText]?.[targetLang];
    if (dictMatch) {
      return NextResponse.json({
        translatedText: dictMatch,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        provider: 'Curated Travel Phrasebook',
        verified: true,
      });
    }

    // 1. Try Groq for ultra-fast translation with cultural context
    const groqKey = req.headers.get('x-groq-key') || process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
    if (groqKey) {
      try {
        const groqPrompt = `You are SafarAI's Chief Polyglot & Cultural Travel Intelligence Specialist.
Translate this traveler statement into ${targetName}:
"${cleanText}"

Output valid JSON only with keys:
{
  "translatedText": string (in native script, e.g. Devanagari, Kanji, Arabic, etc.),
  "pronunciation": string (romanized phonetic pronunciation guide in Latin letters),
  "culturalEtiquette": string (1-sentence street-smart advice, hand gestures, bargaining tip, or politeness nuance when saying this)
}`;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are an elite polyglot travel linguist. Output valid JSON only.' },
              { role: 'user', content: groqPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
          }),
        });

        if (groqRes.ok) {
          const gData = await groqRes.json();
          const parsed = JSON.parse(gData.choices?.[0]?.message?.content || '{}');
          if (parsed.translatedText) {
            return NextResponse.json({
              translatedText: parsed.translatedText,
              pronunciation: parsed.pronunciation || '',
              culturalEtiquette: parsed.culturalEtiquette || 'Polite, clear tone recommended.',
              sourceLanguage: sourceLang,
              targetLanguage: targetLang,
              provider: 'Autonomous Neural AI',
              verified: true,
            });
          }
        }
      } catch (gErr) {
        console.warn('Groq translate failed, falling back:', gErr);
      }
    }

    // 2. Real-time Gemini AI Translation
    const config = getAppConfig();
    try {
      const customKey = req.headers.get('x-gemini-key');
      const key = customKey || requireGeminiKey();
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: getGeminiModel() || 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `Translate to ${targetName}: "${cleanText}".
Output JSON:
{
  "translatedText": string,
  "pronunciation": string,
  "culturalEtiquette": string
}`;

      const result = await model.generateContent(prompt);
      const textOutput = result.response.text().trim();
      const parsed = JSON.parse(textOutput);

      if (parsed.translatedText) {
        return NextResponse.json({
          translatedText: parsed.translatedText,
          pronunciation: parsed.pronunciation || '',
          culturalEtiquette: parsed.culturalEtiquette || 'Speak at a calm and measured pace.',
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          provider: 'Autonomous Neural AI',
          verified: true,
        });
      }
    } catch (geminiErr: any) {
      console.warn('Gemini translation error:', geminiErr?.message);
    }

    // 3. Fallback to Google Cloud Translation API if configured
    if (config.translateConfigured && process.env.GOOGLE_TRANSLATE_API_KEY) {
      try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: cleanText,
            target: targetLang,
            source: sourceLang === 'auto' ? undefined : sourceLang,
            format: 'text',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const translated = data?.data?.translations?.[0]?.translatedText;
          if (translated) {
            return NextResponse.json({
              translatedText: translated,
              sourceLanguage: sourceLang,
              targetLanguage: targetLang,
              provider: 'Google Cloud Translation',
              verified: true,
            });
          }
        }
      } catch (err: any) {
        console.warn('Google Translate API error:', err?.message);
      }
    }

    // 4. Fallback if no keys available
    return NextResponse.json({
      translatedText: `[${targetLang.toUpperCase()}] ${cleanText}`,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      provider: 'Offline Preview Mode',
      verified: false,
      note: 'Add GEMINI_API_KEY to .env.local to enable real-time neural translation.',
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
