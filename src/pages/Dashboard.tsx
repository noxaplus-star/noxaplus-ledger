import type { PageProps } from '../appTypes';
import {
  budgetProgress,
  categoryTotals,
  monthlySeries,
  totalBalance,
  totalsInMonth,
  transactionsInMonth,
  type BudgetProgress,
} from '../core/reports';
import type { Transaction } from '../core/types';
import { DonutChart, TrendChart } from '../components/Charts';
import { EmptyState } from '../components/EmptyState';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/Logo';
import { ProgressBar } from '../components/ProgressBar';
import { TransactionRow } from '../components/TransactionRow';

function sortByDate(transactions: Transaction[]): Transaction[] {
  return transactions
    .slice()
    .sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
    );
}

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  note: string;
  icon: IconName;
  tone: 'navy' | 'mint' | 'coral' | 'gold';
}

function StatCard({ label, value, unit, note, icon, tone }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon">
        <Icon name={icon} size={19} />
      </span>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value num">
        {value}
        {unit ? <span className="stat-card__unit">{unit}</span> : null}
      </p>
      <p className="stat-card__note">{note}</p>
    </article>
  );
}

function budgetTone(entry: BudgetProgress): 'default' | 'warn' | 'danger' {
  if (entry.ratio >= 1) return 'danger';
  if (entry.ratio >= 0.8) return 'warn';
  return 'default';
}

export function Dashboard({ ctx }: PageProps) {
  const { ledger, fmt, month, navigate, openTransaction, requestDelete, notify } = ctx;
  const state = ledger.state;
  const isEmpty = state.transactions.length === 0;
  const monthly = transactionsInMonth(state.transactions, month);
  const monthTotals = totalsInMonth(state.transactions, month);
  const balance = totalBalance(state.accounts, state.transactions);
  const series = monthlySeries(state.transactions, month, 6);
  const expenseTotals = categoryTotals(monthly, state.categories, 'expense');
  const budgets = budgetProgress(state.budgets, state.categories, state.transactions, month)
    .slice()
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  const recent = sortByDate(state.transactions).slice(0, 6);
  const savingsRate =
    monthTotals.income > 0 ? Math.round((monthTotals.net / monthTotals.income) * 100) : null;
  const expenseTotal = monthTotals.expense;

  return (
    <div className="page dashboard">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__copy">
          <p className="hero__eyebrow">NoxaPlus Ledger · {fmt.month(month)}</p>
          <h1 className="hero__title">خرج‌های این ماه، شفاف و بی‌دنگ.</h1>
          <p className="hero__text">
            دفتر مالی شما روی همین دستگاه می‌ماند؛ با تقویم جلالی، دسته‌بندی قاعده‌محور و
            بودجه‌هایی که واقعاً به کار می‌آیند.
          </p>
        </div>
        <div className="hero__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openTransaction(undefined, 'expense')}
          >
            <Icon name="plus" size={17} />
            ثبت هزینه
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => openTransaction(undefined, 'income')}
          >
            <Icon name="arrow-up" size={16} />
            ثبت درآمد
          </button>
        </div>
      </section>

      <section className="stat-grid" aria-label="خلاصه مالی">
        <StatCard
          label="موجودی کل"
          value={fmt.money(balance)}
          unit="تومان"
          note={`در ${fmt.number(state.accounts.length)} حساب فعال`}
          icon="wallet"
          tone="navy"
        />
        <StatCard
          label="درآمد این ماه"
          value={fmt.money(monthTotals.income)}
          unit="تومان"
          note={isEmpty ? 'هنوز تراکنشی ثبت نشده' : `${fmt.number(monthly.filter((t) => t.type === 'income').length)} واریزی`}
          icon="arrow-up"
          tone="mint"
        />
        <StatCard
          label="هزینه این ماه"
          value={fmt.money(monthTotals.expense)}
          unit="تومان"
          note={
            isEmpty
              ? 'با اولین ثبت شروع کنید'
              : `${fmt.number(monthly.filter((t) => t.type === 'expense').length)} پرداخت`
          }
          icon="arrow-down"
          tone="coral"
        />
        <StatCard
          label="تراز ماه"
          value={fmt.signedMoney(Math.abs(monthTotals.net), monthTotals.net >= 0 ? 'income' : 'expense')}
          unit="تومان"
          note={
            savingsRate === null
              ? 'برای محاسبه پس‌انداز، درآمد ثبت کنید'
              : `نرخ پس‌انداز ${fmt.number(savingsRate)}٪`
          }
          icon="sparkles"
          tone="gold"
        />
      </section>

      {isEmpty ? (
        <section className="card onboarding">
          <div className="onboarding__mark">
            <Logo size={64} />
          </div>
          <div className="onboarding__copy">
            <h2>دفتر تازه‌ات آماده است</h2>
            <p>
              اولین هزینه یا درآمد را ثبت کنید تا داشبورد، بودجه‌ها و گزارش‌ها زنده شوند. اگر
              می‌خواهید ابتدا همه‌چیز را ببینید، یک دفتر نمونه شش‌ماهه بارگذاری کنید.
            </p>
            <div className="onboarding__actions">
              <button type="button" className="btn btn--primary" onClick={() => openTransaction()}>
                <Icon name="plus" size={17} />
                ثبت اولین تراکنش
              </button>
              <button
                type="button"
                className="btn btn--soft"
                onClick={() => {
                  ledger.loadSample();
                  notify('دفتر نمونه بارگذاری شد.', 'success', {
                    label: 'بازگردانی',
                    onClick: ledger.undo,
                  });
                }}
              >
                <Icon name="database" size={16} />
                بارگذاری داده نمونه
              </button>
            </div>
          </div>
          <ul className="onboarding__features">
            <li>
              <Icon name="shield" size={17} />
              همه داده‌ها محلی و بدون آپلود
            </li>
            <li>
              <Icon name="calendar" size={17} />
              تقویم جلالی و ماه‌های شمسی
            </li>
            <li>
              <Icon name="sparkles" size={17} />
              دسته‌بندی خودکار با قواعد
            </li>
          </ul>
        </section>
      ) : (
        <div className="dash-grid">
          <section className="card card--trend">
            <header className="card__head">
              <div>
                <h2 className="card__title">روند شش‌ماهه</h2>
                <p className="card__sub">درآمد و هزینه، ماه به ماه</p>
              </div>
              <button type="button" className="card__link" onClick={() => navigate('reports')}>
                گزارش کامل
                <Icon name="chevron-left" size={14} />
              </button>
            </header>
            <TrendChart series={series} fmt={fmt} />
          </section>

          <section className="card card--donut">
            <header className="card__head">
              <div>
                <h2 className="card__title">ترکیب هزینه‌ها</h2>
                <p className="card__sub">{fmt.month(month)}</p>
              </div>
              <button type="button" className="card__link" onClick={() => navigate('budgets')}>
                بودجه‌ها
                <Icon name="chevron-left" size={14} />
              </button>
            </header>
            {expenseTotals.length === 0 ? (
              <EmptyState
                compact
                icon="chart"
                title="هزینه‌ای در این ماه ثبت نشده"
                text="با ثبت اولین هزینه، نمودار دسته‌ها ساخته می‌شود."
              />
            ) : (
              <>
                <div className="donut-wrap">
                  <DonutChart items={expenseTotals} total={expenseTotal} fmt={fmt} />
                  <ul className="legend">
                    {expenseTotals.slice(0, 4).map((item) => (
                      <li key={item.categoryId ?? 'none'} className="legend__row">
                        <i className="legend__dot" style={{ background: item.color }} />
                        <span className="legend__name">{item.name}</span>
                        <span className="legend__share num">
                          {fmt.number(Math.round(item.share * 100))}٪
                        </span>
                        <span className="legend__amount num">{fmt.compact(item.amount)}</span>
                      </li>
                    ))}
                    {expenseTotals.length > 4 ? (
                      <li className="legend__more">
                        و {fmt.number(expenseTotals.length - 4)} دسته دیگر
                      </li>
                    ) : null}
                  </ul>
                </div>
              </>
            )}
          </section>

          <section className="card card--budgets">
            <header className="card__head">
              <div>
                <h2 className="card__title">نبض بودجه‌ها</h2>
                <p className="card__sub">پرفشارترین دسته‌های این ماه</p>
              </div>
              <button type="button" className="card__link" onClick={() => navigate('budgets')}>
                مدیریت
                <Icon name="chevron-left" size={14} />
              </button>
            </header>
            {budgets.length === 0 ? (
              <EmptyState
                compact
                icon="sliders"
                title="بودجه‌ای تعیین نشده"
                text="برای دسته‌های پرهزینه سقف ماهانه بگذارید."
                action={
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => navigate('budgets')}
                  >
                    تعیین بودجه
                  </button>
                }
              />
            ) : (
              <ul className="budget-mini">
                {budgets.map((entry) => (
                  <li key={entry.categoryId} className="budget-mini__row">
                    <div className="budget-mini__top">
                      <span className="budget-mini__name">
                        <i className="legend__dot" style={{ background: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="budget-mini__numbers num">
                        {fmt.compact(entry.spent)} / {fmt.compact(entry.amount)}
                      </span>
                    </div>
                    <ProgressBar
                      ratio={entry.ratio}
                      tone={budgetTone(entry)}
                      label={`مصرف بودجه ${entry.name}`}
                    />
                    <p className="budget-mini__note">
                      {entry.remaining >= 0
                        ? `${fmt.money(entry.remaining)} تومان باقی مانده`
                        : `${fmt.money(Math.abs(entry.remaining))} تومان بیش از بودجه`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card card--recent">
            <header className="card__head">
              <div>
                <h2 className="card__title">آخرین تراکنش‌ها</h2>
                <p className="card__sub">آخرین حرکت‌های دفتر</p>
              </div>
              <button type="button" className="card__link" onClick={() => navigate('transactions')}>
                همه تراکنش‌ها
                <Icon name="chevron-left" size={14} />
              </button>
            </header>
            <div className="tx-list">
              {recent.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={state.categories.find((category) => category.id === transaction.categoryId)}
                  account={state.accounts.find((account) => account.id === transaction.accountId)}
                  fmt={fmt}
                  onEdit={(item) => openTransaction(item)}
                  onDelete={requestDelete}
                />
              ))}
            </div>
            <button
              type="button"
              className="btn btn--soft btn--block"
              onClick={() => openTransaction()}
            >
              <Icon name="plus" size={16} />
              ثبت تراکنش جدید
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
