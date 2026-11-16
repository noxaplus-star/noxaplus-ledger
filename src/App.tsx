import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppContext, ConfirmOptions, TabId } from './appTypes';
import { APP_VERSION, CONTACT_EMAIL, REPO_URL, SITE_URL } from './constants';
import {
  accountBalances,
  totalBalance,
  transactionsInMonth,
} from './core/reports';
import { todayJalali } from './core/jalali';
import type { MonthRef, Transaction, TransactionType } from './core/types';
import { createFormatter } from './format';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useLedger } from './hooks/useLedger';
import { useToasts } from './hooks/useToasts';
import { ConfirmDialog } from './components/ConfirmDialog';
import { HelpDialog } from './components/HelpDialog';
import { Icon, type IconName } from './components/Icon';
import { ImportDialog } from './components/ImportDialog';
import { BrandLogo, Logo } from './components/Logo';
import { MonthSwitcher } from './components/MonthSwitcher';
import { Toasts } from './components/Toasts';
import { TransactionDialog } from './components/TransactionDialog';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Reports } from './pages/Reports';
import { Manage } from './pages/Manage';
import { Settings } from './pages/Settings';

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: IconName }> = [
  { id: 'dashboard', label: 'داشبورد', icon: 'dashboard' },
  { id: 'transactions', label: 'تراکنش‌ها', icon: 'list' },
  { id: 'budgets', label: 'بودجه‌ها', icon: 'sliders' },
  { id: 'reports', label: 'گزارش‌ها', icon: 'chart' },
  { id: 'manage', label: 'مدیریت دفتر', icon: 'wallet' },
  { id: 'settings', label: 'تنظیمات', icon: 'settings' },
];

const PAGE_TITLES: Record<TabId, string> = {
  dashboard: 'داشبورد',
  transactions: 'تراکنش‌ها',
  budgets: 'بودجه‌ها',
  reports: 'گزارش‌ها',
  manage: 'مدیریت دفتر',
  settings: 'تنظیمات',
};

const BOTTOM_ITEMS = NAV_ITEMS.filter((item) => item.id !== 'settings');

interface TransactionDialogState {
  open: boolean;
  transaction: Transaction | null;
  presetType: TransactionType;
}

export default function App() {
  const ledger = useLedger();
  const { toasts, notify, dismiss } = useToasts();
  const { canInstall, install } = useInstallPrompt();
  const [tab, setTab] = useState<TabId>('dashboard');
  const [month, setMonth] = useState<MonthRef>(() => {
    const today = todayJalali();
    return { jy: today.jy, jm: today.jm };
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>({
    open: false,
    transaction: null,
    presetType: 'expense',
  });
  const warnedRef = useRef(false);
  const storageWarnedRef = useRef(false);

  const fmt = useMemo(
    () => createFormatter(ledger.state.settings.persianDigits),
    [ledger.state.settings.persianDigits],
  );

  const monthCount = useMemo(
    () => transactionsInMonth(ledger.state.transactions, month).length,
    [ledger.state.transactions, month],
  );

  const balances = useMemo(
    () => accountBalances(ledger.state.accounts, ledger.state.transactions),
    [ledger.state.accounts, ledger.state.transactions],
  );

  const total = useMemo(
    () => totalBalance(ledger.state.accounts, ledger.state.transactions),
    [ledger.state.accounts, ledger.state.transactions],
  );

  const overlayOpen =
    transactionDialog.open || helpOpen || importOpen || confirmOptions !== null || sidebarOpen;

  useEffect(() => {
    document.documentElement.dataset.theme = ledger.state.settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        ledger.state.settings.theme === 'dark' ? '#10141d' : '#f6f1e7',
      );
    }
  }, [ledger.state.settings.theme]);

  useEffect(() => {
    if (ledger.initialWarning && !warnedRef.current) {
      warnedRef.current = true;
      notify(ledger.initialWarning, 'error');
    }
  }, [ledger.initialWarning, notify]);

  useEffect(() => {
    if (ledger.storageFailed && !storageWarnedRef.current) {
      storageWarnedRef.current = true;
      notify('ذخیره‌سازی محلی در دسترس نیست؛ از پشتیبان JSON استفاده کنید.', 'error');
    }
  }, [ledger.storageFailed, notify]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [tab]);

  const navigate = (next: TabId) => {
    setTab(next);
    setSidebarOpen(false);
  };

  const openTransaction = (transaction?: Transaction, presetType: TransactionType = 'expense') => {
    setTransactionDialog({ open: true, transaction: transaction ?? null, presetType });
  };

  const requestDelete = (transaction: Transaction) => {
    setConfirmOptions({
      title: 'حذف تراکنش',
      message: `تراکنش «${transaction.note || fmt.money(transaction.amount)}» حذف شود؟ می‌توانید بلافاصله بازگردانید.`,
      confirmLabel: 'حذف',
      tone: 'danger',
      onConfirm: () => {
        const removed = ledger.deleteTransaction(transaction.id);
        if (!removed) {
          notify('تراکنش پیدا نشد.', 'error');
          return;
        }
        notify('تراکنش حذف شد.', 'info', {
          label: 'بازگردانی',
          onClick: () => ledger.restoreTransactions([removed]),
        });
      },
    });
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (typing) return;

      if (event.key === 'Escape') {
        setSidebarOpen(false);
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        if (overlayOpen) return;
        const key = event.key.toLowerCase();
        if (key === 'z') {
          event.preventDefault();
          if (event.shiftKey) ledger.redo();
          else ledger.undo();
        } else if (key === 'y') {
          event.preventDefault();
          ledger.redo();
        }
        return;
      }
      if (event.altKey) return;

      if (event.key.toLowerCase() === 'n' && !overlayOpen) {
        event.preventDefault();
        setTransactionDialog({ open: true, transaction: null, presetType: 'expense' });
      } else if (event.key === '?' && !overlayOpen) {
        event.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ledger, overlayOpen]);

  const ctx: AppContext = {
    ledger,
    fmt,
    month,
    setMonth,
    navigate,
    openTransaction,
    requestDelete,
    notify,
    confirm: setConfirmOptions,
    openImport: () => setImportOpen(true),
    openHelp: () => setHelpOpen(true),
    canInstall,
    install,
  };

  const showMonth = tab === 'dashboard' || tab === 'transactions' || tab === 'budgets' || tab === 'reports';

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        رفتن به محتوای اصلی
      </a>

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="ناوبری اصلی">
        <div className="sidebar__brand">
          <BrandLogo height={46} />
          <div className="sidebar__brand-copy">
            <strong>NoxaPlus</strong>
            <span>Ledger</span>
          </div>
          <button
            type="button"
            className="icon-btn sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="بستن منو"
          >
            <Icon name="x" />
          </button>
        </div>

        <div className="sidebar__balance">
          <span className="sidebar__balance-label">
            <Icon name="wallet" size={15} />
            موجودی کل
          </span>
          <strong className="sidebar__balance-value num">{fmt.money(total)}</strong>
          <span className="sidebar__balance-unit">تومان</span>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${tab === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span className="nav-item__label">{item.label}</span>
              {item.id === 'transactions' && monthCount > 0 ? (
                <span className="nav-item__badge num">{fmt.number(monthCount)}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar__accounts">
          <p className="sidebar__accounts-title">حساب‌ها</p>
          <ul className="sidebar__accounts-list">
            {balances.slice(0, 4).map((entry) => (
              <li key={entry.account.id} className="sidebar__account">
                <i style={{ background: entry.account.color }} aria-hidden="true" />
                <span className="sidebar__account-name">{entry.account.name}</span>
                <span className="sidebar__account-value num">{fmt.compact(entry.balance)}</span>
              </li>
            ))}
          </ul>
          {balances.length > 4 ? (
            <p className="sidebar__accounts-more num">
              و {fmt.number(balances.length - 4)} حساب دیگر
            </p>
          ) : null}
          <button type="button" className="sidebar__link" onClick={() => navigate('manage')}>
            <Icon name="sliders" size={14} />
            مدیریت حساب‌ها
          </button>
        </div>

        <footer className="sidebar__foot">
          <div className="sidebar__foot-links">
            <a href={SITE_URL} target="_blank" rel="noreferrer" aria-label="وب‌سایت NoxaPlus" title="noxaplus.ir">
              <Icon name="globe" size={17} />
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="مخزن GitHub" title="GitHub">
              <Icon name="github" size={17} />
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label="ایمیل NoxaPlus" title={CONTACT_EMAIL}>
              <Icon name="mail" size={17} />
            </a>
          </div>
          <span className="sidebar__version num">نسخه {fmt.digits(APP_VERSION)}</span>
        </footer>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="بستن منو"
        />
      ) : null}

      <div className="app__main">
        <header className="topbar">
          <div className="topbar__start">
            <button
              type="button"
              className="icon-btn topbar__menu"
              onClick={() => setSidebarOpen(true)}
              aria-label="باز کردن منو"
            >
              <Icon name="menu" />
            </button>
            <div className="topbar__brand">
              <Logo size={28} />
              <span>NoxaPlus Ledger</span>
            </div>
            <span className="topbar__section">{PAGE_TITLES[tab]}</span>
          </div>

          <div className="topbar__tools">
            {showMonth ? <MonthSwitcher month={month} onChange={setMonth} fmt={fmt} /> : null}
            <div className="topbar__group" role="group" aria-label="تاریخچه تغییرات">
              <button
                type="button"
                className="icon-btn"
                onClick={ledger.undo}
                disabled={!ledger.canUndo}
                aria-label="بازگرداندن تغییر"
                title="بازگرداندن (Ctrl+Z)"
              >
                <Icon name="undo" />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={ledger.redo}
                disabled={!ledger.canRedo}
                aria-label="اجرای دوباره تغییر"
                title="دوباره (Ctrl+Shift+Z)"
              >
                <Icon name="redo" />
              </button>
            </div>
            <button
              type="button"
              className="icon-btn topbar__optional"
              onClick={() => setHelpOpen(true)}
              aria-label="راهنما"
              title="راهنما (؟)"
            >
              <Icon name="help" />
            </button>
            <button
              type="button"
              className="icon-btn topbar__optional"
              onClick={() => ledger.setTheme(ledger.state.settings.theme === 'dark' ? 'light' : 'dark')}
              aria-label="تغییر تم"
              title="تغییر تم"
            >
              <Icon name={ledger.state.settings.theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate('settings')}
              aria-label="تنظیمات"
              title="تنظیمات"
            >
              <Icon name="settings" />
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openTransaction()}
              aria-label="ثبت تراکنش جدید"
            >
              <Icon name="plus" size={17} />
              <span className="topbar__add-label">تراکنش</span>
            </button>
          </div>
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          {tab === 'dashboard' ? <Dashboard ctx={ctx} /> : null}
          {tab === 'transactions' ? <Transactions ctx={ctx} /> : null}
          {tab === 'budgets' ? <Budgets ctx={ctx} /> : null}
          {tab === 'reports' ? <Reports ctx={ctx} /> : null}
          {tab === 'manage' ? <Manage ctx={ctx} /> : null}
          {tab === 'settings' ? <Settings ctx={ctx} /> : null}

          <footer className="app-footer">
            <div className="app-footer__brand">
              <Logo size={26} />
              <span>
                <strong>NoxaPlus Ledger</strong> · ساخته NoxaPlus
              </span>
            </div>
            <p className="app-footer__note">
              داده‌ها فقط روی دستگاه شما ذخیره می‌شوند. بدون آپلود، بدون حساب کاربری.
            </p>
            <div className="app-footer__links">
              <a href={SITE_URL} target="_blank" rel="noreferrer">
                noxaplus.ir
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
          </footer>
        </main>
      </div>

      <nav className="bottom-nav" aria-label="ناوبری سریع">
        {BOTTOM_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => navigate(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <TransactionDialog
        open={transactionDialog.open}
        transaction={transactionDialog.transaction}
        presetType={transactionDialog.presetType}
        ledger={ledger}
        fmt={fmt}
        onClose={() =>
          setTransactionDialog((current) => ({ ...current, open: false }))
        }
        onSaved={(mode) =>
          notify(mode === 'created' ? 'تراکنش ثبت شد.' : 'تراکنش به‌روزرسانی شد.', 'success')
        }
      />

      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        canInstall={canInstall}
        onInstall={() => {
          setHelpOpen(false);
          void install();
        }}
      />

      <ImportDialog
        open={importOpen}
        ledger={ledger}
        fmt={fmt}
        onClose={() => setImportOpen(false)}
        onImported={(count) =>
          notify(`${fmt.number(count)} تراکنش از CSV افزوده شد.`, 'success', {
            label: 'بازگردانی',
            onClick: ledger.undo,
          })
        }
      />

      <ConfirmDialog
        open={confirmOptions !== null}
        options={confirmOptions}
        onClose={() => setConfirmOptions(null)}
      />

      <Toasts toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
