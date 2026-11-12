import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PageProps } from '../appTypes';
import { parseAmount } from '../core/money';
import {
  budgetProgress,
  categoryTotals,
  transactionsInMonth,
} from '../core/reports';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ProgressBar';

function toneFor(ratio: number): 'default' | 'warn' | 'danger' {
  if (ratio >= 1) return 'danger';
  if (ratio >= 0.8) return 'warn';
  return 'default';
}

export function Budgets({ ctx }: PageProps) {
  const { ledger, fmt, month, notify, confirm } = ctx;
  const state = ledger.state;
  const progress = useMemo(
    () =>
      budgetProgress(state.budgets, state.categories, state.transactions, month).sort(
        (a, b) => b.ratio - a.ratio,
      ),
    [state.budgets, state.categories, state.transactions, month],
  );

  const expenseCategories = useMemo(
    () => state.categories.filter((category) => category.type === 'expense'),
    [state.categories],
  );
  const available = useMemo(
    () =>
      expenseCategories.filter(
        (category) => !state.budgets.some((budget) => budget.categoryId === category.id),
      ),
    [expenseCategories, state.budgets],
  );
  const [newCategoryId, setNewCategoryId] = useState(available[0]?.id ?? '');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    if (!available.some((category) => category.id === newCategoryId)) {
      setNewCategoryId(available[0]?.id ?? '');
    }
  }, [available, newCategoryId]);

  const summary = useMemo(() => {
    const totalBudget = progress.reduce((total, entry) => total + entry.amount, 0);
    const spent = progress.reduce((total, entry) => total + entry.spent, 0);
    return {
      totalBudget,
      spent,
      remaining: totalBudget - spent,
      ratio: totalBudget > 0 ? spent / totalBudget : 0,
    };
  }, [progress]);

  const spendByCategory = useMemo(() => {
    const totals = categoryTotals(
      transactionsInMonth(state.transactions, month),
      state.categories,
      'expense',
    );
    return new Map(totals.map((item) => [item.categoryId, item.amount]));
  }, [state.transactions, state.categories, month]);

  const unbudgeted = available
    .map((category) => ({
      category,
      spent: spendByCategory.get(category.id) ?? 0,
    }))
    .filter((entry) => entry.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseAmount(newAmount);
    if (!amount) {
      notify('مبلغ بودجه باید عدد صحیح مثبت باشد.', 'error');
      return;
    }
    if (!newCategoryId) {
      notify('یک دسته‌بندی انتخاب کنید.', 'error');
      return;
    }
    const result = ledger.setBudget(newCategoryId, amount);
    if (!result.ok) {
      notify(result.error, 'error');
      return;
    }
    const category = state.categories.find((item) => item.id === newCategoryId);
    setNewAmount('');
    notify(`بودجه «${category?.name ?? ''}» ثبت شد.`, 'success', {
      label: 'بازگردانی',
      onClick: ledger.undo,
    });
  };

  const startEdit = (categoryId: string, amount: number) => {
    setEditingId(categoryId);
    setEditAmount(String(amount));
  };

  const saveEdit = (categoryId: string) => {
    const amount = parseAmount(editAmount);
    if (!amount) {
      notify('مبلغ بودجه باید عدد صحیح مثبت باشد.', 'error');
      return;
    }
    const result = ledger.setBudget(categoryId, amount);
    if (!result.ok) {
      notify(result.error, 'error');
      return;
    }
    setEditingId(null);
    setEditAmount('');
    notify('بودجه به‌روزرسانی شد.', 'success');
  };

  const removeBudget = (categoryId: string) => {
    const category = state.categories.find((item) => item.id === categoryId);
    confirm({
      title: 'حذف بودجه',
      message: `بودجه دسته «${category?.name ?? ''}» برای همه ماه‌ها حذف شود؟ تراکنش‌ها دست‌نخورده می‌مانند.`,
      confirmLabel: 'حذف بودجه',
      tone: 'danger',
      onConfirm: () => {
        ledger.setBudget(categoryId, null);
        notify('بودجه حذف شد.', 'info', { label: 'بازگردانی', onClick: ledger.undo });
      },
    });
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-head__title">بودجه‌ها</h1>
          <p className="page-head__sub">سقف ماهانه برای دسته‌های هزینه · {fmt.month(month)}</p>
        </div>
      </header>

      {progress.length === 0 ? (
        <section className="card">
          <EmptyState
            icon="sliders"
            title="برای هزینه‌هایتان سقف بگذارید"
            text="با تعیین بودجه ماهانه، پیش از تمام شدن پول متوجه می‌شوید. بودجه‌ها برای هر ماه دوباره محاسبه می‌شوند."
          />
        </section>
      ) : (
        <section className="card budget-summary">
          <div className="budget-summary__top">
            <div>
              <p className="budget-summary__label">مجموع بودجه این ماه</p>
              <p className="budget-summary__value num">
                {fmt.money(summary.totalBudget)}
                <span>تومان</span>
              </p>
            </div>
            <div className="budget-summary__side">
              <p>
                مصرف‌شده: <strong className="num">{fmt.money(summary.spent)}</strong>
              </p>
              <p>
                {summary.remaining >= 0 ? 'باقی‌مانده' : 'بیش از بودجه'}:{' '}
                <strong className={`num ${summary.remaining >= 0 ? 'income' : 'expense'}`}>
                  {fmt.money(Math.abs(summary.remaining))}
                </strong>
              </p>
            </div>
          </div>
          <ProgressBar
            ratio={summary.ratio}
            tone={toneFor(summary.ratio)}
            label="مصرف کل بودجه"
          />
          <p className="budget-summary__hint">
            {summary.ratio >= 1
              ? 'از سقف کل بودجه عبور کرده‌اید؛ هزینه‌های این ماه را بازبینی کنید.'
              : `${fmt.number(Math.round((1 - Math.min(summary.ratio, 1)) * 100))}٪ از بودجه کل باقی مانده است.`}
          </p>
        </section>
      )}

      {progress.length > 0 ? (
        <div className="budget-grid">
          {progress.map((entry) => {
            const editing = editingId === entry.categoryId;
            return (
              <article key={entry.categoryId} className="card budget-card">
                <header className="budget-card__head">
                  <span className="budget-card__name">
                    <i className="legend__dot" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  {!editing ? (
                    <div className="budget-card__actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn--soft"
                        onClick={() => startEdit(entry.categoryId, entry.amount)}
                        aria-label={`ویرایش بودجه ${entry.name}`}
                        title="ویرایش"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--soft icon-btn--danger"
                        onClick={() => removeBudget(entry.categoryId)}
                        aria-label={`حذف بودجه ${entry.name}`}
                        title="حذف"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ) : null}
                </header>

                {editing ? (
                  <form
                    className="budget-card__editor"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEdit(entry.categoryId);
                    }}
                  >
                    <label className="field">
                      <span className="field__label">سقف ماهانه</span>
                      <input
                        className="field__control num"
                        value={editAmount}
                        onChange={(event) => setEditAmount(event.target.value)}
                        inputMode="numeric"
                        autoFocus
                      />
                    </label>
                    <div className="budget-card__editor-actions">
                      <button type="submit" className="btn btn--primary btn--sm">
                        ذخیره
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setEditingId(null)}
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="budget-card__amount num">
                      {fmt.money(entry.spent)}
                      <span className="budget-card__of">از {fmt.money(entry.amount)} تومان</span>
                    </p>
                    <ProgressBar
                      ratio={entry.ratio}
                      tone={toneFor(entry.ratio)}
                      label={`مصرف بودجه ${entry.name}`}
                    />
                    <div className="budget-card__foot">
                      <span className="num">
                        {fmt.number(Math.round(entry.ratio * 100))}٪ مصرف
                      </span>
                      <span className={`num ${entry.remaining >= 0 ? 'income' : 'expense'}`}>
                        {entry.remaining >= 0
                          ? `${fmt.money(entry.remaining)} باقی`
                          : `${fmt.money(Math.abs(entry.remaining))} بیش از سقف`}
                      </span>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : null}

      <div className="budget-lower">
        {available.length > 0 ? (
          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">افزودن بودجه</h2>
                <p className="card__sub">برای یک دسته هزینه، سقف ماهانه تعیین کنید</p>
              </div>
            </header>
            <form className="budget-form" onSubmit={handleAdd}>
              <label className="field">
                <span className="field__label">دسته‌بندی</span>
                <select
                  className="field__control"
                  value={newCategoryId}
                  onChange={(event) => setNewCategoryId(event.target.value)}
                >
                  {available.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">سقف ماهانه (تومان)</span>
                <input
                  className="field__control num"
                  value={newAmount}
                  onChange={(event) => setNewAmount(event.target.value)}
                  inputMode="numeric"
                  placeholder="مثلاً ۵٬۰۰۰٬۰۰۰"
                />
              </label>
              <button type="submit" className="btn btn--primary">
                <Icon name="plus" size={16} />
                ثبت بودجه
              </button>
            </form>
          </section>
        ) : null}

        {unbudgeted.length > 0 ? (
          <section className="card">
            <header className="card__head">
              <div>
                <h2 className="card__title">هزینه‌های بدون سقف</h2>
                <p className="card__sub">این دسته‌ها در این ماه خرج داشته‌اند</p>
              </div>
            </header>
            <ul className="unbudgeted">
              {unbudgeted.slice(0, 5).map((entry) => (
                <li key={entry.category.id} className="unbudgeted__row">
                  <span className="unbudgeted__name">
                    <i className="legend__dot" style={{ background: entry.category.color }} />
                    {entry.category.name}
                  </span>
                  <span className="unbudgeted__spent num">{fmt.money(entry.spent)}</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setNewCategoryId(entry.category.id);
                      setNewAmount(String(entry.spent));
                    }}
                  >
                    تعیین بودجه
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
