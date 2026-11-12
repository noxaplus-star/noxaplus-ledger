import { useMemo, useState } from 'react';
import type { PageProps } from '../appTypes';
import { buildCsv } from '../core/csv';
import { jalaliKey, todayJalali } from '../core/jalali';
import { normalizeForMatch } from '../core/rules';
import { transactionsInMonth } from '../core/reports';
import type { Transaction, TransactionType } from '../core/types';
import { downloadText } from '../download';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { TransactionRow } from '../components/TransactionRow';

type Scope = 'month' | 'all';
type TypeFilter = 'all' | TransactionType;

export function Transactions({ ctx }: PageProps) {
  const { ledger, fmt, month, openTransaction, requestDelete, notify, openImport } = ctx;
  const state = ledger.state;
  const [scope, setScope] = useState<Scope>('month');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [accountFilter, setAccountFilter] = useState('all');

  const categoryById = useMemo(
    () => new Map(state.categories.map((category) => [category.id, category])),
    [state.categories],
  );
  const accountById = useMemo(
    () => new Map(state.accounts.map((account) => [account.id, account])),
    [state.accounts],
  );

  const filtered = useMemo(() => {
    const pool =
      scope === 'month' ? transactionsInMonth(state.transactions, month) : state.transactions;
    const query = normalizeForMatch(search);
    return pool
      .filter((transaction) => {
        if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
        if (accountFilter !== 'all' && transaction.accountId !== accountFilter) return false;
        if (!query) return true;
        const category = transaction.categoryId ? categoryById.get(transaction.categoryId) : null;
        const account = accountById.get(transaction.accountId);
        const haystack = normalizeForMatch(
          [
            transaction.note,
            transaction.date,
            String(transaction.amount),
            category?.name ?? '',
            account?.name ?? '',
          ].join(' '),
        );
        return haystack.includes(query);
      })
      .sort((a, b) =>
        a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
      );
  }, [state.transactions, month, scope, search, typeFilter, accountFilter, categoryById, accountById]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const transaction of filtered) {
      const list = map.get(transaction.date);
      if (list) list.push(transaction);
      else map.set(transaction.date, [transaction]);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      net: items.reduce(
        (total, item) => total + (item.type === 'income' ? item.amount : -item.amount),
        0,
      ),
    }));
  }, [filtered]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const transaction of filtered) {
      if (transaction.type === 'income') income += transaction.amount;
      else expense += transaction.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const hasFilters =
    scope === 'all' || search.trim() !== '' || typeFilter !== 'all' || accountFilter !== 'all';

  const clearFilters = () => {
    setScope('month');
    setSearch('');
    setTypeFilter('all');
    setAccountFilter('all');
  };

  const handleExport = () => {
    downloadText(
      `noxaplus-ledger-${jalaliKey(todayJalali())}.csv`,
      buildCsv(state),
      'text/csv;charset=utf-8',
    );
    notify('خروجی CSV از همه تراکنش‌ها آماده شد.', 'success');
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-head__title">تراکنش‌ها</h1>
          <p className="page-head__sub">
            {scope === 'month' ? `نمایش ${fmt.month(month)}` : 'نمایش همه ماه‌ها'} ·{' '}
            {fmt.number(filtered.length)} مورد
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={openImport}>
            <Icon name="upload" size={16} />
            ورود CSV
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleExport}
            title="خروجی کامل CSV"
          >
            <Icon name="download" size={16} />
            خروجی CSV
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => openTransaction()}>
            <Icon name="plus" size={16} />
            تراکنش جدید
          </button>
        </div>
      </header>

      <section className="card toolbar" aria-label="فیلترها">
        <div className="segmented segmented--scope" role="group" aria-label="بازه زمانی">
          <button
            type="button"
            className={`segmented__item ${scope === 'month' ? 'is-active' : ''}`}
            onClick={() => setScope('month')}
            aria-pressed={scope === 'month'}
          >
            این ماه
          </button>
          <button
            type="button"
            className={`segmented__item ${scope === 'all' ? 'is-active' : ''}`}
            onClick={() => setScope('all')}
            aria-pressed={scope === 'all'}
          >
            همه ماه‌ها
          </button>
        </div>

        <label className="search-field">
          <Icon name="search" size={17} />
          <span className="visually-hidden">جست‌وجو در تراکنش‌ها</span>
          <input
            className="search-field__input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو: توضیح، دسته، حساب، مبلغ…"
            type="search"
          />
          {search ? (
            <button
              type="button"
              className="search-field__clear"
              onClick={() => setSearch('')}
              aria-label="پاک کردن جست‌وجو"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </label>

        <label className="select-field">
          <span className="visually-hidden">نوع تراکنش</span>
          <select
            className="field__control"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
          >
            <option value="all">همه انواع</option>
            <option value="expense">هزینه</option>
            <option value="income">درآمد</option>
          </select>
        </label>

        <label className="select-field">
          <span className="visually-hidden">حساب</span>
          <select
            className="field__control"
            value={accountFilter}
            onChange={(event) => setAccountFilter(event.target.value)}
          >
            <option value="all">همه حساب‌ها</option>
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {hasFilters ? (
          <button type="button" className="link-btn" onClick={clearFilters}>
            <Icon name="x" size={14} />
            پاک کردن فیلترها
          </button>
        ) : null}
      </section>

      <section className="card list-card">
        <header className="list-card__head">
          <div className="list-card__summary">
            <span>
              درآمد: <strong className="income num">{fmt.money(summary.income)}</strong>
            </span>
            <span>
              هزینه: <strong className="expense num">{fmt.money(summary.expense)}</strong>
            </span>
            <span>
              خالص:{' '}
              <strong className={`num ${summary.net >= 0 ? 'income' : 'expense'}`}>
                {fmt.signedMoney(Math.abs(summary.net), summary.net >= 0 ? 'income' : 'expense')}
              </strong>
            </span>
          </div>
          <span className="badge badge--muted">{fmt.number(filtered.length)} تراکنش</span>
        </header>

        {state.transactions.length === 0 ? (
          <EmptyState
            icon="list"
            title="هنوز تراکنشی ثبت نشده است"
            text="اولین هزینه یا درآمد را ثبت کنید، یا فایل CSV خود را وارد کنید."
            action={
              <div className="empty__buttons">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => openTransaction()}
                >
                  <Icon name="plus" size={16} />
                  ثبت تراکنش
                </button>
                <button type="button" className="btn btn--soft btn--sm" onClick={openImport}>
                  <Icon name="upload" size={16} />
                  ورود CSV
                </button>
              </div>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="چیزی پیدا نشد"
            text="فیلترها را تغییر دهید یا عبارت دیگری جست‌وجو کنید."
            action={
              <button type="button" className="btn btn--soft btn--sm" onClick={clearFilters}>
                پاک کردن فیلترها
              </button>
            }
          />
        ) : (
          <div className="tx-groups">
            {groups.map((group) => (
              <section key={group.date} className="tx-group" aria-label={fmt.date(group.date, 'long')}>
                <header className="tx-group__head">
                  <div className="tx-group__date">
                    <span className="tx-group__day num">{fmt.date(group.date, 'long')}</span>
                    <span className="tx-group__weekday">{fmt.weekday(group.date)}</span>
                  </div>
                  <span
                    className={`tx-group__net num ${group.net >= 0 ? 'income' : 'expense'}`}
                  >
                    {fmt.signedMoney(Math.abs(group.net), group.net >= 0 ? 'income' : 'expense')}
                  </span>
                </header>
                <div className="tx-list">
                  {group.items.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      category={
                        transaction.categoryId
                          ? categoryById.get(transaction.categoryId)
                          : undefined
                      }
                      account={accountById.get(transaction.accountId)}
                      fmt={fmt}
                      onEdit={(item) => openTransaction(item)}
                      onDelete={requestDelete}
                      showDate={false}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
