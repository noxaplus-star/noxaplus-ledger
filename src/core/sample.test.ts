import { describe, expect, it } from 'vitest';
import { addMonths, todayJalali } from './jalali';
import { createEmptyState, createSampleState } from './sample';
import { validateState } from './storage';
import { totalsInMonth } from './reports';

const NOW = new Date(2026, 10, 12);

describe('sample data', () => {
  const state = createSampleState(NOW);
  const current = todayJalali(NOW);

  it('passes storage validation', () => {
    expect(validateState(state)).toEqual({ ok: true, state });
  });

  it('covers six months ending in the current month', () => {
    const months = new Set(state.transactions.map((transaction) => transaction.date.slice(0, 7)));
    expect(months.size).toBe(6);
    expect(months.has(`${current.jy}-${String(current.jm).padStart(2, '0')}`)).toBe(true);
    const oldest = addMonths(current, -5);
    expect(months.has(`${oldest.jy}-${String(oldest.jm).padStart(2, '0')}`)).toBe(true);
  });

  it('does not include future days in the current month', () => {
    const currentKey = `${current.jy}-${String(current.jm).padStart(2, '0')}`;
    const days = state.transactions
      .filter((transaction) => transaction.date.startsWith(currentKey))
      .map((transaction) => Number(transaction.date.slice(8)));
    expect(Math.max(...days)).toBeLessThanOrEqual(current.jd);
  });

  it('has unique transaction ids', () => {
    expect(new Set(state.transactions.map((transaction) => transaction.id)).size).toBe(
      state.transactions.length,
    );
  });

  it('has a positive current balance and income', () => {
    const totals = totalsInMonth(state.transactions, current);
    expect(totals.income).toBeGreaterThan(0);
    expect(totals.expense).toBeGreaterThan(0);
  });

  it('links budgets and rules to expense categories', () => {
    for (const budget of state.budgets) {
      const category = state.categories.find((item) => item.id === budget.categoryId);
      expect(category?.type).toBe('expense');
    }
    for (const rule of state.rules) {
      expect(state.categories.some((item) => item.id === rule.categoryId)).toBe(true);
    }
  });

  it('starts from a light theme with Persian digits', () => {
    expect(state.settings).toEqual({ theme: 'light', persianDigits: true });
  });
});

describe('empty state', () => {
  const state = createEmptyState(NOW);

  it('passes validation with no transactions', () => {
    expect(validateState(state).ok).toBe(true);
    expect(state.transactions).toHaveLength(0);
    expect(state.accounts).toHaveLength(1);
  });

  it('includes both income and expense categories', () => {
    expect(state.categories.some((category) => category.type === 'income')).toBe(true);
    expect(state.categories.some((category) => category.type === 'expense')).toBe(true);
  });
});
