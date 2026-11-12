const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toLatinDigits(input: string): string {
  let output = '';
  for (const char of input) {
    const persian = PERSIAN_DIGITS.indexOf(char);
    if (persian >= 0) {
      output += String(persian);
      continue;
    }
    const arabic = ARABIC_DIGITS.indexOf(char);
    output += arabic >= 0 ? String(arabic) : char;
  }
  return output;
}

export function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function parseAmount(input: string): number | null {
  const normalized = toLatinDigits(input)
    .replace(/[\s,٬،_]/g, '')
    .replace(/^\+/, '');
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isSafeInteger(value) || value <= 0) return null;
  return value;
}

export interface FormatAmountOptions {
  persianDigits?: boolean;
  separator?: string;
}

export function formatAmount(value: number, options: FormatAmountOptions = {}): string {
  const { persianDigits = true, separator } = options;
  const sign = value < 0 ? '−' : '';
  const digits = String(Math.abs(Math.trunc(value)));
  const groupSeparator = separator ?? (persianDigits ? '٬' : ',');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  return persianDigits ? sign + toPersianDigits(grouped) : sign + grouped;
}

export function formatCompact(value: number, persianDigits = true): string {
  const absolute = Math.abs(value);
  let text: string;
  if (absolute >= 1_000_000_000) {
    text = `${trimZero(absolute / 1_000_000_000)} میلیارد`;
  } else if (absolute >= 1_000_000) {
    text = `${trimZero(absolute / 1_000_000)} میلیون`;
  } else if (absolute >= 1_000) {
    text = `${trimZero(absolute / 1_000)} هزار`;
  } else {
    text = String(Math.round(absolute));
  }
  const signed = value < 0 ? `−${text}` : text;
  if (!persianDigits) return signed;
  return toPersianDigits(signed).replace(/\./g, '٫');
}

function trimZero(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
