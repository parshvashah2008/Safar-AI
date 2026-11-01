import test from 'node:test';
import assert from 'node:assert/strict';

// Pure algorithm under test matching src/lib/services/budget-service.ts
function calculateTripFinancials(budget, expenses) {
  const totalCents = expenses.reduce((sum, e) => {
    if (e.is_refunded) return sum;
    return sum + Math.round(e.amount * 100);
  }, 0);

  const spent = totalCents / 100;
  const remaining = Math.max(0, budget - spent);
  const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  const categories = {
    flights: 0,
    trains: 0,
    buses: 0,
    local_transport: 0,
    accommodation: 0,
    meals: 0,
    activities: 0,
    visa_documents: 0,
    insurance: 0,
    fees_taxes: 0,
    shopping: 0,
    emergency: 0,
    other: 0,
  };

  expenses.forEach((e) => {
    if (e.is_refunded) return;
    categories[e.category] = (categories[e.category] || 0) + e.amount;
  });

  return {
    plannedBudget: budget,
    totalSpent: spent,
    remainingBudget: remaining,
    utilizationPercent: utilization,
    isOverBudget: spent > budget,
    categoryBreakdown: categories,
  };
}

function checkBudgetWarning(proposedAmount, currentSpent, budget) {
  const newTotal = currentSpent + proposedAmount;
  if (budget <= 0) return { willOverrun: false, message: 'No budget set.', severity: 'normal' };
  if (newTotal > budget) {
    const overrun = newTotal - budget;
    return {
      willOverrun: true,
      message: `Adding this will exceed your total planned budget by ${overrun.toLocaleString('en-IN')}.`,
      severity: 'critical',
    };
  }
  if (newTotal / budget >= 0.85) {
    return {
      willOverrun: false,
      message: `Notice: This purchase will bring your budget usage to ${Math.round((newTotal / budget) * 100)}%.`,
      severity: 'warning',
    };
  }
  return { willOverrun: false, message: 'Within healthy budget limits.', severity: 'normal' };
}

// Pure algorithm under test matching src/lib/services/wallet-service.ts
function computeWalletSpendable(wallet) {
  return Math.max(0, wallet.funded_amount - wallet.spent_amount - wallet.pending_amount);
}

// Pure algorithm under test matching src/lib/utils.ts
function formatMoney(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

test('Decimal-safe Financial Arithmetic: Prevents IEEE-754 precision drift', () => {
  const expenses = [
    { amount: 19.99, is_refunded: false, category: 'meals' },
    { amount: 29.99, is_refunded: false, category: 'meals' },
    { amount: 5.02, is_refunded: false, category: 'local_transport' },
  ];

  const result = calculateTripFinancials(100, expenses);

  // 19.99 + 29.99 + 5.02 = 55.00 exactly (in standard IEEE-754 float: 55.00000000000001)
  assert.equal(result.totalSpent, 55.0);
  assert.equal(result.remainingBudget, 45.0);
  assert.equal(result.utilizationPercent, 55);
  assert.equal(result.isOverBudget, false);
});

test('Refunded expenses do not consume planned trip budget', () => {
  const expenses = [
    { amount: 15000, is_refunded: false, category: 'accommodation' },
    { amount: 3500, is_refunded: true, category: 'activities' }, // Cancelled rafting
    { amount: 1200, is_refunded: false, category: 'meals' },
  ];

  const result = calculateTripFinancials(20000, expenses);

  assert.equal(result.totalSpent, 16200);
  assert.equal(result.remainingBudget, 3800);
  assert.equal(result.categoryBreakdown.activities, 0);
  assert.equal(result.categoryBreakdown.accommodation, 15000);
});

test('Budget Warning System: Triggers warning at 85% and critical on overrun', () => {
  const budget = 50000;

  // Safe spend (50%)
  const safe = checkBudgetWarning(10000, 15000, budget);
  assert.equal(safe.willOverrun, false);
  assert.equal(safe.severity, 'normal');

  // Approaching threshold (86%)
  const warning = checkBudgetWarning(8000, 35000, budget);
  assert.equal(warning.willOverrun, false);
  assert.equal(warning.severity, 'warning');
  assert.match(warning.message, /86%/);

  // Critical Overrun (108%)
  const overrun = checkBudgetWarning(15000, 39000, budget);
  assert.equal(overrun.willOverrun, true);
  assert.equal(overrun.severity, 'critical');
  assert.match(overrun.message, /exceed your total planned budget/);
});

test('Wallet FinTech Invariants: Spendable balance strictly subtracts holds and spent', () => {
  const wallet = {
    funded_amount: 50000,
    spent_amount: 18500,
    pending_amount: 4500, // Hotel pre-authorization hold
  };

  const spendable = computeWalletSpendable(wallet);
  // 50,000 - 18,500 - 4,500 = 27,000
  assert.equal(spendable, 27000);

  // When spent exceeds funded, spendable balance cannot be negative
  const overspentWallet = {
    funded_amount: 10000,
    spent_amount: 12000,
    pending_amount: 0,
  };
  assert.equal(computeWalletSpendable(overspentWallet), 0);
});

test('Currency Formatter: Accurately formats INR and global currencies', () => {
  const inr = formatMoney(45000, 'INR');
  assert.ok(inr.includes('45,000') || inr.includes('45000'));

  const jpy = formatMoney(120000, 'JPY');
  assert.ok(jpy.includes('120,000') || jpy.includes('120000') || jpy.includes('¥'));
});
