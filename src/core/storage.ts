import { parseJalaliKey } from './jalali';
import type {
  Account,
  BackupFile,
  Budget,
  Category,
  LedgerState,
  Rule,
  Transaction,
} from './types';

export const STORAGE_KEY = 'noxaplus-ledger-state-v1';
export const BACKUP_APP = 'NoxaPlus Ledger';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export type StateValidation = { ok: true; state: LedgerState } | { ok: false; error: string };

export function validateState(value: unknown): StateValidation {
  if (!isRecord(value)) return { ok: false, error: 'ساختار فایل معتبر نیست.' };
  if (value.version !== 1) return { ok: false, error: 'نسخه فایل پشتیبان پشتیبانی نمی‌شود.' };

  const accountsRaw = value.accounts;
  const categoriesRaw = value.categories;
  const rulesRaw = value.rules;
  const transactionsRaw = value.transactions;
  const budgetsRaw = value.budgets;
  const settingsRaw = value.settings;

  if (!Array.isArray(accountsRaw) || accountsRaw.length === 0) {
    return { ok: false, error: 'حداقل یک حساب لازم است.' };
  }
  if (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) {
    return { ok: false, error: 'فهرست دسته‌بندی‌ها خالی است.' };
  }
  if (!Array.isArray(rulesRaw) || !Array.isArray(transactionsRaw) || !Array.isArray(budgetsRaw)) {
    return { ok: false, error: 'ساختار فهرست‌های دفتر معتبر نیست.' };
  }
  if (!isRecord(settingsRaw)) return { ok: false, error: 'تنظیمات معتبر نیست.' };
  if (!isNonNegativeInteger(value.updatedAt)) {
    return { ok: false, error: 'زمان به‌روزرسانی معتبر نیست.' };
  }

  const accounts: Account[] = [];
  const accountIds = new Set<string>();
  for (const item of accountsRaw) {
    if (!isRecord(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name)) {
      return { ok: false, error: 'یکی از حساب‌ها معتبر نیست.' };
    }
    if (accountIds.has(item.id)) return { ok: false, error: 'شناسه حساب تکراری است.' };
    if (typeof item.openingBalance !== 'number' || !Number.isSafeInteger(item.openingBalance)) {
      return { ok: false, error: `موجودی افتتاحیه حساب «${item.name}» معتبر نیست.` };
    }
    if (!isColor(item.color)) return { ok: false, error: 'رنگ یکی از حساب‌ها معتبر نیست.' };
    accountIds.add(item.id);
    accounts.push({
      id: item.id,
      name: item.name.trim(),
      openingBalance: item.openingBalance,
      color: item.color,
    });
  }

  const categories: Category[] = [];
  const categoryIds = new Set<string>();
  for (const item of categoriesRaw) {
    if (!isRecord(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.name)) {
      return { ok: false, error: 'یکی از دسته‌بندی‌ها معتبر نیست.' };
    }
    if (item.type !== 'income' && item.type !== 'expense') {
      return { ok: false, error: `نوع دسته‌بندی «${item.name}» معتبر نیست.` };
    }
    if (!isColor(item.color)) return { ok: false, error: 'رنگ یکی از دسته‌بندی‌ها معتبر نیست.' };
    if (categoryIds.has(item.id)) return { ok: false, error: 'شناسه دسته‌بندی تکراری است.' };
    categoryIds.add(item.id);
    categories.push({
      id: item.id,
      name: item.name.trim(),
      type: item.type,
      color: item.color,
    });
  }

  const rules: Rule[] = [];
  const ruleIds = new Set<string>();
  for (const item of rulesRaw) {
    if (!isRecord(item) || !isNonEmptyString(item.id) || !isNonEmptyString(item.keyword)) {
      return { ok: false, error: 'یکی از قواعد دسته‌بندی معتبر نیست.' };
    }
    if (!isNonEmptyString(item.categoryId) || !categoryIds.has(item.categoryId)) {
      return { ok: false, error: 'قاعده به دسته‌بندی ناموجود اشاره می‌کند.' };
    }
    if (ruleIds.has(item.id)) return { ok: false, error: 'شناسه قاعده تکراری است.' };
    ruleIds.add(item.id);
    rules.push({ id: item.id, keyword: item.keyword.trim(), categoryId: item.categoryId });
  }

  const transactions: Transaction[] = [];
  const transactionIds = new Set<string>();
  for (const item of transactionsRaw) {
    if (!isRecord(item) || !isNonEmptyString(item.id)) {
      return { ok: false, error: 'یکی از تراکنش‌ها معتبر نیست.' };
    }
    if (transactionIds.has(item.id)) return { ok: false, error: 'شناسه تراکنش تکراری است.' };
    if (!isNonEmptyString(item.date) || !parseJalaliKey(item.date)) {
      return { ok: false, error: 'تاریخ یکی از تراکنش‌ها معتبر نیست.' };
    }
    if (!isPositiveInteger(item.amount)) {
      return { ok: false, error: 'مبلغ یکی از تراکنش‌ها معتبر نیست.' };
    }
    if (item.type !== 'income' && item.type !== 'expense') {
      return { ok: false, error: 'نوع یکی از تراکنش‌ها معتبر نیست.' };
    }
    if (!isNonEmptyString(item.accountId) || !accountIds.has(item.accountId)) {
      return { ok: false, error: 'تراکنشی به حساب ناموجود اشاره می‌کند.' };
    }
    if (item.categoryId !== null && (!isNonEmptyString(item.categoryId) || !categoryIds.has(item.categoryId))) {
      return { ok: false, error: 'تراکنشی به دسته‌بندی ناموجود اشاره می‌کند.' };
    }
    if (typeof item.note !== 'string') {
      return { ok: false, error: 'توضیح یکی از تراکنش‌ها معتبر نیست.' };
    }
    if (!isNonNegativeInteger(item.createdAt)) {
      return { ok: false, error: 'زمان ثبت یکی از تراکنش‌ها معتبر نیست.' };
    }
    transactionIds.add(item.id);
    transactions.push({
      id: item.id,
      date: item.date,
      amount: item.amount,
      type: item.type,
      accountId: item.accountId,
      categoryId: item.categoryId,
      note: item.note.trim(),
      createdAt: item.createdAt,
    });
  }

  const budgets: Budget[] = [];
  const budgetCategoryIds = new Set<string>();
  for (const item of budgetsRaw) {
    if (!isRecord(item) || !isNonEmptyString(item.categoryId)) {
      return { ok: false, error: 'یکی از بودجه‌ها معتبر نیست.' };
    }
    if (!categoryIds.has(item.categoryId)) {
      return { ok: false, error: 'بودجه به دسته‌بندی ناموجود اشاره می‌کند.' };
    }
    const category = categories.find((entry) => entry.id === item.categoryId);
    if (!category || category.type !== 'expense') {
      return { ok: false, error: 'بودجه فقط برای دسته‌بندی هزینه مجاز است.' };
    }
    if (!isPositiveInteger(item.amount)) {
      return { ok: false, error: 'مبلغ یکی از بودجه‌ها معتبر نیست.' };
    }
    if (budgetCategoryIds.has(item.categoryId)) {
      return { ok: false, error: 'برای یک دسته‌بندی بیش از یک بودجه ثبت شده است.' };
    }
    budgetCategoryIds.add(item.categoryId);
    budgets.push({ categoryId: item.categoryId, amount: item.amount });
  }

  if (settingsRaw.theme !== 'light' && settingsRaw.theme !== 'dark') {
    return { ok: false, error: 'تم انتخاب‌شده معتبر نیست.' };
  }
  if (typeof settingsRaw.persianDigits !== 'boolean') {
    return { ok: false, error: 'تنظیم ارقام فارسی معتبر نیست.' };
  }

  return {
    ok: true,
    state: {
      version: 1,
      accounts,
      categories,
      rules,
      transactions,
      budgets,
      settings: {
        theme: settingsRaw.theme,
        persianDigits: settingsRaw.persianDigits,
      },
      updatedAt: value.updatedAt,
    },
  };
}

function resolveStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === 'undefined') return undefined;
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export interface LoadResult {
  state: LedgerState | null;
  warning: string | null;
}

export function loadState(storage?: StorageLike): LoadResult {
  const store = resolveStorage(storage);
  if (!store) return { state: null, warning: 'حافظه مرورگر در دسترس نیست.' };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { state: null, warning: null };
    const parsed: unknown = JSON.parse(raw);
    const result = validateState(parsed);
    if (!result.ok) return { state: null, warning: result.error };
    return { state: result.state, warning: null };
  } catch {
    return { state: null, warning: 'داده ذخیره‌شده خوانده نشد.' };
  }
}

export function saveState(state: LedgerState, storage?: StorageLike): boolean {
  const store = resolveStorage(storage);
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage?: StorageLike): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private modes; the in-memory state still works.
  }
}

export function createBackup(state: LedgerState, exportedAt = new Date()): BackupFile {
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: exportedAt.toISOString(),
    state,
  };
}

export function serializeBackup(state: LedgerState, exportedAt = new Date()): string {
  return JSON.stringify(createBackup(state, exportedAt), null, 2);
}

export function parseBackup(text: string): { state: LedgerState } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'فایل پشتیبان JSON معتبر نیست.' };
  }
  if (!isRecord(parsed) || parsed.app !== BACKUP_APP) {
    return { error: 'این فایل پشتیبان NoxaPlus Ledger نیست.' };
  }
  if (parsed.version !== 1) return { error: 'نسخه فایل پشتیبان پشتیبانی نمی‌شود.' };
  const result = validateState(parsed.state);
  if (!result.ok) return { error: result.error };
  return { state: result.state };
}
