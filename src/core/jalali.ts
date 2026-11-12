import { toPersianDigits } from './money';
import type { JalaliDate, MonthRef } from './types';

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262,
  2324, 2394, 2456, 3178,
];

const div = (a: number, b: number): number => Math.trunc(a / b);
const mod = (a: number, b: number): number => a - Math.trunc(a / b) * b;

interface JalCalResult {
  leap: number;
  gy: number;
  march: number;
}

function jalCal(jy: number, withoutLeap = false): JalCalResult {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new Error(`Invalid Jalali year ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  let leap = 0;

  if (!withoutLeap) {
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
  }

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

function d2g(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function toJalaali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaaliYear(jy: number): boolean {
  return jalCal(jy, false).leap === 0;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false;
  if (jy < 1 || jm < 1 || jm > 12 || jd < 1) return false;
  return jd <= jalaaliMonthLength(jy, jm);
}

export const MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const WEEKDAY_NAMES = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

export function jalaliKey(date: JalaliDate): string {
  const { jy, jm, jd } = date;
  return `${String(jy).padStart(4, '0')}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
}

export function parseJalaliKey(key: string): JalaliDate | null {
  const match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(key.trim());
  if (!match) return null;
  const date = { jy: Number(match[1]), jm: Number(match[2]), jd: Number(match[3]) };
  return isValidJalaliDate(date.jy, date.jm, date.jd) ? date : null;
}

export function todayJalali(now: Date = new Date()): JalaliDate {
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function weekdayIndex(date: JalaliDate): number {
  const g = toGregorian(date.jy, date.jm, date.jd);
  const day = new Date(Date.UTC(g.gy, g.gm - 1, g.gd)).getUTCDay();
  return (day + 1) % 7;
}

export interface FormatJalaliOptions {
  persianDigits?: boolean;
  style?: 'short' | 'long';
}

export function formatJalali(date: JalaliDate, options: FormatJalaliOptions = {}): string {
  const { persianDigits = true, style = 'short' } = options;
  const text =
    style === 'long'
      ? `${date.jd} ${MONTH_NAMES[date.jm - 1]} ${date.jy}`
      : `${date.jy}/${String(date.jm).padStart(2, '0')}/${String(date.jd).padStart(2, '0')}`;
  return persianDigits ? toPersianDigits(text) : text;
}

export function formatJalaliKey(key: string, options: FormatJalaliOptions = {}): string {
  const date = parseJalaliKey(key);
  return date ? formatJalali(date, options) : key;
}

export function monthGrid(jy: number, jm: number): { blanks: number; days: number[] } {
  const first: JalaliDate = { jy, jm, jd: 1 };
  return {
    blanks: weekdayIndex(first),
    days: Array.from({ length: jalaaliMonthLength(jy, jm) }, (_, index) => index + 1),
  };
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const total = ref.jy * 12 + (ref.jm - 1) + delta;
  return { jy: Math.floor(total / 12), jm: mod(total, 12) + 1 };
}

export function compareMonths(a: MonthRef, b: MonthRef): number {
  return a.jy === b.jy ? a.jm - b.jm : a.jy - b.jy;
}

export function monthKey(ref: MonthRef): string {
  return `${String(ref.jy).padStart(4, '0')}-${String(ref.jm).padStart(2, '0')}`;
}

export function monthOfKey(key: string): MonthRef | null {
  const date = parseJalaliKey(key);
  return date ? { jy: date.jy, jm: date.jm } : null;
}

export function formatMonth(ref: MonthRef, persianDigits = true): string {
  const text = `${MONTH_NAMES[ref.jm - 1]} ${ref.jy}`;
  return persianDigits ? toPersianDigits(text) : text;
}

export function daysInMonth(ref: MonthRef): number {
  return jalaaliMonthLength(ref.jy, ref.jm);
}
