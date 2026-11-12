import { describe, expect, it } from 'vitest';
import {
  addMonths,
  compareMonths,
  formatJalali,
  formatJalaliKey,
  formatMonth,
  isLeapJalaaliYear,
  isValidJalaliDate,
  jalaaliMonthLength,
  jalaliKey,
  monthGrid,
  monthKey,
  monthOfKey,
  parseJalaliKey,
  toGregorian,
  toJalaali,
  todayJalali,
  weekdayIndex,
} from './jalali';

describe('conversion', () => {
  it('converts Nowruz dates', () => {
    expect(toJalaali(2025, 3, 21)).toEqual({ jy: 1404, jm: 1, jd: 1 });
    expect(toJalaali(2026, 3, 21)).toEqual({ jy: 1405, jm: 1, jd: 1 });
  });

  it('converts the last day of a leap year', () => {
    expect(toJalaali(2025, 3, 20)).toEqual({ jy: 1403, jm: 12, jd: 30 });
  });

  it('converts back to Gregorian', () => {
    expect(toGregorian(1404, 1, 1)).toEqual({ gy: 2025, gm: 3, gd: 21 });
    expect(toGregorian(1405, 8, 21)).toEqual({ gy: 2026, gm: 11, gd: 12 });
  });

  it('round-trips a range of dates', () => {
    for (let year = 1395; year <= 1410; year += 1) {
      for (const month of [1, 6, 12]) {
        const day = month === 12 ? jalaaliMonthLength(year, month) : 15;
        const gregorian = toGregorian(year, month, day);
        expect(toJalaali(gregorian.gy, gregorian.gm, gregorian.gd)).toEqual({
          jy: year,
          jm: month,
          jd: day,
        });
      }
    }
  });
});

describe('leap years and month lengths', () => {
  it('knows leap years', () => {
    expect(isLeapJalaaliYear(1403)).toBe(true);
    expect(isLeapJalaaliYear(1404)).toBe(false);
  });

  it('computes month lengths', () => {
    expect(jalaaliMonthLength(1404, 1)).toBe(31);
    expect(jalaaliMonthLength(1404, 7)).toBe(30);
    expect(jalaaliMonthLength(1403, 12)).toBe(30);
    expect(jalaaliMonthLength(1404, 12)).toBe(29);
  });

  it('validates dates', () => {
    expect(isValidJalaliDate(1403, 12, 30)).toBe(true);
    expect(isValidJalaliDate(1404, 12, 30)).toBe(false);
    expect(isValidJalaliDate(1404, 13, 1)).toBe(false);
    expect(isValidJalaliDate(1404, 1, 0)).toBe(false);
    expect(isValidJalaliDate(1404, 1, 1.5)).toBe(false);
  });
});

describe('keys and formatting', () => {
  it('builds and parses keys', () => {
    expect(jalaliKey({ jy: 1405, jm: 8, jd: 21 })).toBe('1405-08-21');
    expect(parseJalaliKey('1405-08-21')).toEqual({ jy: 1405, jm: 8, jd: 21 });
    expect(parseJalaliKey('1405/8/21')).toEqual({ jy: 1405, jm: 8, jd: 21 });
    expect(parseJalaliKey('1405-13-01')).toBeNull();
    expect(parseJalaliKey('nope')).toBeNull();
  });

  it('formats short and long dates', () => {
    expect(formatJalali({ jy: 1405, jm: 8, jd: 21 })).toBe('۱۴۰۵/۰۸/۲۱');
    expect(formatJalali({ jy: 1405, jm: 8, jd: 21 }, { persianDigits: false })).toBe(
      '1405/08/21',
    );
    expect(formatJalali({ jy: 1405, jm: 8, jd: 21 }, { style: 'long' })).toBe('۲۱ آبان ۱۴۰۵');
    expect(formatJalaliKey('1405-08-21', { style: 'long' })).toBe('۲۱ آبان ۱۴۰۵');
  });

  it('formats month names', () => {
    expect(formatMonth({ jy: 1405, jm: 8 })).toBe('آبان ۱۴۰۵');
    expect(formatMonth({ jy: 1405, jm: 1 }, false)).toBe('فروردین 1405');
  });
});

describe('calendar helpers', () => {
  it('computes weekday indexes starting on Saturday', () => {
    expect(weekdayIndex({ jy: 1404, jm: 1, jd: 1 })).toBe(6);
    expect(weekdayIndex({ jy: 1404, jm: 1, jd: 2 })).toBe(0);
  });

  it('builds a month grid', () => {
    const grid = monthGrid(1404, 1);
    expect(grid.blanks).toBe(6);
    expect(grid.days).toHaveLength(31);
    expect(grid.days[0]).toBe(1);
    expect(grid.days[30]).toBe(31);
  });

  it('adds months across years', () => {
    expect(addMonths({ jy: 1404, jm: 12 }, 1)).toEqual({ jy: 1405, jm: 1 });
    expect(addMonths({ jy: 1405, jm: 1 }, -1)).toEqual({ jy: 1404, jm: 12 });
    expect(addMonths({ jy: 1404, jm: 6 }, 12)).toEqual({ jy: 1405, jm: 6 });
  });

  it('compares months', () => {
    expect(compareMonths({ jy: 1404, jm: 12 }, { jy: 1405, jm: 1 })).toBeLessThan(0);
    expect(compareMonths({ jy: 1405, jm: 1 }, { jy: 1405, jm: 1 })).toBe(0);
    expect(compareMonths({ jy: 1405, jm: 2 }, { jy: 1405, jm: 1 })).toBeGreaterThan(0);
  });

  it('maps month keys', () => {
    expect(monthKey({ jy: 1405, jm: 8 })).toBe('1405-08');
    expect(monthOfKey('1405-08-21')).toEqual({ jy: 1405, jm: 8 });
    expect(monthOfKey('bad')).toBeNull();
  });

  it('derives today in the Persian calendar', () => {
    expect(todayJalali(new Date(2026, 10, 12))).toEqual({ jy: 1405, jm: 8, jd: 21 });
  });
});
