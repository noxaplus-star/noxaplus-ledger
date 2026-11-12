import { addMonths, monthOfKey } from './jalali';
import type {
  Account,
  Budget,
  Category,
  MonthRef,
  Transaction,
  TransactionType,
} from './types';

export const UNCATEGORIZED_NAME = 'بدون دسته';
export const UNCATEGORIZED_COLOR = '#94a3b8';

export function transactionMonth(transaction: Transaction): MonthRef | null {
  return monthOfKey(transaction.date);
}

export function transactionsInMonth(
  transactions: Transaction[],
  ref: MonthRef,
): Transaction[] {
  return transactions.filter((transaction) => {
    const month = transactionMonth(transaction);
    return month !== null && month.jy === ref.jy && month.jm === ref.jm;
  });
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export function totals(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const transaction of transactions) {
    if (transaction.type === 'income') income += transaction.amount;
    else expense += transaction.amount;
  }
  return { income, expense, net: income - expense };
}

export function totalsInMonth(transactions: Transaction[], ref: MonthRef): Totals {
  return totals(transactionsInMonth(transactions, ref));
}

export interface AccountBalance {
  account: Account;
  balance: number;
  income: number;
  expense: number;
}

export function accountBalances(
  accounts: Account[],
  transactions: Transaction[],
): AccountBalance[] {
  return accounts.map((account) => {
    let income = 0;
    let expense = 0;
    for (const transaction of transactions) {
      if (transaction.accountId !== account.id) continue;
      if (transaction.type === 'income') income += transaction.amount;
      else expense += transaction.amount;
    }
    return {
      account,
      income,
      expense,
      balance: account.openingBalance + income - expense,
    };
  });
}

export function totalBalance(accounts: Account[], transactions: Transaction[]): number {
  return accountBalances(accounts, transactions).reduce(
    (total, entry) => total + entry.balance,
    0,
  );
}

export interface CategoryTotal {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
  share: number;
}

export function categoryTotals(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType,
): CategoryTotal[] {
  const totalsByCategory = new Map<string | null, number>();
  let grandTotal = 0;

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    grandTotal += transaction.amount;
    totalsByCategory.set(
      transaction.categoryId,
      (totalsByCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  const result: CategoryTotal[] = [];
  for (const [categoryId, amount] of totalsByCategory) {
    const category = categoryId ? categories.find((item) => item.id === categoryId) : undefined;
    result.push({
      categoryId,
      name: category?.name ?? UNCATEGORIZED_NAME,
      color: category?.color ?? UNCATEGORIZED_COLOR,
      amount,
      share: grandTotal > 0 ? amount / grandTotal : 0,
    });
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export interface MonthlyTotals {
  ref: MonthRef;
  income: number;
  expense: number;
  net: number;
}

export function monthlySeries(
  transactions: Transaction[],
  end: MonthRef,
  count: number,
): MonthlyTotals[] {
  const series: MonthlyTotals[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const ref = addMonths(end, -offset);
    const monthTotals = totalsInMonth(transactions, ref);
    series.push({ ref, ...monthTotals });
  }
  return series;
}

export interface BudgetProgress {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
  spent: number;
  remaining: number;
  ratio: number;
}

export function budgetProgress(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  ref: MonthRef,
): BudgetProgress[] {
  const monthly = transactionsInMonth(transactions, ref);
  const spentByCategory = new Map<string | null, number>();
  for (const transaction of monthly) {
    if (transaction.type !== 'expense') continue;
    spentByCategory.set(
      transaction.categoryId,
      (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return budgets
    .map((budget) => {
      const category = categories.find((item) => item.id === budget.categoryId);
      if (!category || category.type !== 'expense') return null;
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      return {
        categoryId: budget.categoryId,
        name: category.name,
        color: category.color,
        amount: budget.amount,
        spent,
        remaining: budget.amount - spent,
        ratio: budget.amount > 0 ? spent / budget.amount : 0,
      };
    })
    .filter((entry): entry is BudgetProgress => entry !== null);
}

export function topExpenses(
  transactions: Transaction[],
  limit: number,
): Transaction[] {
  return transactions
    .filter((transaction) => transaction.type === 'expense')
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function averageMonthly(series: MonthlyTotals[]): Totals {
  if (series.length === 0) return { income: 0, expense: 0, net: 0 };
  const income = series.reduce((total, entry) => total + entry.income, 0) / series.length;
  const expense = series.reduce((total, entry) => total + entry.expense, 0) / series.length;
  return { income: Math.round(income), expense: Math.round(expense), net: Math.round(income - expense) };
}
