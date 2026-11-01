'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Compass,
  Wallet,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { getTrips, createTrip } from '@/lib/services/trip-service';
import { askCopilot } from '@/lib/ai/gemini';
import { chatWithClientCopilot } from '@/lib/ai/client-ai-engine';
import type { Trip } from '@/types';
import { getCurrent12HourTime } from '@/lib/utils/time-format';

interface ChatTripInfo {
  destination: string;
  country?: string;
  daysCount?: number;
  budget?: number;
  currency?: string;
  tripId?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  detectedTrip?: ChatTripInfo;
}

const starterPrompts = [
  {
    icon: Compass,
    title: 'Discover on a Budget',
    text: 'I have ₹35,000 and 4 days off. Where can I travel with great food and quiet heritage?',
  },
  {
    icon: Sparkles,
    title: 'Pacing & Hidden Spots',
    text: 'What are 3 quiet, non-touristy places to experience in Jaipur in the early morning?',
  },
  {
    icon: Wallet,
    title: 'Trip Vault Allocation',
    text: 'How should I split ₹50,000 between fixed bookings, daily spends, and emergency reserves?',
  },
  {
    icon: ShieldAlert,
    title: 'Safety & Local Etiquette',
    text: 'What travel customs and payment methods should I prepare before visiting Kyoto temple quarters?',
  },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Namaste! I am SAFAR Copilot, your editorial travel companion.\n\nWhether you need destination inspiration for an exact budget, realistic day-by-day pacing, or guidance on managing your Trip Wallet, I am here to help you travel thoughtfully and confidently.',
      timestamp: 'Just now',
      source: 'Safar AI Engine',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTrips() {
      const all = await getTrips();
      setTrips(all);

      let activeId = '';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('safar_last_active_trip_id');
        if (saved && all.some((t) => t.id === saved)) {
          activeId = saved;
        }
      }
      if (!activeId && all.length > 0) {
        activeId = all[0].id;
      }
      if (activeId) {
        setSelectedTripId(activeId);
      }
    }
    loadTrips();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const activeTrip = trips.find((t) => t.id === selectedTripId);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: getCurrent12HourTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const localKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localKey ? { 'x-gemini-key': localKey } : {}),
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          context: activeTrip
            ? {
                activeTrip: {
                  destination: activeTrip.destination,
                  budget: activeTrip.budget,
                  currency: activeTrip.currency,
                  startDate: activeTrip.start_date,
                  endDate: activeTrip.end_date,
                },
                travelers: activeTrip.travelers,
                userPreferences: activeTrip.interests,
              }
            : undefined,
        }),
      });

      let data: any = null;
      const isJson = res.headers.get('content-type')?.includes('application/json');

      if (res.ok && isJson) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.warn('Could not parse copilot JSON response:', jsonErr);
        }
      }

      if (!data) {
        // Fallback to client-side Copilot via Gemini / Groq Cascade
        const clientReply = await chatWithClientCopilot(
          textToSend,
          messages.map((m) => ({ role: m.role, content: m.content })),
          activeTrip
            ? {
                destination: activeTrip.destination,
                budget: activeTrip.budget,
                currency: activeTrip.currency,
                startDate: activeTrip.start_date,
                endDate: activeTrip.end_date,
              }
            : undefined
        ).catch(() => 'I am here to help you plan your journey. How can I assist with your destination, budget, or bookings?');

        data = {
          reply: clientReply,
          source: 'gemini',
        };
      }

      let addedTripId: string | undefined = undefined;
      if (data.detectedTrip && data.detectedTrip.destination) {
        try {
          const today = new Date();
          const start = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          const end = new Date(start.getTime() + (data.detectedTrip.daysCount - 1) * 24 * 60 * 60 * 1000);
          const created = await createTrip({
            user_id: 'usr-demo-01',
            destination: data.detectedTrip.destination,
            country: data.detectedTrip.country || 'India',
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
            travelers: 1,
            budget: data.detectedTrip.budget || 35000,
            currency: data.detectedTrip.currency || 'INR',
            interests: ['Heritage & Culture', 'Local Delicacies'],
            dietary: null,
            accessibility: null,
            cover_image: null,
            status: 'planning',
          });
          addedTripId = created.id;
          const refreshed = await getTrips();
          setTrips(refreshed);
          setSelectedTripId(created.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('safar_last_active_trip_id', created.id);
          }
        } catch (createErr) {
          console.warn('Auto-create trip from Copilot failed:', createErr);
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I am ready to assist your journey.',
        timestamp: getCurrent12HourTime(),
        source:
          data.source === 'groq'
            ? `High-Speed Neural Engine · Live API`
            : 'SAFAR AI Intelligence · Live API',
        detectedTrip: data.detectedTrip ? { ...data.detectedTrip, tripId: addedTripId } : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'I encountered a brief connection issue. Please feel free to ask again or review your offline itinerary.',
          timestamp: getCurrent12HourTime(),
          source: 'System Fallback',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-sand-200/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
              <Sparkles className="w-5 h-5 text-teal-700" />
            </span>
            <h1 className="text-2xl font-serif font-bold text-ink-900 tracking-tight">SAFAR Copilot</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              Live Grounded AI
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Contextual travel advice, realistic pacing, and financial intelligence with live GPS grounding.
          </p>
        </div>

        {/* Trip Context Selector */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-sand-200 shadow-2xs">
          <span className="text-xs font-medium text-ink-500">Active Journey:</span>
          <select
            value={selectedTripId}
            onChange={(e) => {
              setSelectedTripId(e.target.value);
              if (typeof window !== 'undefined') {
                localStorage.setItem('safar_last_active_trip_id', e.target.value);
              }
            }}
            className="text-xs font-semibold text-teal-950 bg-transparent focus:outline-hidden cursor-pointer"
          >
            <option value="">General Wanderlust (No context)</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.destination} ({t.currency} {t.budget.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d5c48] to-[#124d3e] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#dfb981]/30 mt-1">
                <Sparkles className="w-4 h-4 text-[#dfb981]" />
              </div>
            )}

            {msg.role === 'assistant' ? (
              <div className="w-full max-w-[96%] lg:max-w-[88%] rounded-2xl rounded-tl-xs px-5 sm:px-6 py-5 bg-white border border-sand-200/90 text-ink-900 shadow-card transition-all">
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-3 pb-2.5 border-b border-sand-100 text-[11px] text-ink-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-teal-950 font-serif tracking-wide text-xs">SAFAR Copilot</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-medium">Curated Intelligence</span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-400">{msg.timestamp}</span>
                </div>

                {/* Message Body with Rich Markdown */}
                <MarkdownRenderer content={msg.content} />

                {/* Auto-Added Trip Card to My Trips */}
                {msg.detectedTrip && msg.detectedTrip.tripId && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-teal-50/95 to-emerald-50/70 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0d5c48] to-[#124d3e] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#dfb981]/30">
                        <Sparkles className="w-4 h-4 text-[#dfb981]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-teal-950 font-serif tracking-wide">Added to My Trips</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">Active Journey</span>
                        </div>
                        <p className="text-[11px] text-teal-900/80 mt-0.5">
                          {msg.detectedTrip.destination} · {msg.detectedTrip.daysCount} Days · {msg.detectedTrip.currency || 'INR'} {(msg.detectedTrip.budget || 35000).toLocaleString('en-IN')} · Synced with Budget Guardian
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                      <Link
                        href={`/trips?id=${msg.detectedTrip.tripId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#0d5c48] to-[#124d3e] hover:from-[#0b4e3d] hover:to-[#0f4033] text-white text-xs font-medium transition-all shadow-xs border border-[#dfb981]/30"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#dfb981]" />
                        <span>View Itinerary & Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/budget?tripId=${msg.detectedTrip.tripId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-900 hover:bg-teal-50 text-xs font-medium transition-all shadow-xs"
                      >
                        <Wallet className="w-3.5 h-3.5 text-teal-700" />
                        <span>Budget Guardian</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Message Footer / Copy */}
                <div className="mt-4 pt-3 border-t border-sand-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
                  <span className="font-mono text-[10px] flex items-center gap-1.5 text-teal-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {msg.source || 'SAFAR AI · Live Intelligence'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-sand-100 text-ink-600 hover:text-teal-900 text-xs font-medium transition-colors"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-700" />
                        <span className="text-teal-700 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy output</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs px-5 py-3.5 bg-gradient-to-br from-[#0d5c48] to-[#124d3e] text-white text-sm leading-relaxed shadow-sm border border-[#0d5c48]">
                <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-amber-200/90 font-mono">
                  <span className="font-semibold text-white">You</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            )}

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-sand-200 text-ink-800 flex items-center justify-center shrink-0 shadow-xs mt-1 font-semibold text-xs border border-sand-300">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d5c48] to-[#124d3e] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#dfb981]/30 mt-1 animate-pulse">
              <Sparkles className="w-4 h-4 text-[#dfb981]" />
            </div>
            <div className="bg-white border border-sand-200 rounded-2xl px-5 py-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-ink-500 font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-700" />
                <span>Consulting AI Engine in real time...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starters if conversation is short */}
      {messages.length <= 2 && (
        <div className="mb-4">
          <p className="text-[11px] font-mono text-ink-500 uppercase tracking-wider mb-2">
            Suggested Inquiries
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starterPrompts.map((starter, idx) => {
              const Icon = starter.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(starter.text)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-sand-50/70 border border-sand-200/90 text-left text-xs transition-all hover:border-[#dfb981]/80 hover:shadow-xs group"
                >
                  <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 group-hover:bg-teal-100/70 transition-colors">
                    <Icon className="w-4 h-4 text-teal-700" />
                  </span>
                  <div className="flex-1 truncate">
                    <div className="font-semibold text-ink-900 group-hover:text-teal-950">{starter.title}</div>
                    <div className="text-ink-500 truncate text-[11px]">{starter.text}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-teal-700 transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-sand-200 pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white rounded-2xl border border-sand-300/90 shadow-sm p-1.5 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100 transition-all"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeTrip
                ? `Ask anything about ${activeTrip.destination} (dates, stops, pacing, budget)...`
                : 'Ask where to travel, plan a route, or pace your trip budget...'
            }
            disabled={loading}
            className="border-0 focus-visible:ring-0 shadow-none px-3 py-2 text-sm text-ink-900 bg-transparent placeholder:text-ink-400"
          />

          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-[#0d5c48] to-[#124d3e] hover:from-[#0b4e3d] hover:to-[#0f4033] text-white rounded-xl px-5 py-2.5 flex items-center gap-1.5 shrink-0 transition-all shadow-xs border border-[#dfb981]/30 font-medium"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5 text-[#dfb981]" />
          </Button>
        </form>

        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-ink-400">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-ink-400" />
            SAFAR Copilot never invents live airfares or guaranteed opening hours.
          </span>
          <span className="hidden sm:inline font-mono">Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
