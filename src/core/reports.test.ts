import { describe, expect, it } from 'vitest';
import {
  accountBalances,
  averageMonthly,
  budgetProgress,
  categoryTotals,
  monthlySeries,
  topExpenses,
  totalBalance,
  totals,
  totalsInMonth,
  transactionsInMonth,
} from './reports';
import { makeState, REF } from './testFixtures';

describe('totals', () => {
  it('separates income and expense', () => {
    const state = makeState();
    expect(totals(state.transactions)).toEqual({
      income: 5_000_000,
      expense: 350_000,
      net: 4_650_000,
    });
  });

  it('filters by month', () => {
    const state = makeState();
    expect(transactionsInMonth(state.transactions, REF)).toHaveLength(3);
    expect(totalsInMonth(state.transactions, REF)).toEqual({
      income: 5_000_000,
      expense: 250_000,
      net: 4_750_000,
    });
  });
});

describe('accounts', () => {
  it('applies opening balances and transactions', () => {
    const state = makeState();
    const balances = accountBalances(state.accounts, state.transactions);
    expect(balances[0]).toMatchObject({ balance: 5_800_000, income: 5_000_000, expense: 200_000 });
    expect(balances[1]).toMatchObject({ balance: -150_000, income: 0, expense: 150_000 });
    expect(totalBalance(state.accounts, state.transactions)).toBe(5_650_000);
  });
});

describe('category totals', () => {
  it('groups expenses and computes shares', () => {
    const state = makeState();
    const result = categoryTotals(state.transactions, state.categories, 'expense');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ categoryId: 'c-food', amount: 300_000, share: 300_000 / 350_000 });
    expect(result[1]).toMatchObject({ categoryId: null, name: 'بدون دسته', amount: 50_000 });
  });

  it('returns an empty list for a type without transactions', () => {
    expect(categoryTotals([], [], 'income')).toEqual([]);
  });
});

describe('monthly series', () => {
  it('builds a chronological series', () => {
    const state = makeState();
    const series = monthlySeries(state.transactions, REF, 3);
    expect(series.map((entry) => entry.ref.jm)).toEqual([6, 7, 8]);
    expect(series[1]).toMatchObject({ income: 0, expense: 100_000, net: -100_000 });
    expect(series[2].income).toBe(5_000_000);
  });

  it('averages the series', () => {
    const series = monthlySeries(makeState().transactions, REF, 3);
    expect(averageMonthly(series)).toEqual({
      income: 1_666_667,
      expense: 116_667,
      net: 1_550_000,
    });
  });

  it('handles an empty series', () => {
    expect(averageMonthly([])).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe('budgets', () => {
  it('computes spent, remaining and ratio', () => {
    const state = makeState();
    const progress = budgetProgress(state.budgets, state.categories, state.transactions, REF);
    expect(progress).toHaveLength(2);
    expect(progress[0]).toMatchObject({
      categoryId: 'c-food',
      amount: 300_000,
      spent: 200_000,
      remaining: 100_000,
    });
    expect(progress[0].ratio).toBeCloseTo(2 / 3);
    expect(progress[1]).toMatchObject({ categoryId: 'c-transport', spent: 0, remaining: 100_000 });
  });

  it('ignores budgets for income categories', () => {
    const state = makeState({
      budgets: [{ categoryId: 'c-salary', amount: 1_000_000 }],
    });
    expect(budgetProgress(state.budgets, state.categories, state.transactions, REF)).toEqual([]);
  });
});

describe('top expenses', () => {
  it('sorts the largest expenses', () => {
    const state = makeState();
    expect(topExpenses(state.transactions, 2).map((item) => item.id)).toEqual(['t1', 't4']);
  });
});
