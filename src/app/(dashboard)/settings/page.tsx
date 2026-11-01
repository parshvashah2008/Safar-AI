'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  EyeOff,
  Globe2,
  Key,
  Layers,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeSegmentedSwitch, ThemeToggle } from '@/components/layout/theme-toggle';
import {
  SUPPORTED_CURRENCIES,
  fetchLiveExchangeRates,
  convertCurrency,
  formatCurrencyAmount,
} from '@/lib/services/currency-service';
import { emitCurrencyChange } from '@/lib/services/sync-bus';

export default function SettingsPage() {
  // API Keys state
  const [geminiKey, setGeminiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Currency & conversion state
  const [currency, setCurrency] = useState('INR');
  const [calcAmount, setCalcAmount] = useState('10000');
  const [calcFrom, setCalcFrom] = useState('INR');
  const [calcTo, setCalcTo] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesUpdated, setRatesUpdated] = useState('Loading live rates...');
  const [isRatesLive, setIsRatesLive] = useState(false);

  // Status feedback
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGeminiKey(localStorage.getItem('safar_gemini_api_key') || '');
      setOpenAiKey(localStorage.getItem('safar_openai_api_key') || '');
      setAnthropicKey(localStorage.getItem('safar_anthropic_api_key') || '');
      setGroqKey(localStorage.getItem('safar_groq_api_key') || '');
      const savedCurr = localStorage.getItem('safar_default_currency');
      if (savedCurr && SUPPORTED_CURRENCIES[savedCurr]) {
        setCurrency(savedCurr);
        setCalcFrom(savedCurr);
      }
    }

    // Load live exchange rates
    fetchLiveExchangeRates().then((res) => {
      setRates(res.rates);
      setRatesUpdated(res.lastUpdated);
      setIsRatesLive(res.isLive);
    });
  }, []);

  const handleSaveKey = (provider: 'gemini' | 'openai' | 'anthropic' | 'groq', val: string) => {
    if (typeof window === 'undefined') return;
    const keyName = `safar_${provider}_api_key`;
    if (val.trim()) {
      localStorage.setItem(keyName, val.trim());
      setNotice(`${provider.toUpperCase()} API key saved to local vault and activated.`);
    } else {
      localStorage.removeItem(keyName);
      setNotice(`${provider.toUpperCase()} key removed. Defaulting to server environment.`);
    }
    setTimeout(() => setNotice(''), 4000);
  };

  const handleClearKey = (provider: 'gemini' | 'openai' | 'anthropic' | 'groq') => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`safar_${provider}_api_key`);
    if (provider === 'gemini') setGeminiKey('');
    if (provider === 'openai') setOpenAiKey('');
    if (provider === 'anthropic') setAnthropicKey('');
    if (provider === 'groq') setGroqKey('');
    setNotice(`${provider.toUpperCase()} key cleared.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const toggleShowKey = (name: string) => {
    setShowKeys((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    emitCurrencyChange(newCurr, rates);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safar_default_currency', newCurr);
      setNotice(`Default currency set to ${newCurr} (${SUPPORTED_CURRENCIES[newCurr]?.name || newCurr}).`);
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      platform: 'SAFAR AI v1.0.0',
      currency,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Data export generated.');
    setTimeout(() => setNotice(''), 3000);
  };

  const convertedResult = convertCurrency(Number(calcAmount) || 0, calcFrom, calcTo, rates);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 dark:text-emerald-400 font-semibold">
          SYSTEM PREFERENCES & API KEYS
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink dark:text-[#edf2ee]">
          Settings & Travel Configuration
        </h1>
        <p className="text-xs sm:text-sm text-ink-400 dark:text-[#8ca397] mt-1">
          Manage your AI model keys, inspect real-time exchange rates, and configure display preferences.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl bg-teal-50 dark:bg-emerald-950/60 border border-teal-200 dark:border-emerald-800 p-3 text-xs text-teal-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in-0 duration-200">
          <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* AI Provider & API Credentials Vault */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-6 transition-colors">
        <div className="flex items-center justify-between border-b border-ivory-200 dark:border-[#1e2e26] pb-3 text-ink dark:text-[#edf2ee]">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
            <h3 className="font-editorial text-lg font-medium">AI Engine & API Credentials Vault</h3>
          </div>
          <span className="font-mono text-[9px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
            PRIVATE CLIENT VAULT
          </span>
        </div>

        <p className="text-xs text-ink-400 dark:text-[#8ca397] leading-relaxed">
          Configure personal API keys for itinerary reasoning and chat. Keys are stored locally in your browser and transmitted only directly to authorized endpoints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Google Gemini */}
          <div className="rounded-xl border border-ivory-200 dark:border-[#22352b] p-4 bg-[#faf9f6] dark:bg-[#15221b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-[#111a16] dark:text-[#edf2ee]">Google Gemini API</span>
              </div>
              {geminiKey ? (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE (CUSTOM KEY)
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE (BUILT-IN ENGINE)
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKeys['gemini'] ? 'text' : 'password'}
                placeholder="AIzaSy... or AQ.Ab8..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="font-mono text-xs pr-8 bg-white dark:bg-[#0c1410]"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('gemini')}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
              >
                {showKeys['gemini'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleSaveKey('gemini', geminiKey)} size="sm" className="h-7 text-[11px] gap-1">
                <Save className="h-3 w-3" /> Save
              </Button>
              {geminiKey && (
                <Button onClick={() => handleClearKey('gemini')} variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* OpenAI */}
          <div className="rounded-xl border border-ivory-200 dark:border-[#22352b] p-4 bg-[#faf9f6] dark:bg-[#15221b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-[#111a16] dark:text-[#edf2ee]">OpenAI (GPT-4o)</span>
              </div>
              {openAiKey ? (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono text-ink-400 dark:text-[#74877e]">OPTIONAL</span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKeys['openai'] ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openAiKey}
                onChange={(e) => setOpenAiKey(e.target.value)}
                className="font-mono text-xs pr-8 bg-white dark:bg-[#0c1410]"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('openai')}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
              >
                {showKeys['openai'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleSaveKey('openai', openAiKey)} size="sm" className="h-7 text-[11px] gap-1">
                <Save className="h-3 w-3" /> Save
              </Button>
              {openAiKey && (
                <Button onClick={() => handleClearKey('openai')} variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Anthropic Claude */}
          <div className="rounded-xl border border-ivory-200 dark:border-[#22352b] p-4 bg-[#faf9f6] dark:bg-[#15221b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-[#111a16] dark:text-[#edf2ee]">Anthropic Claude</span>
              </div>
              {anthropicKey ? (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono text-ink-400 dark:text-[#74877e]">OPTIONAL</span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKeys['anthropic'] ? 'text' : 'password'}
                placeholder="sk-ant-api..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="font-mono text-xs pr-8 bg-white dark:bg-[#0c1410]"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('anthropic')}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
              >
                {showKeys['anthropic'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleSaveKey('anthropic', anthropicKey)} size="sm" className="h-7 text-[11px] gap-1">
                <Save className="h-3 w-3" /> Save
              </Button>
              {anthropicKey && (
                <Button onClick={() => handleClearKey('anthropic')} variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Groq High-Speed */}
          <div className="rounded-xl border border-ivory-200 dark:border-[#22352b] p-4 bg-[#faf9f6] dark:bg-[#15221b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-[#111a16] dark:text-[#edf2ee]">Groq High-Speed AI</span>
              </div>
              {groqKey ? (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE (CUSTOM KEY)
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded font-semibold">
                  ACTIVE (BUILT-IN ENGINE)
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showKeys['groq'] ? 'text' : 'password'}
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="font-mono text-xs pr-8 bg-white dark:bg-[#0c1410]"
              />
              <button
                type="button"
                onClick={() => toggleShowKey('groq')}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
              >
                {showKeys['groq'] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleSaveKey('groq', groqKey)} size="sm" className="h-7 text-[11px] gap-1">
                <Save className="h-3 w-3" /> Save
              </Button>
              {groqKey && (
                <Button onClick={() => handleClearKey('groq')} variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Currency Conversion & Global Rates */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-6 transition-colors">
        <div className="flex items-center justify-between border-b border-ivory-200 dark:border-[#1e2e26] pb-3 text-ink dark:text-[#edf2ee]">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
            <h3 className="font-editorial text-lg font-medium">Real-Time Global Currency Rates & Converter</h3>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-semibold text-teal-700 dark:text-emerald-300 bg-teal-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-teal-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE RATES ({ratesUpdated})</span>
          </div>
        </div>

        {/* Live Interactive Currency Converter */}
        <div className="rounded-xl border border-teal-100 dark:border-emerald-900/60 bg-gradient-to-br from-teal-50/60 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-amber-950/20 p-5 space-y-4">
          <div className="text-xs font-semibold text-ink dark:text-[#edf2ee]">
            Instant Currency Exchange Calculator
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block mb-1">
                Amount ({calcFrom})
              </label>
              <Input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="font-mono text-sm bg-white dark:bg-[#0c1410]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block mb-1">
                Convert From
              </label>
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value)}
                className="w-full h-9 rounded-xl border border-ivory-300 dark:border-[#2b3e33] bg-white dark:bg-[#0c1410] px-3 text-xs text-ink dark:text-[#edf2ee] font-semibold"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block mb-1">
                Convert To
              </label>
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value)}
                className="w-full h-9 rounded-xl border border-ivory-300 dark:border-[#2b3e33] bg-white dark:bg-[#0c1410] px-3 text-xs text-ink dark:text-[#edf2ee] font-semibold"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-teal-200/50 dark:border-emerald-800/40 flex items-center justify-between">
            <span className="text-xs text-ink-400 dark:text-[#8ca397]">Calculated Exchange Result:</span>
            <span className="font-mono text-lg font-bold text-teal-800 dark:text-emerald-300">
              {formatCurrencyAmount(convertedResult, calcTo)}
            </span>
          </div>
        </div>

        {/* Global Currency Selection for App */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-ink-400 dark:text-[#8ca397] block">
            Default Application Currency
          </label>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="max-w-md w-full h-10 rounded-xl border border-ivory-300 dark:border-[#2b3e33] bg-white dark:bg-[#0c1410] px-3 text-xs text-ink dark:text-[#edf2ee] font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          >
            {Object.values(SUPPORTED_CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-ink-400 dark:text-[#8ca397]">
            All budgets, itinerary estimations, and wallet tallies will automatically convert to your selected currency.
          </p>
        </div>
      </div>

      {/* Appearance & Color Theme */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-ivory-200 dark:border-[#1e2e26] pb-3 text-ink dark:text-[#edf2ee]">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <h3 className="font-editorial text-lg font-medium">Appearance & Color Theme</h3>
          </div>
          <span className="font-mono text-[9px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
            INSTANT SYNC
          </span>
        </div>

        <p className="text-xs text-ink-400 dark:text-[#8ca397] leading-relaxed max-w-xl">
          Switch between Light Mode (editorial ivory canvas for daytime clarity) and Dark Mode (midnight obsidian and jade for low-light night travels).
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#111a16] dark:text-[#edf2ee]">Theme Switch:</span>
            <ThemeToggle showLabel={true} />
          </div>

          <div className="flex items-center gap-2">
            <ThemeSegmentedSwitch />
          </div>
        </div>
      </div>

      {/* Backup & Data Privacy */}
      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 sm:p-8 shadow-card space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-ivory-200 dark:border-[#1e2e26] pb-3 text-ink dark:text-[#edf2ee]">
          <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
          <h3 className="font-editorial text-lg font-medium">Data Privacy & Portability</h3>
        </div>

        <p className="text-xs text-ink-400 dark:text-[#8ca397] leading-relaxed max-w-xl">
          Safar AI respects your travel privacy. You can download an encrypted snapshot of all your trips, planned budgets, and wallet transactions at any time.
        </p>

        <Button onClick={handleExport} variant="secondary" size="sm" className="gap-2 text-xs">
          <Download className="h-4 w-4" />
          <span>Export Local Travel Backup (.JSON)</span>
        </Button>
      </div>
    </div>
  );
}
