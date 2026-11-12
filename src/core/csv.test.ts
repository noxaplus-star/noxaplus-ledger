import { describe, expect, it } from 'vitest';
import { accountByName, buildCsv, categoryByName, csvTemplate, parseCsv } from './csv';
import { makeState } from './testFixtures';

describe('buildCsv', () => {
  it('writes a BOM, an English header and rows sorted by date', () => {
    const csv = buildCsv(makeState());
    expect(csv.startsWith('\uFEFFdate,type,amount,account,category,note')).toBe(true);
    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines).toHaveLength(5);
    expect(lines[1].startsWith('1404-07-20,expense,100000,نقدی,خوراک,میوه')).toBe(true);
    expect(lines[4].startsWith('1404-08-15,expense,50000,نقدی,,تاکسی فرودگاه')).toBe(true);
  });

  it('escapes commas and quotes', () => {
    const state = makeState();
    state.transactions[0].note = 'خرید, "ویژه"';
    const csv = buildCsv(state);
    expect(csv).toContain('"خرید, ""ویژه"""');
  });
});

describe('parseCsv', () => {
  it('round-trips exported data', () => {
    const state = makeState();
    const result = parseCsv(buildCsv(state));
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(4);
    expect(result.rows[0]).toEqual({
      date: '1404-07-20',
      type: 'expense',
      amount: 100_000,
      account: 'نقدی',
      category: 'خوراک',
      note: 'میوه',
    });
    expect(result.rows[3]).toMatchObject({ category: '', note: 'تاکسی فرودگاه' });
  });

  it('accepts Persian headers and formatted amounts', () => {
    const csv = [
      'تاریخ,نوع,مبلغ,حساب,دسته,توضیح',
      '۱۴۰۵/۰۸/۲۱,هزینه,"۱٬۲۵۰٬۰۰۰",حساب اصلی,خوراک,"خرید، روزانه"',
      '1405/08/22,درآمد,"۵٬۰۰۰٬۰۰۰",حساب اصلی,حقوق,حقوق ماهانه',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      date: '1405-08-21',
      type: 'expense',
      amount: 1_250_000,
      account: 'حساب اصلی',
      category: 'خوراک',
      note: 'خرید، روزانه',
    });
    expect(result.rows[1].type).toBe('income');
  });

  it('supports quoted newlines', () => {
    const csv = 'date,type,amount,account,category,note\n1405-08-21,expense,1000,حساب اصلی,,"خط اول\nخط دوم"';
    const result = parseCsv(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].note).toBe('خط اول\nخط دوم');
  });

  it('reports invalid rows and keeps valid ones', () => {
    const csv = [
      'date,type,amount,account,category,note',
      '1404-13-01,expense,1000,حساب اصلی,,تاریخ بد',
      '1404-08-01,unknown,1000,حساب اصلی,,نوع بد',
      '1404-08-01,expense,0,حساب اصلی,,مبلغ بد',
      '1404-08-02,expense,2000,حساب اصلی,,سطر سالم',
    ].join('\n');
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain('سطر 2');
  });

  it('rejects files without required headers', () => {
    const result = parseCsv('foo,bar\n1,2');
    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain('تاریخ');
  });

  it('rejects empty files', () => {
    expect(parseCsv('').errors).toHaveLength(1);
  });

  it('parses the downloadable template', () => {
    const result = parseCsv(csvTemplate());
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      date: '1405-08-21',
      type: 'expense',
      amount: 250_000,
      account: 'حساب اصلی',
      category: 'خوراک',
      note: 'خرید روزانه',
    });
  });
});

describe('name lookup', () => {
  it('finds accounts and categories with normalized names', () => {
    const state = makeState();
    expect(accountByName(state.accounts, 'حساب اصلي')?.id).toBe('a1');
    expect(categoryByName(state.categories, 'حمل و نقل')).toBeUndefined();
    expect(categoryByName(state.categories, 'حمل‌ونقل')?.id).toBe('c-transport');
  });
});
