import { parseJalaliKey } from './jalali';
import { parseAmount, toLatinDigits } from './money';
import { normalizeForMatch } from './rules';
import type {
  Account,
  Category,
  CsvParseResult,
  CsvRow,
  LedgerState,
  TransactionType,
} from './types';

const HEADER_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries({
    date: 'date',
    تاریخ: 'date',
    type: 'type',
    نوع: 'type',
    amount: 'amount',
    مبلغ: 'amount',
    مقدار: 'amount',
    account: 'account',
    حساب: 'account',
    category: 'category',
    دسته: 'category',
    'دسته‌بندی': 'category',
    note: 'note',
    توضیح: 'note',
    توضیحات: 'note',
    شرح: 'note',
    description: 'note',
  }).map(([key, value]) => [normalizeForMatch(key), value]),
);

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv(state: LedgerState): string {
  const header = ['date', 'type', 'amount', 'account', 'category', 'note'];
  const lines = [header.join(',')];
  const accounts = new Map(state.accounts.map((account) => [account.id, account.name]));
  const categories = new Map(state.categories.map((category) => [category.id, category.name]));

  const sorted = state.transactions
    .slice()
    .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date.localeCompare(b.date)));

  for (const transaction of sorted) {
    lines.push(
      [
        transaction.date,
        transaction.type,
        String(transaction.amount),
        csvCell(accounts.get(transaction.accountId) ?? ''),
        csvCell(transaction.categoryId ? (categories.get(transaction.categoryId) ?? '') : ''),
        csvCell(transaction.note),
      ].join(','),
    );
  }

  return `\uFEFF${lines.join('\r\n')}`;
}

export function csvTemplate(): string {
  return `\uFEFFdate,type,amount,account,category,note\r\n1405-08-21,expense,250000,حساب اصلی,خوراک,خرید روزانه`;
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function mapType(value: string): TransactionType | null {
  const normalized = normalizeForMatch(value);
  if (['income', 'in', 'credit', 'درآمد', 'درامد', 'واریز', 'دریافت'].includes(normalized)) {
    return 'income';
  }
  if (['expense', 'out', 'debit', 'هزینه', 'برداشت', 'پرداخت'].includes(normalized)) {
    return 'expense';
  }
  return null;
}

export function parseCsv(text: string): CsvParseResult {
  const clean = text.replace(/^\uFEFF/, '');
  const rows = parseRows(clean);
  if (rows.length === 0) {
    return { rows: [], errors: ['فایل خالی است.'] };
  }

  const indexes: Record<string, number> = {};
  rows[0].forEach((cell, index) => {
    const key = HEADER_ALIASES[normalizeForMatch(cell)];
    if (key && indexes[key] === undefined) indexes[key] = index;
  });

  for (const required of ['date', 'type', 'amount']) {
    if (indexes[required] === undefined) {
      return {
        rows: [],
        errors: [`ستون «${required === 'date' ? 'تاریخ' : required === 'type' ? 'نوع' : 'مبلغ'}» پیدا نشد.`],
      };
    }
  }

  const result: CsvRow[] = [];
  const errors: string[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const line = index + 1;
    const dateRaw = toLatinDigits(row[indexes.date] ?? '').trim().replace(/[/.]/g, '-');
    const date = parseJalaliKey(dateRaw);
    if (!date) {
      errors.push(`سطر ${line}: تاریخ «${row[indexes.date] ?? ''}» معتبر نیست.`);
      continue;
    }

    const type = mapType(row[indexes.type] ?? '');
    if (!type) {
      errors.push(`سطر ${line}: نوع تراکنش باید درآمد یا هزینه باشد.`);
      continue;
    }

    const amount = parseAmount(row[indexes.amount] ?? '');
    if (amount === null) {
      errors.push(`سطر ${line}: مبلغ باید عدد صحیح مثبت باشد.`);
      continue;
    }

    result.push({
      date: `${date.jy}-${String(date.jm).padStart(2, '0')}-${String(date.jd).padStart(2, '0')}`,
      type,
      amount,
      account: (row[indexes.account ?? -1] ?? '').trim(),
      category: (row[indexes.category ?? -1] ?? '').trim(),
      note: (row[indexes.note ?? -1] ?? '').trim(),
    });
  }

  return { rows: result, errors };
}

export function accountByName(
  accounts: Account[],
  name: string,
): Account | undefined {
  const target = normalizeForMatch(name);
  return accounts.find((account) => normalizeForMatch(account.name) === target);
}

export function categoryByName(
  categories: Category[],
  name: string,
): Category | undefined {
  const target = normalizeForMatch(name);
  return categories.find((category) => normalizeForMatch(category.name) === target);
}
