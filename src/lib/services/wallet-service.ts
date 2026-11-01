import { generateId } from '@/lib/utils';
import type { WalletAccount, WalletTransaction, TransactionType } from '@/types';

const memoryWallets = new Map<string, WalletAccount>();
const memoryTransactions = new Map<string, WalletTransaction[]>();

function initializeDemoWallet() {
  // Clean initialization - no hardcoded demo trips or fake transactions
}

initializeDemoWallet();

export async function getWalletForTrip(tripId: string): Promise<WalletAccount> {
  initializeDemoWallet();
  let wallet = memoryWallets.get(tripId);
  if (!wallet) {
    wallet = {
      id: generateId(),
      trip_id: tripId,
      user_id: 'usr-demo-01',
      provider: 'SAFAR_DEMO_VAULT',
      provider_account_id: null,
      funded_amount: 0,
      spent_amount: 0,
      pending_amount: 0,
      currency: 'INR',
      daily_limit: 10000,
      trip_limit: null,
      low_balance_threshold: 3000,
      is_demo: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryWallets.set(tripId, wallet);
    memoryTransactions.set(wallet.id, []);
  }
  return wallet;
}

export async function getWalletTransactions(walletId: string): Promise<WalletTransaction[]> {
  initializeDemoWallet();
  return memoryTransactions.get(walletId) || [];
}

export async function fundWallet(walletId: string, amount: number, tripId: string): Promise<{ wallet: WalletAccount; transaction: WalletTransaction }> {
  initializeDemoWallet();
  let wallet = memoryWallets.get(tripId);
  if (!wallet) {
    wallet = await getWalletForTrip(tripId);
  }

  wallet.funded_amount += amount;
  wallet.updated_at = new Date().toISOString();
  memoryWallets.set(tripId, wallet);

  const txn: WalletTransaction = {
    id: generateId(),
    wallet_id: wallet.id,
    trip_id: tripId,
    type: 'funding',
    status: 'completed',
    amount,
    currency: wallet.currency,
    description: `Trip Wallet Funding (Simulated Demo Vault Deposit)`,
    provider_ref: `DEMO-FUND-${Date.now().toString(36).toUpperCase()}`,
    idempotency_key: generateId(),
    metadata: { demoSimulation: true, channel: 'Instant Demo Top-Up' },
    created_at: new Date().toISOString(),
  };

  const list = memoryTransactions.get(wallet.id) || [];
  list.unshift(txn);
  memoryTransactions.set(wallet.id, list);

  return { wallet, transaction: txn };
}

export async function updateWalletLimits(
  tripId: string,
  limits: { daily_limit?: number | null; trip_limit?: number | null; low_balance_threshold?: number | null }
): Promise<WalletAccount> {
  const wallet = await getWalletForTrip(tripId);
  if (limits.daily_limit !== undefined) wallet.daily_limit = limits.daily_limit;
  if (limits.trip_limit !== undefined) wallet.trip_limit = limits.trip_limit;
  if (limits.low_balance_threshold !== undefined) wallet.low_balance_threshold = limits.low_balance_threshold;
  wallet.updated_at = new Date().toISOString();
  memoryWallets.set(tripId, wallet);
  return wallet;
}

export function computeWalletSpendable(wallet: WalletAccount): number {
  return Math.max(0, wallet.funded_amount - wallet.spent_amount - wallet.pending_amount);
}
