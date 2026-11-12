import { toLatinDigits } from './money';
import type { Category, Rule, Transaction, TransactionType } from './types';

export function normalizeForMatch(text: string): string {
  return toLatinDigits(text)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/[\u064B-\u0652\u0670\u200c\u200e\u200f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function ruleMatches(rule: Rule, note: string): boolean {
  const keyword = normalizeForMatch(rule.keyword);
  if (!keyword) return false;
  return normalizeForMatch(note).includes(keyword);
}

export function findMatchingRule(
  rules: Rule[],
  categories: Category[],
  type: TransactionType,
  note: string,
): Rule | null {
  for (const rule of rules) {
    const category = categories.find((item) => item.id === rule.categoryId);
    if (!category || category.type !== type) continue;
    if (ruleMatches(rule, note)) return rule;
  }
  return null;
}

export function suggestCategoryId(
  rules: Rule[],
  categories: Category[],
  type: TransactionType,
  note: string,
): string | null {
  return findMatchingRule(rules, categories, type, note)?.categoryId ?? null;
}

export function applyRulesToUncategorized(
  transactions: Transaction[],
  rules: Rule[],
  categories: Category[],
): { transactions: Transaction[]; changed: number } {
  let changed = 0;
  const next = transactions.map((transaction) => {
    if (transaction.categoryId) return transaction;
    const categoryId = suggestCategoryId(rules, categories, transaction.type, transaction.note);
    if (!categoryId) return transaction;
    changed += 1;
    return { ...transaction, categoryId };
  });
  return { transactions: next, changed };
}
