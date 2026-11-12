import type { LedgerState, MonthRef } from './types';

export const REF: MonthRef = { jy: 1404, jm: 8 };

export function makeState(overrides: Partial<LedgerState> = {}): LedgerState {
  return {
    version: 1,
    accounts: [
      { id: 'a1', name: 'حساب اصلی', openingBalance: 1_000_000, color: '#2a9d8f' },
      { id: 'a2', name: 'نقدی', openingBalance: 0, color: '#d9a441' },
    ],
    categories: [
      { id: 'c-food', name: 'خوراک', type: 'expense', color: '#e4572e' },
      { id: 'c-transport', name: 'حمل‌ونقل', type: 'expense', color: '#0ea5e9' },
      { id: 'c-bills', name: 'قبوض', type: 'expense', color: '#64748b' },
      { id: 'c-salary', name: 'حقوق', type: 'income', color: '#16a34a' },
    ],
    rules: [
      { id: 'r1', keyword: 'تاکسی', categoryId: 'c-transport' },
      { id: 'r2', keyword: 'حقوق', categoryId: 'c-salary' },
    ],
    transactions: [
      {
        id: 't1',
        date: '1404-08-02',
        amount: 200_000,
        type: 'expense',
        accountId: 'a1',
        categoryId: 'c-food',
        note: 'خرید هفتگی',
        createdAt: 1,
      },
      {
        id: 't2',
        date: '1404-08-10',
        amount: 5_000_000,
        type: 'income',
        accountId: 'a1',
        categoryId: 'c-salary',
        note: 'حقوق ماهانه',
        createdAt: 2,
      },
      {
        id: 't3',
        date: '1404-08-15',
        amount: 50_000,
        type: 'expense',
        accountId: 'a2',
        categoryId: null,
        note: 'تاکسی فرودگاه',
        createdAt: 3,
      },
      {
        id: 't4',
        date: '1404-07-20',
        amount: 100_000,
        type: 'expense',
        accountId: 'a2',
        categoryId: 'c-food',
        note: 'میوه',
        createdAt: 4,
      },
    ],
    budgets: [
      { categoryId: 'c-food', amount: 300_000 },
      { categoryId: 'c-transport', amount: 100_000 },
    ],
    settings: { theme: 'light', persianDigits: true },
    updatedAt: 1,
    ...overrides,
  };
}
