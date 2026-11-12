import {
  formatJalaliKey,
  formatMonth,
  parseJalaliKey,
  weekdayIndex,
  WEEKDAY_NAMES,
} from './core/jalali';
import { formatAmount, formatCompact, toPersianDigits } from './core/money';
import type { MonthRef } from './core/types';

export interface Formatter {
  persianDigits: boolean;
  money(value: number): string;
  signedMoney(value: number, type: 'income' | 'expense'): string;
  compact(value: number): string;
  digits(text: string): string;
  number(value: number): string;
  date(key: string, style?: 'short' | 'long'): string;
  weekday(key: string): string;
  month(ref: MonthRef): string;
}

// Explicit LTR isolation keeps + / − on the leading edge inside RTL layouts.
function isolate(text: string): string {
  return `\u2066${text}\u2069`;
}

export function createFormatter(persianDigits: boolean): Formatter {
  const digits = (text: string) => (persianDigits ? toPersianDigits(text) : text);
  return {
    persianDigits,
    money: (value) =>
      value < 0 ? isolate(formatAmount(value, { persianDigits })) : formatAmount(value, { persianDigits }),
    signedMoney: (value, type) =>
      isolate(`${type === 'income' ? '+' : '−'}${formatAmount(value, { persianDigits })}`),
    compact: (value) => {
      const text = formatCompact(value, persianDigits);
      if (value >= 0) return text;
      const match = /^(−?[۰-۹0-9٫.,]+)(.*)$/.exec(text);
      if (!match) return text;
      return `${isolate(match[1])}${match[2]}`;
    },
    digits,
    number: (value) => digits(String(value)),
    date: (key, style = 'short') => formatJalaliKey(key, { persianDigits, style }),
    weekday: (key) => {
      const date = parseJalaliKey(key);
      return date ? WEEKDAY_NAMES[weekdayIndex(date)] : '';
    },
    month: (ref) => formatMonth(ref, persianDigits),
  };
}
