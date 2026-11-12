import { describe, expect, it } from 'vitest';
import {
  applyRulesToUncategorized,
  findMatchingRule,
  normalizeForMatch,
  ruleMatches,
  suggestCategoryId,
} from './rules';
import { makeState } from './testFixtures';
import type { Category, Rule, Transaction } from './types';

const categories: Category[] = [
  { id: 'food', name: 'خوراک', type: 'expense', color: '#e4572e' },
  { id: 'salary', name: 'حقوق', type: 'income', color: '#16a34a' },
];

const rules: Rule[] = [
  { id: 'r1', keyword: 'رستوران', categoryId: 'food' },
  { id: 'r2', keyword: 'حقوق', categoryId: 'salary' },
];

describe('normalizeForMatch', () => {
  it('normalizes Arabic letters, diacritics and half-spaces', () => {
    expect(normalizeForMatch('حقوق\u200c ماهانه')).toBe('حقوق ماهانه');
    expect(normalizeForMatch('كتاب')).toBe('کتاب');
    expect(normalizeForMatch('مُستَمر')).toBe('مستمر');
  });

  it('converts digits and lowercases Latin text', () => {
    expect(normalizeForMatch('Taxi ۱۲')).toBe('taxi 12');
    expect(normalizeForMatch('  Cafe   RESTORAN ')).toBe('cafe restoran');
  });
});

describe('rule matching', () => {
  it('matches a keyword inside the note', () => {
    expect(ruleMatches(rules[0], 'شام در رستوران')).toBe(true);
    expect(ruleMatches(rules[0], 'خرید میوه')).toBe(false);
  });

  it('ignores empty keywords', () => {
    expect(ruleMatches({ id: 'x', keyword: '   ', categoryId: 'food' }, 'رستوران')).toBe(false);
  });

  it('finds the first rule that matches the type', () => {
    expect(findMatchingRule(rules, categories, 'expense', 'رستوران')).toEqual(rules[0]);
    expect(findMatchingRule(rules, categories, 'income', 'حقوق ماهانه')).toEqual(rules[1]);
  });

  it('does not apply income rules to expenses', () => {
    expect(findMatchingRule(rules, categories, 'expense', 'حقوق')).toBeNull();
  });

  it('skips rules pointing to missing categories', () => {
    const broken: Rule[] = [{ id: 'broken', keyword: 'رستوران', categoryId: 'missing' }];
    expect(findMatchingRule(broken, categories, 'expense', 'رستوران')).toBeNull();
  });

  it('suggests a category id', () => {
    expect(suggestCategoryId(rules, categories, 'expense', 'رستوران')).toBe('food');
    expect(suggestCategoryId(rules, categories, 'expense', 'تاکسی')).toBeNull();
  });
});

describe('applyRulesToUncategorized', () => {
  it('fills only uncategorized transactions', () => {
    const state = makeState();
    const result = applyRulesToUncategorized(state.transactions, state.rules, state.categories);
    expect(result.changed).toBe(1);
    const fixed = result.transactions.find((transaction) => transaction.id === 't3');
    expect(fixed?.categoryId).toBe('c-transport');
    const untouched = result.transactions.find((transaction) => transaction.id === 't1');
    expect(untouched?.categoryId).toBe('c-food');
  });

  it('leaves unmatched transactions alone', () => {
    const transactions: Transaction[] = [
      {
        id: 'x',
        date: '1404-08-01',
        amount: 1000,
        type: 'expense',
        accountId: 'a1',
        categoryId: null,
        note: 'خرید میوه',
        createdAt: 1,
      },
    ];
    const state = makeState();
    const result = applyRulesToUncategorized(transactions, state.rules, state.categories);
    expect(result.changed).toBe(0);
    expect(result.transactions[0].categoryId).toBeNull();
  });
});
