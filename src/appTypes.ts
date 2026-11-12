import type { Formatter } from './format';
import type { LedgerApi } from './hooks/useLedger';
import type { ToastAction, ToastTone } from './hooks/useToasts';
import type { MonthRef, Transaction, TransactionType } from './core/types';

export type TabId = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'manage' | 'settings';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
}

export interface AppContext {
  ledger: LedgerApi;
  fmt: Formatter;
  month: MonthRef;
  setMonth: (ref: MonthRef) => void;
  navigate: (tab: TabId) => void;
  openTransaction: (transaction?: Transaction, presetType?: TransactionType) => void;
  requestDelete: (transaction: Transaction) => void;
  notify: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  confirm: (options: ConfirmOptions) => void;
  openImport: () => void;
  openHelp: () => void;
  canInstall: boolean;
  install: () => void;
}

export interface PageProps {
  ctx: AppContext;
}
