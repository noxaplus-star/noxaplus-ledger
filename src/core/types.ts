export type TransactionType = 'income' | 'expense';

export type Theme = 'light' | 'dark';

export interface Account {
  id: string;
  name: string;
  openingBalance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Rule {
  id: string;
  keyword: string;
  categoryId: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  categoryId: string | null;
  note: string;
  createdAt: number;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export interface LedgerSettings {
  theme: Theme;
  persianDigits: boolean;
}

export interface LedgerState {
  version: 1;
  accounts: Account[];
  categories: Category[];
  rules: Rule[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: LedgerSettings;
  updatedAt: number;
}

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface MonthRef {
  jy: number;
  jm: number;
}

export interface BackupFile {
  app: 'NoxaPlus Ledger';
  version: 1;
  exportedAt: string;
  state: LedgerState;
}

export type CsvRow = {
  date: string;
  type: TransactionType;
  amount: number;
  account: string;
  category: string;
  note: string;
};

export type CsvParseResult = {
  rows: CsvRow[];
  errors: string[];
};
