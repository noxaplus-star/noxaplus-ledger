import { addMonths, todayJalali } from './jalali';
import type {
  Account,
  Category,
  LedgerState,
  Rule,
  Transaction,
  TransactionType,
} from './types';

const ACCOUNTS: Account[] = [
  { id: 'acc-bank', name: 'حساب اصلی', openingBalance: 24_000_000, color: '#2a9d8f' },
  { id: 'acc-cash', name: 'نقدی', openingBalance: 3_000_000, color: '#d9a441' },
  { id: 'acc-savings', name: 'پس‌انداز', openingBalance: 60_000_000, color: '#5b7cfa' },
];

const CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'خوراک', type: 'expense', color: '#e4572e' },
  { id: 'cat-home', name: 'مسکن', type: 'expense', color: '#8b5cf6' },
  { id: 'cat-transport', name: 'حمل‌ونقل', type: 'expense', color: '#0ea5e9' },
  { id: 'cat-shopping', name: 'خرید', type: 'expense', color: '#f59e0b' },
  { id: 'cat-health', name: 'سلامت', type: 'expense', color: '#10b981' },
  { id: 'cat-fun', name: 'سرگرمی', type: 'expense', color: '#ec4899' },
  { id: 'cat-bills', name: 'قبوض', type: 'expense', color: '#64748b' },
  { id: 'cat-education', name: 'آموزش', type: 'expense', color: '#14b8a6' },
  { id: 'cat-other', name: 'سایر', type: 'expense', color: '#94a3b8' },
  { id: 'cat-salary', name: 'حقوق', type: 'income', color: '#16a34a' },
  { id: 'cat-gift', name: 'هدیه', type: 'income', color: '#84cc16' },
  { id: 'cat-sales', name: 'فروش', type: 'income', color: '#22c55e' },
];

const RULES: Rule[] = [
  { id: 'rule-taxi', keyword: 'تاکسی', categoryId: 'cat-transport' },
  { id: 'rule-snapp', keyword: 'اسنپ', categoryId: 'cat-transport' },
  { id: 'rule-restaurant', keyword: 'رستوران', categoryId: 'cat-food' },
  { id: 'rule-cafe', keyword: 'کافه', categoryId: 'cat-food' },
  { id: 'rule-pharmacy', keyword: 'دارو', categoryId: 'cat-health' },
  { id: 'rule-doctor', keyword: 'پزشک', categoryId: 'cat-health' },
  { id: 'rule-bill', keyword: 'قبض', categoryId: 'cat-bills' },
  { id: 'rule-internet', keyword: 'اینترنت', categoryId: 'cat-bills' },
  { id: 'rule-salary', keyword: 'حقوق', categoryId: 'cat-salary' },
  { id: 'rule-gift', keyword: 'هدیه', categoryId: 'cat-gift' },
];

const MONTH_FACTORS = [1, 0.92, 1.08, 0.96, 1.04, 1];

interface SampleEntry {
  day: number;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string | null;
  note: string;
}

const ENTRIES: SampleEntry[] = [
  { day: 1, amount: 42_000_000, type: 'income', accountId: 'acc-bank', categoryId: 'cat-salary', note: 'حقوق ماهانه' },
  { day: 3, amount: 12_000_000, type: 'expense', accountId: 'acc-bank', categoryId: 'cat-home', note: 'اجاره خانه' },
  { day: 5, amount: 1_850_000, type: 'expense', accountId: 'acc-bank', categoryId: 'cat-food', note: 'خرید هفتگی از هایپر' },
  { day: 7, amount: 320_000, type: 'expense', accountId: 'acc-cash', categoryId: null, note: 'تاکسی اینترنتی' },
  { day: 9, amount: 780_000, type: 'expense', accountId: 'acc-bank', categoryId: 'cat-food', note: 'رستوران با خانواده' },
  { day: 11, amount: 650_000, type: 'expense', accountId: 'acc-bank', categoryId: 'cat-bills', note: 'قبض اینترنت' },
  { day: 14, amount: 240_000, type: 'expense', accountId: 'acc-cash', categoryId: null, note: 'داروخانه' },
  { day: 18, amount: 1_200_000, type: 'expense', accountId: 'acc-bank', categoryId: 'cat-shopping', note: 'خرید لباس' },
  { day: 21, amount: 300_000, type: 'expense', accountId: 'acc-cash', categoryId: 'cat-fun', note: 'سینما' },
  { day: 24, amount: 450_000, type: 'expense', accountId: 'acc-cash', categoryId: 'cat-food', note: 'میوه و سبزیجات' },
  { day: 27, amount: 2_000_000, type: 'income', accountId: 'acc-bank', categoryId: 'cat-gift', note: 'هدیه تولد' },
  { day: 28, amount: 600_000, type: 'expense', accountId: 'acc-cash', categoryId: 'cat-health', note: 'ویزیت پزشک' },
];

export function createSampleState(now: Date = new Date()): LedgerState {
  const current = todayJalali(now);
  const factors = MONTH_FACTORS;
  const transactions: Transaction[] = [];
  let sequence = 0;

  for (let offset = 5; offset >= 0; offset -= 1) {
    const ref = addMonths(current, -offset);
    const monthIndex = 5 - offset;
    const lastDay = offset === 0 ? current.jd : 28;

    for (const entry of ENTRIES) {
      if (entry.day > lastDay) continue;
      if (entry.type === 'income' && entry.categoryId === 'cat-gift' && monthIndex % 2 === 0) {
        continue;
      }
      const scaled =
        entry.type === 'income'
          ? entry.amount
          : Math.round((entry.amount * factors[monthIndex]) / 1000) * 1000;
      const id = `tx-sample-${offset}-${entry.day}`;
      transactions.push({
        id,
        date: `${ref.jy}-${String(ref.jm).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`,
        amount: scaled,
        type: entry.type,
        accountId: entry.accountId,
        categoryId: entry.categoryId,
        note: entry.note,
        createdAt: now.getTime() - sequence * 60_000,
      });
      sequence += 1;
    }
  }

  return {
    version: 1,
    accounts: ACCOUNTS,
    categories: CATEGORIES,
    rules: RULES,
    transactions,
    budgets: [
      { categoryId: 'cat-food', amount: 7_000_000 },
      { categoryId: 'cat-transport', amount: 2_000_000 },
      { categoryId: 'cat-shopping', amount: 3_500_000 },
      { categoryId: 'cat-bills', amount: 2_500_000 },
      { categoryId: 'cat-fun', amount: 1_500_000 },
    ],
    settings: { theme: 'light', persianDigits: true },
    updatedAt: now.getTime(),
  };
}

export function createEmptyState(now: Date = new Date()): LedgerState {
  return {
    version: 1,
    accounts: [
      { id: 'acc-main', name: 'حساب اصلی', openingBalance: 0, color: '#2a9d8f' },
    ],
    categories: [
      { id: 'cat-food', name: 'خوراک', type: 'expense', color: '#e4572e' },
      { id: 'cat-transport', name: 'حمل‌ونقل', type: 'expense', color: '#0ea5e9' },
      { id: 'cat-bills', name: 'قبوض', type: 'expense', color: '#64748b' },
      { id: 'cat-other', name: 'سایر', type: 'expense', color: '#94a3b8' },
      { id: 'cat-salary', name: 'حقوق', type: 'income', color: '#16a34a' },
    ],
    rules: [],
    transactions: [],
    budgets: [],
    settings: { theme: 'light', persianDigits: true },
    updatedAt: now.getTime(),
  };
}
