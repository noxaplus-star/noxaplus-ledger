import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PageProps } from '../appTypes';
import { toLatinDigits } from '../core/money';
import { accountBalances } from '../core/reports';
import type { Account, Category, TransactionType } from '../core/types';
import type { LedgerApi, OperationResult } from '../hooks/useLedger';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

const COLORS = [
  '#2a9d8f',
  '#e4572e',
  '#d9a441',
  '#5b7cfa',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#ec4899',
  '#64748b',
  '#17233d',
];

function parseBalance(input: string): number | null {
  if (input.trim() === '') return 0;
  const normalized = toLatinDigits(input)
    .replace(/[\s,٬،_]/g, '')
    .replace(/^\+/, '');
  if (!/^-?\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isSafeInteger(value) ? value : null;
}

interface ColorFieldProps {
  value: string;
  onChange: (color: string) => void;
}

function ColorField({ value, onChange }: ColorFieldProps) {
  return (
    <div className="color-field">
      <span className="field__label">رنگ</span>
      <div className="color-field__swatches">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-field__swatch ${value.toLowerCase() === color ? 'is-active' : ''}`}
            style={{ background: color }}
            onClick={() => onChange(color)}
            aria-label={`انتخاب رنگ ${color}`}
            aria-pressed={value.toLowerCase() === color}
          />
        ))}
        <label className="color-field__custom" title="رنگ دلخواه">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label="رنگ دلخواه"
          />
          <Icon name="plus" size={14} />
        </label>
      </div>
    </div>
  );
}

interface AccountDialogProps {
  open: boolean;
  account: Account | null;
  ledger: LedgerApi;
  onClose: () => void;
  onDone: (message: string) => void;
}

function AccountDialog({ open, account, ledger, onClose, onDone }: AccountDialogProps) {
  const [name, setName] = useState('');
  const [opening, setOpening] = useState('0');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(account?.name ?? '');
    setOpening(account ? String(account.openingBalance) : '0');
    setColor(account?.color ?? COLORS[0]);
    setError(null);
  }, [open, account]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const balance = parseBalance(opening);
    if (balance === null) {
      setError('موجودی افتتاحیه باید عدد صحیح باشد.');
      return;
    }
    const result: OperationResult = account
      ? ledger.updateAccount(account.id, { name, openingBalance: balance, color })
      : ledger.addAccount(name, balance, color);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone(account ? 'حساب به‌روزرسانی شد.' : 'حساب جدید ساخته شد.');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={account ? 'ویرایش حساب' : 'حساب جدید'}
      subtitle="موجودی افتتاحیه، نقطه شروع محاسبه موجودی است."
      size="sm"
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" form="account-form" className="btn btn--primary">
            {account ? 'ذخیره تغییرات' : 'ساخت حساب'}
          </button>
        </div>
      }
    >
      <form id="account-form" className="form" onSubmit={submit} noValidate>
        {error ? (
          <p className="form__error" role="alert">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : null}
        <label className="field">
          <span className="field__label">نام حساب</span>
          <input
            className="field__control"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="مثلاً حساب بانکی، نقدی، پس‌انداز"
            maxLength={40}
            data-autofocus
          />
        </label>
        <label className="field">
          <span className="field__label">موجودی افتتاحیه (تومان)</span>
          <input
            className="field__control num"
            value={opening}
            onChange={(event) => {
              setOpening(event.target.value);
              setError(null);
            }}
            inputMode="numeric"
            placeholder="۰"
          />
          <span className="field__hint">برای موجودی منفی می‌توانید علامت منفی بگذارید.</span>
        </label>
        <ColorField value={color} onChange={setColor} />
      </form>
    </Modal>
  );
}

interface CategoryDialogProps {
  open: boolean;
  category: Category | null;
  presetType: TransactionType;
  ledger: LedgerApi;
  onClose: () => void;
  onDone: (message: string) => void;
}

function CategoryDialog({
  open,
  category,
  presetType,
  ledger,
  onClose,
  onDone,
}: CategoryDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[1]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(category?.type ?? presetType);
    setName(category?.name ?? '');
    setColor(category?.color ?? COLORS[1]);
    setError(null);
  }, [open, category, presetType]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result: OperationResult = category
      ? ledger.updateCategory(category.id, { name, color })
      : ledger.addCategory(name, type, color);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone(category ? 'دسته‌بندی به‌روزرسانی شد.' : 'دسته‌بندی جدید ساخته شد.');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={category ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
      subtitle="دسته‌بندی‌ها گزارش‌ها و بودجه‌ها را معنادار می‌کنند."
      size="sm"
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" form="category-form" className="btn btn--primary">
            {category ? 'ذخیره تغییرات' : 'ساخت دسته‌بندی'}
          </button>
        </div>
      }
    >
      <form id="category-form" className="form" onSubmit={submit} noValidate>
        {error ? (
          <p className="form__error" role="alert">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : null}
        {category ? (
          <p className="field__hint">
            نوع دسته‌بندی پس از ساخت قابل تغییر نیست.
          </p>
        ) : (
          <div className="segmented segmented--type" role="group" aria-label="نوع دسته‌بندی">
            <button
              type="button"
              className={`segmented__item ${type === 'expense' ? 'is-active is-expense' : ''}`}
              onClick={() => setType('expense')}
              aria-pressed={type === 'expense'}
            >
              هزینه
            </button>
            <button
              type="button"
              className={`segmented__item ${type === 'income' ? 'is-active is-income' : ''}`}
              onClick={() => setType('income')}
              aria-pressed={type === 'income'}
            >
              درآمد
            </button>
          </div>
        )}
        <label className="field">
          <span className="field__label">نام دسته‌بندی</span>
          <input
            className="field__control"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="مثلاً خوراک، حمل‌ونقل، حقوق"
            maxLength={30}
            data-autofocus
          />
        </label>
        <ColorField value={color} onChange={setColor} />
      </form>
    </Modal>
  );
}

type ManageTab = 'accounts' | 'categories' | 'rules';

export function Manage({ ctx }: PageProps) {
  const { ledger, fmt, notify, confirm } = ctx;
  const state = ledger.state;
  const [tab, setTab] = useState<ManageTab>('accounts');
  const [accountDialog, setAccountDialog] = useState<{ open: boolean; account: Account | null }>({
    open: false,
    account: null,
  });
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    category: Category | null;
    presetType: TransactionType;
  }>({ open: false, category: null, presetType: 'expense' });
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState(state.categories[0]?.id ?? '');
  const [ruleError, setRuleError] = useState<string | null>(null);

  const balances = useMemo(
    () => accountBalances(state.accounts, state.transactions),
    [state.accounts, state.transactions],
  );
  const categoryUsage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const transaction of state.transactions) {
      if (!transaction.categoryId) continue;
      counts.set(transaction.categoryId, (counts.get(transaction.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [state.transactions]);

  useEffect(() => {
    if (!state.categories.some((category) => category.id === ruleCategoryId)) {
      setRuleCategoryId(state.categories[0]?.id ?? '');
    }
  }, [state.categories, ruleCategoryId]);

  const deleteAccount = (account: Account) => {
    confirm({
      title: 'حذف حساب',
      message: `حساب «${account.name}» حذف شود؟ فقط حساب‌های بدون تراکنش قابل حذف هستند.`,
      confirmLabel: 'حذف حساب',
      tone: 'danger',
      onConfirm: () => {
        const result = ledger.deleteAccount(account.id);
        if (!result.ok) {
          notify(result.error, 'error');
          return;
        }
        notify('حساب حذف شد.', 'info', {
          label: 'بازگردانی',
          onClick: ledger.undo,
        });
      },
    });
  };

  const deleteCategory = (category: Category) => {
    confirm({
      title: 'حذف دسته‌بندی',
      message: `دسته‌بندی «${category.name}» حذف شود؟ دسته‌های استفاده‌شده در تراکنش، قاعده یا بودجه قابل حذف نیستند.`,
      confirmLabel: 'حذف دسته‌بندی',
      tone: 'danger',
      onConfirm: () => {
        const result = ledger.deleteCategory(category.id);
        if (!result.ok) {
          notify(result.error, 'error');
          return;
        }
        notify('دسته‌بندی حذف شد.', 'info', {
          label: 'بازگردانی',
          onClick: ledger.undo,
        });
      },
    });
  };

  const addRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = ledger.addRule(ruleKeyword, ruleCategoryId);
    if (!result.ok) {
      setRuleError(result.error);
      return;
    }
    setRuleKeyword('');
    setRuleError(null);
    notify('قاعده جدید ساخته شد.', 'success');
  };

  const applyRules = () => {
    const uncategorized = state.transactions.filter((transaction) => !transaction.categoryId).length;
    if (uncategorized === 0) {
      notify('همه تراکنش‌ها دسته‌بندی شده‌اند.', 'info');
      return;
    }
    const count = ledger.applyRules();
    if (count > 0) {
      notify(`${fmt.number(count)} تراکنش با قواعد دسته‌بندی شد.`, 'success', {
        label: 'بازگردانی',
        onClick: ledger.undo,
      });
    } else {
      notify('قاعده‌ای با تراکنش‌های بی‌دسته هم‌خوان نشد.', 'info');
    }
  };

  const expenseCategories = state.categories.filter((category) => category.type === 'expense');
  const incomeCategories = state.categories.filter((category) => category.type === 'income');

  const renderCategoryItem = (category: Category) => (
    <li key={category.id} className="entity-row">
      <span className="entity-row__dot" style={{ background: category.color }} aria-hidden="true" />
      <div className="entity-row__main">
        <p className="entity-row__name">{category.name}</p>
        <p className="entity-row__meta">
          {fmt.number(categoryUsage.get(category.id) ?? 0)} تراکنش
        </p>
      </div>
      <div className="entity-row__actions">
        <button
          type="button"
          className="icon-btn icon-btn--soft"
          onClick={() => setCategoryDialog({ open: true, category, presetType: category.type })}
          aria-label={`ویرایش ${category.name}`}
          title="ویرایش"
        >
          <Icon name="edit" size={15} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--soft icon-btn--danger"
          onClick={() => deleteCategory(category)}
          aria-label={`حذف ${category.name}`}
          title="حذف"
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </li>
  );

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-head__title">مدیریت دفتر</h1>
          <p className="page-head__sub">حساب‌ها، دسته‌بندی‌ها و قاعده‌های دسته‌بندی خودکار</p>
        </div>
        <div className="page-head__actions">
          {tab === 'accounts' ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setAccountDialog({ open: true, account: null })}
            >
              <Icon name="plus" size={16} />
              حساب جدید
            </button>
          ) : tab === 'categories' ? (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() =>
                setCategoryDialog({ open: true, category: null, presetType: 'expense' })
              }
            >
              <Icon name="plus" size={16} />
              دسته‌بندی جدید
            </button>
          ) : (
            <button type="button" className="btn btn--soft btn--sm" onClick={applyRules}>
              <Icon name="sparkles" size={16} />
              اعمال قواعد
            </button>
          )}
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="بخش‌های مدیریت">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'accounts'}
          className={`tabs__item ${tab === 'accounts' ? 'is-active' : ''}`}
          onClick={() => setTab('accounts')}
        >
          <Icon name="wallet" size={16} />
          حساب‌ها
          <span className="tabs__count num">{fmt.number(state.accounts.length)}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'categories'}
          className={`tabs__item ${tab === 'categories' ? 'is-active' : ''}`}
          onClick={() => setTab('categories')}
        >
          <Icon name="tag" size={16} />
          دسته‌بندی‌ها
          <span className="tabs__count num">{fmt.number(state.categories.length)}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'rules'}
          className={`tabs__item ${tab === 'rules' ? 'is-active' : ''}`}
          onClick={() => setTab('rules')}
        >
          <Icon name="sparkles" size={16} />
          قواعد
          <span className="tabs__count num">{fmt.number(state.rules.length)}</span>
        </button>
      </div>

      {tab === 'accounts' ? (
        <div className="page-grid" role="tabpanel">
          {balances.map((entry) => (
            <article key={entry.account.id} className="card account-card">
              <span
                className="account-card__accent"
                style={{ background: entry.account.color }}
                aria-hidden="true"
              />
              <header className="account-card__head">
                <div>
                  <p className="account-card__name">{entry.account.name}</p>
                  <p className="account-card__meta">
                    افتتاحیه: <span className="num">{fmt.money(entry.account.openingBalance)}</span>{' '}
                    تومان
                  </p>
                </div>
                <div className="entity-row__actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn--soft"
                    onClick={() => setAccountDialog({ open: true, account: entry.account })}
                    aria-label={`ویرایش ${entry.account.name}`}
                    title="ویرایش"
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--soft icon-btn--danger"
                    onClick={() => deleteAccount(entry.account)}
                    aria-label={`حذف ${entry.account.name}`}
                    title="حذف"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </header>
              <p className="account-card__balance num">
                {fmt.money(entry.balance)}
                <span>تومان</span>
              </p>
              <div className="account-card__stats">
                <span className="income num">↑ {fmt.compact(entry.income)}</span>
                <span className="expense num">↓ {fmt.compact(entry.expense)}</span>
              </div>
            </article>
          ))}
          <button
            type="button"
            className="add-tile"
            onClick={() => setAccountDialog({ open: true, account: null })}
          >
            <Icon name="plus" size={22} />
            <span>افزودن حساب</span>
            <small>برای جدا کردن پول نقد، بانک و پس‌انداز</small>
          </button>
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div className="category-columns" role="tabpanel">
          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">
                  <span className="legend__dot legend__dot--expense" />
                  دسته‌های هزینه
                </h2>
                <p className="card__sub">برای بودجه‌بندی و گزارش هزینه‌ها</p>
              </div>
            </header>
            {expenseCategories.length === 0 ? (
              <EmptyState compact icon="tag" title="دسته هزینه‌ای وجود ندارد" />
            ) : (
              <ul className="entity-list">{expenseCategories.map(renderCategoryItem)}</ul>
            )}
          </section>
          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">
                  <span className="legend__dot legend__dot--income" />
                  دسته‌های درآمد
                </h2>
                <p className="card__sub">برای تحلیل منابع درآمد</p>
              </div>
            </header>
            {incomeCategories.length === 0 ? (
              <EmptyState compact icon="tag" title="دسته درآمدی وجود ندارد" />
            ) : (
              <ul className="entity-list">{incomeCategories.map(renderCategoryItem)}</ul>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'rules' ? (
        <div className="rules-layout" role="tabpanel">
          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">قاعده جدید</h2>
                <p className="card__sub">
                  اگر توضیح تراکنش شامل کلیدواژه باشد، دسته به‌صورت خودکار انتخاب می‌شود.
                </p>
              </div>
            </header>
            <form className="rule-form" onSubmit={addRule}>
              {ruleError ? (
                <p className="form__error" role="alert">
                  <Icon name="alert" size={15} />
                  {ruleError}
                </p>
              ) : null}
              <div className="rule-form__row">
                <label className="field">
                  <span className="field__label">کلیدواژه</span>
                  <input
                    className="field__control"
                    value={ruleKeyword}
                    onChange={(event) => {
                      setRuleKeyword(event.target.value);
                      setRuleError(null);
                    }}
                    placeholder="مثلاً تاکسی، رستوران، قبض"
                    maxLength={40}
                  />
                </label>
                <label className="field">
                  <span className="field__label">دسته‌بندی</span>
                  <select
                    className="field__control"
                    value={ruleCategoryId}
                    onChange={(event) => setRuleCategoryId(event.target.value)}
                  >
                    <optgroup label="هزینه">
                      {expenseCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="درآمد">
                      {incomeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
              </div>
              <button type="submit" className="btn btn--primary">
                <Icon name="plus" size={16} />
                افزودن قاعده
              </button>
            </form>
          </section>

          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">قاعده‌های فعال</h2>
                <p className="card__sub">
                  {fmt.number(state.rules.length)} قاعده · اعمال روی تراکنش‌های بی‌دسته
                </p>
              </div>
              <button type="button" className="link-btn" onClick={applyRules}>
                <Icon name="sparkles" size={14} />
                اعمال روی دفتر
              </button>
            </header>
            {state.rules.length === 0 ? (
              <EmptyState
                compact
                icon="sparkles"
                title="هنوز قاعده‌ای نساخته‌اید"
                text="با ساخت قاعده، ثبت تراکنش‌های تکراری سریع‌تر می‌شود."
              />
            ) : (
              <ul className="entity-list">
                {state.rules.map((rule) => {
                  const category = state.categories.find((item) => item.id === rule.categoryId);
                  return (
                    <li key={rule.id} className="rule-row">
                      <span className="rule-row__keyword">{rule.keyword}</span>
                      <Icon name="chevron-left" size={14} className="rule-row__arrow" />
                      <span className="rule-row__category">
                        <i
                          className="legend__dot"
                          style={{ background: category?.color ?? '#94a3b8' }}
                        />
                        {category?.name ?? 'دسته نامشخص'}
                      </span>
                      <button
                        type="button"
                        className="icon-btn icon-btn--soft icon-btn--danger"
                        onClick={() => {
                          ledger.deleteRule(rule.id);
                          notify('قاعده حذف شد.', 'info', {
                            label: 'بازگردانی',
                            onClick: ledger.undo,
                          });
                        }}
                        aria-label={`حذف قاعده ${rule.keyword}`}
                        title="حذف"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <AccountDialog
        open={accountDialog.open}
        account={accountDialog.account}
        ledger={ledger}
        onClose={() => setAccountDialog({ open: false, account: null })}
        onDone={(message) => notify(message, 'success')}
      />
      <CategoryDialog
        open={categoryDialog.open}
        category={categoryDialog.category}
        presetType={categoryDialog.presetType}
        ledger={ledger}
        onClose={() =>
          setCategoryDialog({ open: false, category: null, presetType: 'expense' })
        }
        onDone={(message) => notify(message, 'success')}
      />
    </div>
  );
}
