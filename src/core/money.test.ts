import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatCompact,
  parseAmount,
  sum,
  toLatinDigits,
  toPersianDigits,
} from './money';

describe('digit conversion', () => {
  it('converts Persian digits to Latin', () => {
    expect(toLatinDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890');
  });

  it('converts Arabic-Indic digits to Latin', () => {
    expect(toLatinDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
  });

  it('keeps mixed text intact', () => {
    expect(toLatinDigits('مبلغ ۲۵۰ تومان')).toBe('مبلغ 250 تومان');
  });

  it('converts Latin digits to Persian', () => {
    expect(toPersianDigits('1404/08/21')).toBe('۱۴۰۴/۰۸/۲۱');
  });
});

describe('parseAmount', () => {
  it('parses Persian digits with thousands separators', () => {
    expect(parseAmount('۱۲٬۵۰۰٬۰۰۰')).toBe(12_500_000);
  });

  it('parses Latin digits with commas and spaces', () => {
    expect(parseAmount(' 1,234,567 ')).toBe(1_234_567);
    expect(parseAmount('1 234 567')).toBe(1_234_567);
  });

  it('accepts a leading plus sign', () => {
    expect(parseAmount('+2000')).toBe(2000);
  });

  it('rejects zero, negatives, decimals and text', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-500')).toBeNull();
    expect(parseAmount('12.5')).toBeNull();
    expect(parseAmount('۱۲٫۵')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('')).toBeNull();
  });

  it('rejects unsafe integers', () => {
    expect(parseAmount('99999999999999999999')).toBeNull();
  });
});

describe('formatAmount', () => {
  it('formats with Persian digits and separators by default', () => {
    expect(formatAmount(1_234_567)).toBe('۱٬۲۳۴٬۵۶۷');
  });

  it('formats with Latin digits when requested', () => {
    expect(formatAmount(1_234_567, { persianDigits: false })).toBe('1,234,567');
  });

  it('uses a minus sign for negative values', () => {
    expect(formatAmount(-1000)).toBe('−۱٬۰۰۰');
  });
});

describe('formatCompact', () => {
  it('formats millions and billions', () => {
    expect(formatCompact(2_000_000)).toBe('۲ میلیون');
    expect(formatCompact(1_500_000)).toBe('۱٫۵ میلیون');
    expect(formatCompact(2_400_000_000)).toBe('۲٫۴ میلیارد');
  });

  it('formats thousands and small numbers', () => {
    expect(formatCompact(12_000)).toBe('۱۲ هزار');
    expect(formatCompact(950)).toBe('۹۵۰');
  });

  it('supports Latin digits', () => {
    expect(formatCompact(1_500_000, false)).toBe('1.5 میلیون');
  });
});

describe('sum', () => {
  it('adds values', () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });
});
