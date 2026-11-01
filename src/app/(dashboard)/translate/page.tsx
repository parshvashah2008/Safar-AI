'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, Copy, Globe2, Languages, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { translateWithClientAi } from '@/lib/ai/client-ai-engine';
import { useActiveSearch } from '@/lib/services/sync-bus';

const languages = [
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'th', name: 'Thai (ไทย)' },
  { code: 'id', name: 'Indonesian (Bahasa)' },
];

const essentialPhrases = [
  'Where is the nearest hospital?',
  'How much does this cost?',
  'I need help',
  'Thank you very much',
  'Where is the bathroom?',
  'Do you have vegetarian food?',
  'Please speak slowly',
];

export default function TranslatePage() {
  const { activeSearch } = useActiveSearch();
  const [sourceText, setSourceText] = useState('Where is the nearest hospital?');
  const [targetLang, setTargetLang] = useState('hi');
  const [translatedText, setTranslatedText] = useState('निकटतम अस्पताल कहाँ है?');
  const [pronunciation, setPronunciation] = useState('Nikatatam aspataal kahan hai?');
  const [culturalEtiquette, setCulturalEtiquette] = useState('In emergencies, say "Madad" (help) clearly while asking for directions.');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [providerTag, setProviderTag] = useState('Autonomous Neural AI');

  // Auto-tune language based on active search from homepage
  useEffect(() => {
    if (activeSearch.destination) {
      const destLower = activeSearch.destination.toLowerCase();
      if (destLower.includes('palitana') || destLower.includes('gujarat') || destLower.includes('surat') || destLower.includes('ahmedabad')) {
        setTargetLang('gu');
      } else if (destLower.includes('japan') || destLower.includes('kyoto') || destLower.includes('tokyo')) {
        setTargetLang('ja');
      } else if (destLower.includes('france') || destLower.includes('paris')) {
        setTargetLang('fr');
      } else if (destLower.includes('italy') || destLower.includes('amalfi') || destLower.includes('rome') || destLower.includes('florence')) {
        setTargetLang('it');
      } else if (destLower.includes('germany') || destLower.includes('berlin')) {
        setTargetLang('de');
      } else if (destLower.includes('spain') || destLower.includes('madrid') || destLower.includes('barcelona')) {
        setTargetLang('es');
      } else if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('phuket')) {
        setTargetLang('th');
      } else if (destLower.includes('bali') || destLower.includes('indonesia')) {
        setTargetLang('id');
      } else if (destLower.includes('dubai') || destLower.includes('uae')) {
        setTargetLang('ar');
      }
    }
  }, [activeSearch.destination]);

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate || sourceText).trim();
    if (!text) return;

    setLoading(true);
    try {
      let loaded = false;
      try {
        const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
        const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localGeminiKey ? { 'x-gemini-key': localGeminiKey } : {}),
            ...(localGroqKey ? { 'x-groq-key': localGroqKey } : {}),
          },
          body: JSON.stringify({
            text,
            targetLang,
          }),
        });

        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          setTranslatedText(data.translatedText);
          setPronunciation(data.pronunciation || '');
          setCulturalEtiquette(data.culturalEtiquette || '');
          setProviderTag(data.provider || 'Autonomous Neural AI');
          loaded = true;
        }
      } catch (srvErr) {}

      // Fallback directly to Client AI Engine (Gemini / Groq)
      if (!loaded) {
        const targetLangName = languages.find(l => l.code === targetLang)?.name || targetLang;
        const aiRes = await translateWithClientAi(text, targetLangName);
        if (aiRes && aiRes.translatedText) {
          setTranslatedText(aiRes.translatedText);
          setPronunciation(aiRes.transliteration || '');
          setCulturalEtiquette(aiRes.culturalNote || '');
          setProviderTag('Gemini & Groq Neural AI');
          loaded = true;
        }
      }
    } catch {
      setTranslatedText('Translation unavailable at this moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 dark:text-emerald-400 font-semibold">
          AUTONOMOUS MULTILINGUAL INTELLIGENCE
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink dark:text-[#edf2ee]">
          Global Polyglot & Cultural Guide
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 dark:text-[#8ca397] mt-1">
          Instant multilingual translations with phonetic pronunciation guides and street-smart cultural etiquette.
        </p>
      </div>

      {/* Main Translation Workbench */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-6">
        {/* Language Controls */}
        <div className="flex items-center justify-between border-b border-ivory-200 dark:border-[#1e2e26] pb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink dark:text-[#edf2ee]">
            <Languages className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
            <span>English (Input)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase text-ink-400 dark:text-[#8ca397]">Target Language:</span>
            <select
              value={targetLang}
              onChange={(e) => {
                setTargetLang(e.target.value);
                setTimeout(() => handleTranslate(), 50);
              }}
              className="h-9 rounded-xl border border-ivory-300 dark:border-[#22352b] bg-white dark:bg-[#15221b] px-3 text-xs text-ink dark:text-[#edf2ee] font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Box */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 dark:text-[#8ca397] block font-semibold">
              Type or select travel phrase
            </span>
            <Textarea
              rows={4}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="rounded-xl p-3 text-sm bg-white dark:bg-[#15221b] border-ivory-300 dark:border-[#22352b]"
            />
            <Button
              size="sm"
              onClick={() => handleTranslate()}
              disabled={loading}
              className="text-xs gap-1.5 mt-2 bg-teal-800 hover:bg-teal-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe2 className="h-3.5 w-3.5" />}
              <span>Translate with AI</span>
            </Button>
          </div>

          {/* Result Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-wider text-teal-700 dark:text-emerald-400 font-semibold">
                AI Translation & Phonetics
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-ink-400 dark:text-[#8ca397] hover:text-teal-700 transition-colors"
                title="Copy translated text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="min-h-[120px] rounded-xl border border-ivory-300 dark:border-[#22352b] bg-ivory-50/70 dark:bg-[#15221b] p-4 text-sm text-ink dark:text-[#edf2ee] font-medium leading-relaxed flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="text-base font-semibold text-teal-950 dark:text-emerald-200">{translatedText}</div>
                {pronunciation && (
                  <div className="text-xs text-ink-500 dark:text-[#8ca397] font-mono">
                    🗣️ <span className="italic">{pronunciation}</span>
                  </div>
                )}
                {culturalEtiquette && (
                  <div className="text-[11px] text-amber-800 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                    💡 <span className="font-semibold">Local Etiquette:</span> {culturalEtiquette}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-ivory-200/60 dark:border-[#1e2e26] flex items-center justify-between text-[10px] text-ink-400 dark:text-[#8ca397] font-mono">
                <span>{providerTag}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency & Key Travel Phrases */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sand-700 dark:text-amber-300" />
          <h3 className="font-editorial text-lg font-medium text-ink dark:text-[#edf2ee]">
            Essential Street & Emergency Phrases
          </h3>
        </div>
        <p className="text-xs text-ink-400 dark:text-[#8ca397]">
          Click any phrase to trigger instant neural translation with pronunciation and cultural nuance:
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {essentialPhrases.map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                setSourceText(phrase);
                handleTranslate(phrase);
              }}
              className="rounded-xl border border-ivory-300 dark:border-[#22352b] bg-ivory-100/60 dark:bg-[#15221b] px-3.5 py-2 text-xs text-ink-600 dark:text-[#a8beaf] hover:bg-teal-50 dark:hover:bg-[#1c2e24] hover:border-teal-300 dark:hover:border-emerald-600 hover:text-teal-900 dark:hover:text-[#edf2ee] transition-all text-left"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
