import { generateId } from '@/lib/utils';
import type { Expense, ExpenseCategory } from '@/types';

const STORAGE_KEY_EXPENSES = 'safar_expenses_v1';

let memoryExpenses: Expense[] = [];

function initExpenses() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (stored) {
        memoryExpenses = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not load expenses:', e);
    }
  }
}

function persistExpenses() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(memoryExpenses));
    } catch (e) {
      console.warn('Could not save expenses:', e);
    }
  }
}

export async function getExpenses(tripId?: string): Promise<Expense[]> {
  initExpenses();
  if (!tripId) return memoryExpenses;
  return memoryExpenses.filter((e) => e.trip_id === tripId);
}

export async function addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  initExpenses();
  const newExp: Expense = {
    ...expense,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  memoryExpenses.unshift(newExp);
  persistExpenses();
  return newExp;
}

export function calculateTripFinancials(budget: number, expenses: Expense[]) {
  const totalCents = expenses.reduce((sum, e) => {
    if (e.is_refunded) return sum;
    return sum + Math.round(e.amount * 100);
  }, 0);

  const spent = totalCents / 100;
  const remaining = Math.max(0, budget - spent);
  const utilization = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  const categories: Record<ExpenseCategory, number> = {
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
    if (!e.is_refunded) {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    }
  });

  return {
    spent,
    remaining,
    utilization,
    utilizationPercent: utilization,
    plannedBudget: budget,
    remainingBudget: remaining,
    isOverBudget: spent > budget,
    isNearBudget: spent >= budget * 0.85 && spent <= budget,
    categories,
    totalSpent: spent,
  };
}

export function checkBudgetWarning(proposedAmount: number, currentSpent: number, budget: number): {
  willOverrun: boolean;
  message: string;
  severity: 'normal' | 'warning' | 'critical';
} {
  const newTotal = currentSpent + proposedAmount;
  if (budget <= 0) return { willOverrun: false, message: 'No budget set.', severity: 'normal' };
  if (newTotal > budget) {
    const overrun = newTotal - budget;
    return {
      willOverrun: true,
      message: `Adding this will exceed your total planned budget by ₹${overrun.toLocaleString('en-IN')}.`,
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

