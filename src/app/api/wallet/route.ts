import { NextRequest, NextResponse } from 'next/server';
import { getWalletForTrip, getWalletTransactions, fundWallet, updateWalletLimits, computeWalletSpendable } from '@/lib/services/wallet-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('tripId') || 'demo-jaipur-2026';

    const wallet = await getWalletForTrip(tripId);
    const transactions = await getWalletTransactions(wallet.id);
    const spendable = computeWalletSpendable(wallet);

    return NextResponse.json({
      wallet,
      spendable,
      transactions,
    });
  } catch (error: any) {
    console.error('Wallet GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tripId = 'demo-jaipur-2026', amount, limits } = body;

    const wallet = await getWalletForTrip(tripId);

    if (action === 'fund') {
      const topUpAmount = Number(amount);
      if (isNaN(topUpAmount) || topUpAmount <= 0) {
        return NextResponse.json({ error: 'Valid top-up amount is required.' }, { status: 400 });
      }

      const result = await fundWallet(wallet.id, topUpAmount, tripId);
      const spendable = computeWalletSpendable(result.wallet);

      return NextResponse.json({
        wallet: result.wallet,
        transaction: result.transaction,
        spendable,
        message: `Successfully allocated ₹${topUpAmount.toLocaleString('en-IN')} to trip vault.`,
      });
    }

    if (action === 'update_limits') {
      const updated = await updateWalletLimits(tripId, limits || {});
      const spendable = computeWalletSpendable(updated);

      return NextResponse.json({
        wallet: updated,
        spendable,
        message: 'Spending limits updated successfully.',
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Wallet POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
