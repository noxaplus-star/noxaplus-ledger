import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createId } from '../core/ids';
import { accountByName, categoryByName } from '../core/csv';
import { createEmptyState, createSampleState } from '../core/sample';
import {
  applyRulesToUncategorized,
  normalizeForMatch,
  suggestCategoryId,
} from '../core/rules';
import { loadState, saveState } from '../core/storage';
import type {
  CsvRow,
  LedgerState,
  Theme,
  Transaction,
  TransactionType,
} from '../core/types';

export interface NewTransactionInput {
  date: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string | null;
  note: string;
}

export type OperationResult = { ok: true } | { ok: false; error: string };

interface HistoryState {
  past: LedgerState[];
  present: LedgerState;
  future: LedgerState[];
}

const HISTORY_LIMIT = 40;
const MAX_NOTE = 160;

function isColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function isSafeAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function useLedger() {
  const initialWarning = useRef<string | null>(null);
  const [history, setHistory] = useState<HistoryState>(() => {
    const loaded = loadState();
    initialWarning.current = loaded.warning;
    return {
      past: [],
      present: loaded.state ?? createEmptyState(),
      future: [],
    };
  });
  const [storageFailed, setStorageFailed] = useState(false);
  const failedRef = useRef(false);

  useEffect(() => {
    const ok = saveState(history.present);
    if (!ok && !failedRef.current) {
      failedRef.current = true;
      setStorageFailed(true);
    }
  }, [history.present]);

  const commit = useCallback((updater: (state: LedgerState) => LedgerState) => {
    setHistory((current) => {
      const next = updater(current.present);
      if (next === current.present) return current;
      return {
        past: [...current.past.slice(-(HISTORY_LIMIT - 1)), current.present],
        present: { ...next, updatedAt: Date.now() },
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, HISTORY_LIMIT),
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;
      const next = current.future[0];
      return {
        past: [...current.past.slice(-(HISTORY_LIMIT - 1)), current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  const addTransaction = useCallback(
    (input: NewTransactionInput): string => {
      const id = createId('tx');
      commit((state) => {
        const note = input.note.trim().slice(0, MAX_NOTE);
        const categoryId =
          input.categoryId ?? suggestCategoryId(state.rules, state.categories, input.type, note);
        const transaction: Transaction = {
          id,
          date: input.date,
          amount: input.amount,
          type: input.type,
          accountId: input.accountId,
          categoryId,
          note,
          createdAt: Date.now(),
        };
        return { ...state, transactions: [transaction, ...state.transactions] };
      });
      return id;
    },
    [commit],
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<NewTransactionInput>) => {
      commit((state) => {
        const existing = state.transactions.find((transaction) => transaction.id === id);
        if (!existing) return state;
        const merged: Transaction = {
          ...existing,
          ...patch,
          note: (patch.note ?? existing.note).trim().slice(0, MAX_NOTE),
        };
        let categoryId = merged.categoryId;
        if (categoryId) {
          const category = state.categories.find((item) => item.id === categoryId);
          if (!category || category.type !== merged.type) categoryId = null;
        }
        if (!categoryId) {
          categoryId = suggestCategoryId(
            state.rules,
            state.categories,
            merged.type,
            merged.note,
          );
        }
        return {
          ...state,
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...merged, categoryId } : transaction,
          ),
        };
      });
    },
    [commit],
  );

  const deleteTransaction = useCallback(
    (id: string): Transaction | null => {
      const target = history.present.transactions.find((transaction) => transaction.id === id);
      if (!target) return null;
      commit((state) => ({
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== id),
      }));
      return target;
    },
    [commit, history.present.transactions],
  );

  const restoreTransactions = useCallback(
    (transactions: Transaction[]) => {
      commit((state) => {
        const existing = new Set(state.transactions.map((transaction) => transaction.id));
        const restored = transactions.filter((transaction) => !existing.has(transaction.id));
        if (restored.length === 0) return state;
        return { ...state, transactions: [...restored, ...state.transactions] };
      });
    },
    [commit],
  );

  const importTransactions = useCallback(
    (rows: CsvRow[], fallbackAccountId: string): number => {
      const state = history.present;
      if (rows.length === 0 || state.accounts.length === 0) return 0;
      const fallback = state.accounts.some((account) => account.id === fallbackAccountId)
        ? fallbackAccountId
        : state.accounts[0].id;
      const base = Date.now();
      const created: Transaction[] = [];

      rows.forEach((row, index) => {
        const account = accountByName(state.accounts, row.account);
        let categoryId: string | null = null;
        if (row.category) {
          const category = categoryByName(state.categories, row.category);
          if (category && category.type === row.type) categoryId = category.id;
        }
        if (!categoryId) {
          categoryId = suggestCategoryId(state.rules, state.categories, row.type, row.note);
        }
        created.push({
          id: createId('tx'),
          date: row.date,
          amount: row.amount,
          type: row.type,
          accountId: account?.id ?? fallback,
          categoryId,
          note: row.note.slice(0, MAX_NOTE),
          createdAt: base - index,
        });
      });

      if (created.length === 0) return 0;
      commit((current) => ({
        ...current,
        transactions: [...created, ...current.transactions],
      }));
      return created.length;
    },
    [commit, history.present],
  );

  const addAccount = useCallback(
    (name: string, openingBalance: number, color: string): OperationResult => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: 'نام حساب را وارد کنید.' };
      if (!Number.isSafeInteger(openingBalance)) {
        return { ok: false, error: 'موجودی افتتاحیه باید عدد صحیح باشد.' };
      }
      if (!isColor(color)) return { ok: false, error: 'رنگ حساب معتبر نیست.' };
      const duplicated = history.present.accounts.some(
        (account) => normalizeForMatch(account.name) === normalizeForMatch(trimmed),
      );
      if (duplicated) return { ok: false, error: 'حسابی با این نام وجود دارد.' };
      commit((state) => ({
        ...state,
        accounts: [
          ...state.accounts,
          { id: createId('acc'), name: trimmed, openingBalance, color },
        ],
      }));
      return { ok: true };
    },
    [commit, history.present.accounts],
  );

  const updateAccount = useCallback(
    (
      id: string,
      patch: Partial<{ name: string; openingBalance: number; color: string }>,
    ): OperationResult => {
      const existing = history.present.accounts.find((account) => account.id === id);
      if (!existing) return { ok: false, error: 'حساب پیدا نشد.' };
      const name = patch.name?.trim() ?? existing.name;
      if (!name) return { ok: false, error: 'نام حساب را وارد کنید.' };
      const balance = patch.openingBalance ?? existing.openingBalance;
      if (!Number.isSafeInteger(balance)) {
        return { ok: false, error: 'موجودی افتتاحیه باید عدد صحیح باشد.' };
      }
      const color = patch.color ?? existing.color;
      if (!isColor(color)) return { ok: false, error: 'رنگ حساب معتبر نیست.' };
      const duplicated = history.present.accounts.some(
        (account) =>
          account.id !== id && normalizeForMatch(account.name) === normalizeForMatch(name),
      );
      if (duplicated) return { ok: false, error: 'حسابی با این نام وجود دارد.' };
      commit((state) => ({
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === id ? { ...account, name, openingBalance: balance, color } : account,
        ),
      }));
      return { ok: true };
    },
    [commit, history.present.accounts],
  );

  const deleteAccount = useCallback(
    (id: string): OperationResult => {
      if (history.present.accounts.length <= 1) {
        return { ok: false, error: 'حداقل یک حساب باید باقی بماند.' };
      }
      if (history.present.transactions.some((transaction) => transaction.accountId === id)) {
        return { ok: false, error: 'این حساب تراکنش دارد؛ ابتدا تراکنش‌ها را جابه‌جا کنید.' };
      }
      commit((state) => ({
        ...state,
        accounts: state.accounts.filter((account) => account.id !== id),
      }));
      return { ok: true };
    },
    [commit, history.present.accounts, history.present.transactions],
  );

  const addCategory = useCallback(
    (name: string, type: TransactionType, color: string): OperationResult => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: 'نام دسته‌بندی را وارد کنید.' };
      if (!isColor(color)) return { ok: false, error: 'رنگ دسته‌بندی معتبر نیست.' };
      const duplicated = history.present.categories.some(
        (category) =>
          category.type === type &&
          normalizeForMatch(category.name) === normalizeForMatch(trimmed),
      );
      if (duplicated) return { ok: false, error: 'دسته‌بندی مشابهی در این نوع وجود دارد.' };
      commit((state) => ({
        ...state,
        categories: [...state.categories, { id: createId('cat'), name: trimmed, type, color }],
      }));
      return { ok: true };
    },
    [commit, history.present.categories],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<{ name: string; color: string }>): OperationResult => {
      const existing = history.present.categories.find((category) => category.id === id);
      if (!existing) return { ok: false, error: 'دسته‌بندی پیدا نشد.' };
      const name = patch.name?.trim() ?? existing.name;
      if (!name) return { ok: false, error: 'نام دسته‌بندی را وارد کنید.' };
      const color = patch.color ?? existing.color;
      if (!isColor(color)) return { ok: false, error: 'رنگ دسته‌بندی معتبر نیست.' };
      const duplicated = history.present.categories.some(
        (category) =>
          category.id !== id &&
          category.type === existing.type &&
          normalizeForMatch(category.name) === normalizeForMatch(name),
      );
      if (duplicated) return { ok: false, error: 'دسته‌بندی مشابهی در این نوع وجود دارد.' };
      commit((state) => ({
        ...state,
        categories: state.categories.map((category) =>
          category.id === id ? { ...category, name, color } : category,
        ),
      }));
      return { ok: true };
    },
    [commit, history.present.categories],
  );

  const deleteCategory = useCallback(
    (id: string): OperationResult => {
      const existing = history.present.categories.find((category) => category.id === id);
      if (!existing) return { ok: false, error: 'دسته‌بندی پیدا نشد.' };
      const usedInTransactions = history.present.transactions.some(
        (transaction) => transaction.categoryId === id,
      );
      if (usedInTransactions) {
        return { ok: false, error: 'این دسته‌بندی در تراکنش‌ها استفاده شده است.' };
      }
      if (history.present.rules.some((rule) => rule.categoryId === id)) {
        return { ok: false, error: 'این دسته‌بندی در قواعد استفاده شده است.' };
      }
      if (history.present.budgets.some((budget) => budget.categoryId === id)) {
        return { ok: false, error: 'برای این دسته‌بندی بودجه ثبت شده است.' };
      }
      const sameType = history.present.categories.filter(
        (category) => category.type === existing.type,
      );
      if (sameType.length <= 1) {
        return { ok: false, error: 'حداقل یک دسته‌بندی از این نوع باید باقی بماند.' };
      }
      commit((state) => ({
        ...state,
        categories: state.categories.filter((category) => category.id !== id),
      }));
      return { ok: true };
    },
    [commit, history.present],
  );

  const addRule = useCallback(
    (keyword: string, categoryId: string): OperationResult => {
      const trimmed = keyword.trim();
      if (!trimmed) return { ok: false, error: 'کلیدواژه را وارد کنید.' };
      if (!history.present.categories.some((category) => category.id === categoryId)) {
        return { ok: false, error: 'دسته‌بندی انتخاب‌شده معتبر نیست.' };
      }
      const duplicated = history.present.rules.some(
        (rule) =>
          normalizeForMatch(rule.keyword) === normalizeForMatch(trimmed) &&
          rule.categoryId === categoryId,
      );
      if (duplicated) return { ok: false, error: 'این قاعده از قبل وجود دارد.' };
      commit((state) => ({
        ...state,
        rules: [...state.rules, { id: createId('rule'), keyword: trimmed, categoryId }],
      }));
      return { ok: true };
    },
    [commit, history.present.categories, history.present.rules],
  );

  const updateRule = useCallback(
    (id: string, patch: Partial<{ keyword: string; categoryId: string }>): OperationResult => {
      const existing = history.present.rules.find((rule) => rule.id === id);
      if (!existing) return { ok: false, error: 'قاعده پیدا نشد.' };
      const keyword = patch.keyword?.trim() ?? existing.keyword;
      const categoryId = patch.categoryId ?? existing.categoryId;
      if (!keyword) return { ok: false, error: 'کلیدواژه را وارد کنید.' };
      if (!history.present.categories.some((category) => category.id === categoryId)) {
        return { ok: false, error: 'دسته‌بندی انتخاب‌شده معتبر نیست.' };
      }
      commit((state) => ({
        ...state,
        rules: state.rules.map((rule) =>
          rule.id === id ? { ...rule, keyword, categoryId } : rule,
        ),
      }));
      return { ok: true };
    },
    [commit, history.present.categories, history.present.rules],
  );

  const deleteRule = useCallback(
    (id: string) => {
      commit((state) => ({
        ...state,
        rules: state.rules.filter((rule) => rule.id !== id),
      }));
    },
    [commit],
  );

  const applyRules = useCallback((): number => {
    const result = applyRulesToUncategorized(
      history.present.transactions,
      history.present.rules,
      history.present.categories,
    );
    if (result.changed > 0) {
      commit((state) => ({ ...state, transactions: result.transactions }));
    }
    return result.changed;
  }, [commit, history.present]);

  const setBudget = useCallback(
    (categoryId: string, amount: number | null): OperationResult => {
      const category = history.present.categories.find((item) => item.id === categoryId);
      if (!category || category.type !== 'expense') {
        return { ok: false, error: 'بودجه فقط برای دسته‌بندی هزینه ممکن است.' };
      }
      if (amount !== null && !isSafeAmount(amount)) {
        return { ok: false, error: 'مبلغ بودجه باید عدد صحیح مثبت باشد.' };
      }
      commit((state) => ({
        ...state,
        budgets:
          amount === null
            ? state.budgets.filter((budget) => budget.categoryId !== categoryId)
            : state.budgets.some((budget) => budget.categoryId === categoryId)
              ? state.budgets.map((budget) =>
                  budget.categoryId === categoryId ? { ...budget, amount } : budget,
                )
              : [...state.budgets, { categoryId, amount }],
      }));
      return { ok: true };
    },
    [commit, history.present.categories],
  );

  const setTheme = useCallback(
    (theme: Theme) => {
      commit((state) => ({ ...state, settings: { ...state.settings, theme } }));
    },
    [commit],
  );

  const setPersianDigits = useCallback(
    (persianDigits: boolean) => {
      commit((state) => ({ ...state, settings: { ...state.settings, persianDigits } }));
    },
    [commit],
  );

  const replaceState = useCallback(
    (next: LedgerState) => {
      commit(() => next);
    },
    [commit],
  );

  const loadSample = useCallback(() => {
    commit((state) => ({ ...createSampleState(), settings: state.settings }));
  }, [commit]);

  const resetAll = useCallback(() => {
    commit((state) => ({ ...createEmptyState(), settings: state.settings }));
  }, [commit]);

  return useMemo(
    () => ({
      state: history.present,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undo,
      redo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      restoreTransactions,
      importTransactions,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addRule,
      updateRule,
      deleteRule,
      applyRules,
      setBudget,
      setTheme,
      setPersianDigits,
      replaceState,
      loadSample,
      resetAll,
      initialWarning: initialWarning.current,
      storageFailed,
    }),
    [
      history,
      undo,
      redo,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      restoreTransactions,
      importTransactions,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      addRule,
      updateRule,
      deleteRule,
      applyRules,
      setBudget,
      setTheme,
      setPersianDigits,
      replaceState,
      loadSample,
      resetAll,
      storageFailed,
    ],
  );
}

export type LedgerApi = ReturnType<typeof useLedger>;
