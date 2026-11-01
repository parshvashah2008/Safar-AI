'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, IndianRupee, Plus, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, formatDate } from '@/lib/utils';
import { getTrips } from '@/lib/services/trip-service';
import { getExpenses, addExpense, calculateTripFinancials, checkBudgetWarning } from '@/lib/services/budget-service';
import { SYNC_EVENTS, emitWalletChange } from '@/lib/services/sync-bus';
import { callAiWithCascade } from '@/lib/ai/client-ai-engine';
import type { Trip, Expense, ExpenseCategory } from '@/types';

function BudgetContent() {
  const searchParams = useSearchParams();
  const initialTripId = searchParams?.get('tripId') || '';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Financial Guardian state
  const [aiAdvisor, setAiAdvisor] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('meals');
  const [paidBy, setPaidBy] = useState('Me');

  const [splitAmount, setSplitAmount] = useState('');
  const [splitPeople, setSplitPeople] = useState('Me, Traveler 2');

  const runAiAudit = async (currentExpenses = expenses, tripToUse = activeTrip) => {
    if (!tripToUse) return;
    setAiLoading(true);
    try {
      let loaded = false;
      try {
        const localGeminiKey = typeof window !== 'undefined' ? localStorage.getItem('safar_gemini_api_key') : null;
        const localGroqKey = typeof window !== 'undefined' ? localStorage.getItem('safar_groq_api_key') : null;
        const res = await fetch('/api/ai/budget-advisor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localGeminiKey ? { 'x-gemini-key': localGeminiKey } : {}),
            ...(localGroqKey ? { 'x-groq-key': localGroqKey } : {}),
          },
          body: JSON.stringify({
            destination: tripToUse.destination,
            budget: tripToUse.budget,
            currency: tripToUse.currency,
            expenses: currentExpenses,
            days: 4,
            travelers: tripToUse.travelers || 2,
          }),
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.advisor) {
            setAiAdvisor(data.advisor);
            loaded = true;
          }
        }
      } catch (srvErr) {}

      // Client AI Fallback
      if (!loaded) {
        const prompt = `Perform a financial budget audit for a trip to ${tripToUse.destination}.
Budget: ${tripToUse.currency} ${tripToUse.budget}.
Expenses logged so far: ${JSON.stringify(currentExpenses)}.
Return JSON ONLY:
{
  "summary": "1-2 sentence assessment of spending velocity",
  "recommendedDailyAllowance": number,
  "topSavingsTip": "1 practical actionable tip for saving money here",
  "burnRateAlert": boolean
}`;
        const raw = await callAiWithCascade(prompt, 'You are a prudent travel finance auditor.', true);
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
        setAiAdvisor(parsed);
      }
    } catch (e) {
      console.warn('AI budget audit error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
      if (selectedTripId) loadExpenses(selectedTripId);
    };
    window.addEventListener(SYNC_EVENTS.TRIP_CHANGED, handleSync);
    window.addEventListener(SYNC_EVENTS.WALLET_CHANGED, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENTS.TRIP_CHANGED, handleSync);
      window.removeEventListener(SYNC_EVENTS.WALLET_CHANGED, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      loadExpenses(selectedTripId);
    }
  }, [selectedTripId]);

  const loadData = async () => {
    setLoading(true);
    const tripsList = await getTrips();
    setTrips(tripsList);

    // Prioritize URL query param, then saved last active trip, then most recently created trip
    let activeId = initialTripId;
    if (!activeId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('safar_last_active_trip_id');
      if (saved && tripsList.some((t) => t.id === saved)) {
        activeId = saved;
      }
    }
    if (!activeId && tripsList.length > 0) {
      activeId = tripsList[0].id;
    }

    setSelectedTripId(activeId);
    if (activeId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('safar_last_active_trip_id', activeId);
      }
      await loadExpenses(activeId);
    }
    setLoading(false);
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safar_last_active_trip_id', tripId);
    }
  };

  const loadExpenses = async (tripId: string) => {
    const list = await getExpenses(tripId);
    setExpenses(list);
    const tripObj = trips.find((t) => t.id === tripId);
    if (tripObj) {
      runAiAudit(list, tripObj);
    }
  };

  const activeTrip = trips.find((t) => t.id === selectedTripId);
  const budget = activeTrip?.budget || 0;
  const currency = activeTrip?.currency || 'INR';

  const financials = calculateTripFinancials(budget, expenses);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const low = val.toLowerCase();
    if (low.includes('taxi') || low.includes('cab') || low.includes('uber') || low.includes('auto') || low.includes('rickshaw') || low.includes('metro') || low.includes('bus')) {
      setCategory('local_transport');
    } else if (low.includes('dinner') || low.includes('lunch') || low.includes('breakfast') || low.includes('food') || low.includes('coffee') || low.includes('tea') || low.includes('dhaba') || low.includes('cafe') || low.includes('restaurant')) {
      setCategory('meals');
    } else if (low.includes('hotel') || low.includes('resort') || low.includes('hostel') || low.includes('airbnb') || low.includes('stay') || low.includes('room') || low.includes('homestay')) {
      setCategory('accommodation');
    } else if (low.includes('flight') || low.includes('airline') || low.includes('airfare')) {
      setCategory('flights');
    } else if (low.includes('train') || low.includes('railway') || low.includes('irctc')) {
      setCategory('trains');
    } else if (low.includes('fort') || low.includes('museum') || low.includes('ticket') || low.includes('safari') || low.includes('entry') || low.includes('tour') || low.includes('temple')) {
      setCategory('activities');
    } else if (low.includes('shopping') || low.includes('souvenir') || low.includes('clothes') || low.includes('bazaar') || low.includes('market')) {
      setCategory('shopping');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!title.trim() || num <= 0 || !selectedTripId) return;

    const newExp = await addExpense({
      trip_id: selectedTripId,
      user_id: 'usr-demo-01',
      title: title.trim(),
      amount: num,
      currency,
      category,
      date: new Date().toISOString().slice(0, 10),
      paid_by: paidBy.trim() || 'Me',
      notes: null,
      receipt_url: null,
      is_refunded: false,
    });

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    emitWalletChange();
    setTitle('');
    setAmount('');
    runAiAudit(updated, activeTrip);
  };

  const warning = amount ? checkBudgetWarning(Number(amount), financials.totalSpent, budget) : null;
  const splitNum = Number(splitAmount) || 0;
  const peopleList = splitPeople.split(',').map((p) => p.trim()).filter(Boolean);
  const perPerson = peopleList.length > 0 ? splitNum / peopleList.length : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 font-semibold">
            FINANCIAL GUARDIAN & EXPENSE LEDGER
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink">
            Budget Guardian
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Exact decimal-safe calculations. Track actual spend vs planned limits.
          </p>
        </div>

        {trips.length > 0 && (
          <div className="w-full sm:w-64">
            <Label className="text-[10px] font-mono uppercase text-ink-400 mb-1 block">Active Journey</Label>
            <select
              value={selectedTripId}
              onChange={(e) => handleTripChange(e.target.value)}
              className="w-full h-10 rounded-xl border border-ivory-300 bg-white px-3 text-xs text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.destination} ({formatMoney(t.budget, t.currency)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            Planned Budget
          </span>
          <div className="font-editorial text-2xl font-medium text-ink">
            {formatMoney(financials.plannedBudget, currency)}
          </div>
          <span className="text-[11px] text-ink-400 mt-2 block">Set during trip creation</span>
        </div>

        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            Total Spent So Far
          </span>
          <div className="font-editorial text-2xl font-medium text-teal-700">
            {formatMoney(financials.totalSpent, currency)}
          </div>
          <span className="text-[11px] text-ink-400 mt-2 block">
            {financials.utilizationPercent}% of trip budget
          </span>
        </div>

        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            Remaining Allowance
          </span>
          <div className={`font-editorial text-2xl font-medium ${financials.isOverBudget ? 'text-red-600' : 'text-ink'}`}>
            {formatMoney(financials.remainingBudget, currency)}
          </div>
          <span className="text-[11px] text-ink-400 mt-2 block">
            {financials.isOverBudget ? 'Budget exceeded' : 'Healthy margin remaining'}
          </span>
        </div>

        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            Recorded Transactions
          </span>
          <div className="font-editorial text-2xl font-medium text-sand-800">
            {expenses.length}
          </div>
          <span className="text-[11px] text-ink-400 mt-2 block">Immutable expense records</span>
        </div>
      </div>

      <div className="rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 shadow-card space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-ink-400 dark:text-[#8ca397] uppercase">Trip Spending Velocity</span>
          <span className="font-semibold text-ink dark:text-[#edf2ee]">{financials.utilizationPercent}% of total cap</span>
        </div>
        <div className="h-3 w-full rounded-full bg-ivory-200 dark:bg-[#1c2a22] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              financials.utilizationPercent > 90
                ? 'bg-red-500'
                : financials.utilizationPercent > 75
                ? 'bg-amber-500'
                : 'bg-teal-600 dark:bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, financials.utilizationPercent)}%` }}
          />
        </div>
      </div>

      {/* Autonomous AI Budget Guardian Analysis */}
      <div className="rounded-2xl border border-teal-200 dark:border-emerald-800/60 bg-gradient-to-br from-teal-50/70 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-[#14231b] dark:to-[#0c1410] p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 dark:border-emerald-900/40 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-800 dark:bg-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-[#edf2ee] flex items-center gap-2">
                <span>Autonomous AI Financial Guardian</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-bold">
                  {aiAdvisor?.statusLabel || 'LIVE AUDIT'}
                </span>
              </h3>
              <p className="text-xs text-ink-500 dark:text-[#8ca397]">
                Real-time burn rate velocity & localized cost-reduction intelligence.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={aiLoading}
            onClick={() => runAiAudit(expenses, activeTrip)}
            className="text-xs gap-1.5 border-teal-300 dark:border-emerald-700 text-teal-800 dark:text-emerald-300 hover:bg-teal-50 dark:hover:bg-[#1a2820]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{aiLoading ? 'Auditing with AI…' : 'Refresh AI Audit'}</span>
          </Button>
        </div>

        {aiAdvisor ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-teal-100 dark:border-[#22352b] bg-white/80 dark:bg-[#15221b] space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Daily Burn Velocity</span>
                <span className="text-base font-bold text-ink dark:text-[#edf2ee] font-mono">
                  {formatMoney(aiAdvisor.burnRatePerDay || 0, currency)} <span className="text-xs font-normal text-ink-400">/ day</span>
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-teal-100 dark:border-[#22352b] bg-white/80 dark:bg-[#15221b] space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Projected Total Trip Spend</span>
                <span className="text-base font-bold text-teal-800 dark:text-emerald-300 font-mono">
                  {formatMoney(aiAdvisor.projectedTotal || 0, currency)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-teal-100 dark:border-[#22352b] bg-white/80 dark:bg-[#15221b] space-y-1">
                <span className="text-[10px] font-mono uppercase text-ink-400 dark:text-[#8ca397] block">Budget Margin Status</span>
                <span className={`text-base font-bold font-mono ${aiAdvisor.willOverrun ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {aiAdvisor.willOverrun ? `Overrun by ${formatMoney(aiAdvisor.overrunAmount, currency)}` : 'On Target'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#15221b] border border-teal-100 dark:border-[#22352b] space-y-2">
              <p className="text-xs text-ink-600 dark:text-[#a8beaf] leading-relaxed">
                {aiAdvisor.executiveSummary}
              </p>
              {aiAdvisor.categoryAnalysis && (
                <p className="text-xs text-ink-500 dark:text-[#7f9587] font-medium border-t border-ivory-200 dark:border-[#1e2e26] pt-2">
                  📊 {aiAdvisor.categoryAnalysis}
                </p>
              )}
            </div>

            {aiAdvisor.actionableSavings && aiAdvisor.actionableSavings.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono uppercase font-bold text-teal-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <span>💡 Localized AI Cost-Saving Actions:</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {aiAdvisor.actionableSavings.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-1 font-semibold text-amber-900 dark:text-amber-200">
                        <span>{s.category || 'Savings Action'}</span>
                        <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-800 dark:text-amber-300 font-bold">{s.potentialSaving}</span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                        {s.tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center space-y-2">
            <p className="text-xs text-ink-500 dark:text-[#8ca397]">
              Click below to initiate an autonomous AI financial audit across your logged expenses and destination.
            </p>
            <Button
              size="sm"
              onClick={() => runAiAudit(expenses, activeTrip)}
              className="bg-teal-800 hover:bg-teal-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Launch AI Financial Guardian Audit</span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 rounded-2xl border border-ivory-300 dark:border-[#1e2e26] bg-white dark:bg-[#121c17] p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 dark:border-[#1e2e26] pb-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-teal-600 dark:text-emerald-400" />
              <h3 className="font-editorial text-lg font-medium text-ink dark:text-[#edf2ee]">Record Travel Expense</h3>
            </div>
            <span className="text-[10px] font-mono text-teal-700 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-emerald-800/40">
              AI AUTO-CATEGORIZATION
            </span>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-title">What did you spend on?</Label>
              <Input
                id="exp-title"
                required
                placeholder="e.g. Traditional dinner, Taxi to fort"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Amount ({currency})</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-cat">Category</Label>
                <select
                  id="exp-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full h-10 rounded-xl border border-ivory-300 bg-white px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="meals">Meals & Dining</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="flights">Flights</option>
                  <option value="trains">Trains</option>
                  <option value="local_transport">Local Transport</option>
                  <option value="activities">Tickets & Activities</option>
                  <option value="shopping">Shopping</option>
                  <option value="other">Other / Misc</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-paid">Paid By</Label>
              <Input
                id="exp-paid"
                placeholder="Me"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              />
            </div>

            {warning && (
              <div
                className={`rounded-xl p-3 text-xs flex items-center gap-2 border ${
                  warning.severity === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : warning.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-teal-50 border-teal-200 text-teal-800'
                }`}
              >
                {warning.severity === 'critical' ? (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{warning.message}</span>
              </div>
            )}

            <Button type="submit" className="w-full text-xs">
              Save Expense to Ledger
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-ivory-200 space-y-3">
            <div className="flex items-center gap-2 text-ink font-semibold text-xs">
              <Users className="h-4 w-4 text-sand-700" />
              <span>Equal Group Split Calculator</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Total bill"
                value={splitAmount}
                onChange={(e) => setSplitAmount(e.target.value)}
              />
              <Input
                placeholder="Names separated by comma"
                value={splitPeople}
                onChange={(e) => setSplitPeople(e.target.value)}
              />
            </div>
            {splitNum > 0 && peopleList.length > 0 && (
              <div className="rounded-xl bg-ivory-100 p-3 text-xs text-ink flex items-center justify-between">
                <span>Share per person ({peopleList.length} people):</span>
                <span className="font-semibold text-teal-700 font-mono">
                  {formatMoney(perPerson, currency)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
            <h3 className="font-editorial text-lg font-medium text-ink">
              Expense Records ({expenses.length})
            </h3>
            <span className="font-mono text-[10px] text-teal-700 font-semibold uppercase">
              Dec-Safe Accurate
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-400">
              No expenses recorded for this trip yet.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {expenses.map((e) => (
                <div key={e.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-ink">{e.title}</div>
                    <div className="flex items-center gap-2 text-[11px] text-ink-400">
                      <span className="capitalize font-mono text-[10px] text-teal-700">{e.category}</span>
                      <span>·</span>
                      <span>{formatDate(e.date)}</span>
                      <span>·</span>
                      <span>Paid by {e.paid_by}</span>
                    </div>
                  </div>

                  <div className="font-semibold font-mono text-xs text-ink">
                    {formatMoney(e.amount, e.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500 font-mono">Loading Budget Guardian...</div>}>
      <BudgetContent />
    </Suspense>
  );
}
