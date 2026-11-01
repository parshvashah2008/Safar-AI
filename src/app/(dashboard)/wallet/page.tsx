'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Plus,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMoney, formatDate } from '@/lib/utils';
import { formatTo12Hour } from '@/lib/utils/time-format';
import { SYNC_EVENTS, emitWalletChange, useActiveSearch } from '@/lib/services/sync-bus';
import { getTrips } from '@/lib/services/trip-service';
import { getWalletForTrip, getWalletTransactions, fundWallet, updateWalletLimits, computeWalletSpendable } from '@/lib/services/wallet-service';
import type { Trip, WalletAccount, WalletTransaction } from '@/types';

function WalletContent() {
  const searchParams = useSearchParams();
  const { activeSearch } = useActiveSearch();
  const initialTripId = searchParams?.get('tripId') || '';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>(initialTripId);
  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [fundAmount, setFundAmount] = useState('10000');
  const [fundingLoading, setFundingLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const [dailyLimit, setDailyLimit] = useState('');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('');

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
      if (selectedTripId) loadWalletData(selectedTripId);
    };
    window.addEventListener(SYNC_EVENTS.WALLET_CHANGED, handleSync);
    window.addEventListener(SYNC_EVENTS.TRIP_CHANGED, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENTS.WALLET_CHANGED, handleSync);
      window.removeEventListener(SYNC_EVENTS.TRIP_CHANGED, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      loadWalletData(selectedTripId);
    }
  }, [selectedTripId]);

  const loadData = async () => {
    const tripList = await getTrips();
    setTrips(tripList);

    let activeId = initialTripId;
    if (!activeId && typeof window !== 'undefined') {
      const saved = localStorage.getItem('safar_last_active_trip_id');
      if (saved && tripList.some((t) => t.id === saved)) {
        activeId = saved;
      }
    }
    if (!activeId && tripList.length > 0) {
      activeId = tripList[0].id;
    }

    setSelectedTripId(activeId);
    if (activeId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('safar_last_active_trip_id', activeId);
      }
      await loadWalletData(activeId);
    }
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('safar_last_active_trip_id', tripId);
    }
  };

  const loadWalletData = async (tripId: string) => {
    const w = await getWalletForTrip(tripId);
    setWallet(w);
    setDailyLimit(w.daily_limit ? String(w.daily_limit) : '');
    setLowBalanceThreshold(w.low_balance_threshold ? String(w.low_balance_threshold) : '');
    const txns = await getWalletTransactions(w.id);
    setTransactions(txns);
  };

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !selectedTripId) return;
    const num = Number(fundAmount);
    if (num <= 0) return;

    setFundingLoading(true);
    const { wallet: updated, transaction } = await fundWallet(wallet.id, num, selectedTripId);
    setWallet({ ...updated });
    setTransactions((prev) => [transaction, ...prev]);
    setFundingLoading(false);
    emitWalletChange();
    setNotice(`Allocated ${formatMoney(num, wallet.currency)} into your Trip Wallet.`);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleSaveLimits = async () => {
    if (!wallet || !selectedTripId) return;
    const updated = await updateWalletLimits(selectedTripId, {
      daily_limit: dailyLimit ? Number(dailyLimit) : null,
      low_balance_threshold: lowBalanceThreshold ? Number(lowBalanceThreshold) : null,
    });
    setWallet({ ...updated });
    setNotice('Spending limits & threshold alerts updated.');
    setTimeout(() => setNotice(''), 3500);
  };

  const activeTrip = trips.find((t) => t.id === selectedTripId);
  const plannedBudget = activeTrip?.budget || 45000;
  const currency = wallet?.currency || 'INR';
  const spendableBalance = wallet ? computeWalletSpendable(wallet) : 0;

  return (
    <div className="space-y-8">
      {/* Strict Demo-Mode Compliance Banner */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
        <ShieldAlert className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-2">
            <span>SAFAR TRIP WALLET — DEMO VAULT ENVIRONMENT</span>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 font-mono text-[9px] uppercase font-bold text-amber-800">
              SIMULATED
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Per RBI PPI & fintech compliance standards, holding real customer deposits requires an authorized banking/PPI issuing partner.
            All transactions and balances displayed below operate in high-fidelity sandbox simulation to verify budget controls and guardrails before live card issuance.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-teal-700 font-semibold">
            FINTECH TRAVEL ACCOUNT & SPENDING VAULT
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-medium tracking-tight mt-1 text-ink">
            Trip Wallet
          </h1>
          <p className="text-xs sm:text-sm text-ink-400 mt-1">
            Fund your trip, enforce daily spending caps, and prevent unexpected overspending on the road.
          </p>
        </div>

        {trips.length > 0 && (
          <div className="w-full sm:w-64">
            <Label className="text-[10px] font-mono uppercase text-ink-400 mb-1 block">Active Trip</Label>
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

      {/* Synchronized Home Search Vault Banner */}
      {activeSearch.destination && (
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0d5c48] dark:text-emerald-400 shrink-0" />
            <span className="text-[#111a16] dark:text-[#edf2ee]">
              Active Journey Vault for <strong className="text-[#0d5c48] dark:text-emerald-300 underline">{activeSearch.destination}</strong>: Planned Cap <strong>₹{activeSearch.budget.toLocaleString()}</strong> ({activeSearch.travelers} travelers)
            </span>
          </div>
          <Link href={`/plan?destination=${encodeURIComponent(activeSearch.destination)}&travelers=${activeSearch.travelers}&budget=${activeSearch.budget}`}>
            <Button size="sm" className="h-7 text-[11px] bg-[#0d5c48] hover:bg-[#094032] text-white rounded-lg font-semibold shrink-0">
              Open Full Planner →
            </Button>
          </Link>
        </div>
      )}

      {notice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            1. Planned Trip Budget
          </span>
          <div className="font-editorial text-xl sm:text-2xl font-medium text-ink">
            {formatMoney(plannedBudget, currency)}
          </div>
          <span className="text-[10px] text-ink-400 mt-1 block">Full itinerary allocation</span>
        </div>

        <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-teal-700 block mb-1 font-semibold">
            2. Wallet Funded Goal
          </span>
          <div className="font-editorial text-xl sm:text-2xl font-medium text-teal-900">
            {formatMoney(wallet?.funded_amount || 0, currency)}
          </div>
          <span className="text-[10px] text-teal-700 mt-1 block">Transferred into vault</span>
        </div>

        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            3. Spendable Balance Now
          </span>
          <div className="font-editorial text-xl sm:text-2xl font-medium text-sand-800">
            {formatMoney(spendableBalance, currency)}
          </div>
          <span className="text-[10px] text-ink-400 mt-1 block">Available for live card use</span>
        </div>

        <div className="rounded-2xl border border-ivory-300 bg-white p-5 shadow-card">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-400 block mb-1">
            4. Unfunded Planned Margin
          </span>
          <div className="font-editorial text-xl sm:text-2xl font-medium text-ink">
            {formatMoney(Math.max(0, plannedBudget - (wallet?.funded_amount || 0)), currency)}
          </div>
          <span className="text-[10px] text-ink-400 mt-1 block">Reserve in bank</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="relative aspect-[1.58/1] w-full rounded-2xl p-6 bg-gradient-to-br from-teal-800 via-teal-900 to-ink-900 text-white shadow-elevated flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-sand-300">
                  SAFAR TRAVEL VAULT
                </span>
                <div className="font-editorial text-lg font-medium mt-0.5">
                  {activeTrip?.destination || 'Global Journey'}
                </div>
              </div>
              <CreditCard className="h-6 w-6 text-sand-300" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-white/60">Spendable Card Balance</span>
              <div className="font-mono text-2xl font-semibold tracking-tight">
                {formatMoney(spendableBalance, currency)}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-white/70 pt-2 border-t border-white/15">
              <span>VAULT ID: {wallet?.provider_account_id || 'DEMO-4921'}</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px]">ACTIVE</span>
            </div>
          </div>

          <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-ivory-200 pb-3">
              <Plus className="h-4 w-4 text-teal-600" />
              <h3 className="font-editorial text-lg font-medium text-ink">Fund Trip Wallet</h3>
            </div>

            <form onSubmit={handleFund} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="topup-amount">Allocation Amount ({currency})</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                {['5000', '10000', '20000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFundAmount(val)}
                    className="flex-1 rounded-lg border border-ivory-300 py-1.5 text-xs font-mono text-ink-500 hover:bg-ivory-100"
                  >
                    +₹{Number(val).toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <Button type="submit" disabled={fundingLoading} className="w-full text-xs">
                {fundingLoading ? 'Authorizing Simulated Transfer…' : 'Add to Wallet Vault'}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 border-b border-ivory-200 pb-3">
              <Sliders className="h-4 w-4 text-sand-700" />
              <h3 className="font-editorial text-lg font-medium text-ink">Spending Guardrails</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="daily-cap">Daily Spend Limit ({currency})</Label>
                <Input
                  id="daily-cap"
                  type="number"
                  placeholder="e.g. 8000"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="low-thresh">Low Balance Alert Threshold ({currency})</Label>
                <Input
                  id="low-thresh"
                  type="number"
                  placeholder="e.g. 3000"
                  value={lowBalanceThreshold}
                  onChange={(e) => setLowBalanceThreshold(e.target.value)}
                />
              </div>

              <Button size="sm" variant="outline" onClick={handleSaveLimits} className="w-full text-xs">
                Update Spending Controls
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-ivory-300 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
            <div>
              <h3 className="font-editorial text-lg font-medium text-ink">
                Immutable Financial Journal
              </h3>
              <p className="text-[11px] text-ink-400">
                Audited ledger of authorizations, settlements, and funding events.
              </p>
            </div>
            <span className="font-mono text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md">
              JOURNAL OK
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-16 text-center text-xs text-ink-400">
              No transactions recorded in this wallet yet.
            </div>
          ) : (
            <div className="divide-y divide-ivory-200">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'funding' || tx.type === 'refund';
                return (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                          isCredit ? 'bg-teal-50 text-teal-700' : 'bg-sand-50 text-sand-800'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-ink">{tx.description}</div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-ink-400">
                          <span className="uppercase">{tx.type.replace('_', ' ')}</span>
                          <span>·</span>
                          <span>{formatDate(tx.created_at.slice(0, 10))} at {formatTo12Hour(tx.created_at)}</span>
                          <span>·</span>
                          <span>{tx.status.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-mono text-xs font-semibold ${
                        isCredit ? 'text-teal-700' : 'text-ink'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {formatMoney(tx.amount, tx.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-500 font-mono">Loading Trip Vault...</div>}>
      <WalletContent />
    </Suspense>
  );
}
