import { useMemo, useState } from 'react';
import type { PageProps } from '../appTypes';
import {
  averageMonthly,
  categoryTotals,
  monthlySeries,
  topExpenses,
  totalsInMonth,
  transactionsInMonth,
} from '../core/reports';
import { DonutChart, TrendChart } from '../components/Charts';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

export function Reports({ ctx }: PageProps) {
  const { ledger, fmt, month } = ctx;
  const state = ledger.state;
  const [range, setRange] = useState<6 | 12>(6);

  const series = useMemo(
    () => monthlySeries(state.transactions, month, range),
    [state.transactions, month, range],
  );
  const average = useMemo(() => averageMonthly(series), [series]);
  const monthTransactions = useMemo(
    () => transactionsInMonth(state.transactions, month),
    [state.transactions, month],
  );
  const monthTotals = totalsInMonth(state.transactions, month);
  const expenseCats = useMemo(
    () => categoryTotals(monthTransactions, state.categories, 'expense'),
    [monthTransactions, state.categories],
  );
  const incomeCats = useMemo(
    () => categoryTotals(monthTransactions, state.categories, 'income'),
    [monthTransactions, state.categories],
  );
  const top = useMemo(() => topExpenses(monthTransactions, 6), [monthTransactions]);
  const savingsRate =
    monthTotals.income > 0
      ? Math.round((monthTotals.net / monthTotals.income) * 100)
      : null;

  return (
    <div className="page reports">
      <header className="page-head">
        <div>
          <h1 className="page-head__title">گزارش‌ها</h1>
          <p className="page-head__sub">تصویر کامل {fmt.month(month)} و روند ماه‌های اخیر</p>
        </div>
        <div className="page-head__actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => window.print()}
            title="چاپ گزارش"
          >
            <Icon name="printer" size={16} />
            چاپ گزارش
          </button>
        </div>
      </header>

      <section className="report-stats">
        <div className="mini-stat">
          <span className="mini-stat__label">درآمد ماه</span>
          <strong className="mini-stat__value income num">{fmt.money(monthTotals.income)}</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat__label">هزینه ماه</span>
          <strong className="mini-stat__value expense num">{fmt.money(monthTotals.expense)}</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat__label">تراز ماه</span>
          <strong className={`mini-stat__value num ${monthTotals.net >= 0 ? 'income' : 'expense'}`}>
            {fmt.signedMoney(Math.abs(monthTotals.net), monthTotals.net >= 0 ? 'income' : 'expense')}
          </strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat__label">نرخ پس‌انداز</span>
          <strong className="mini-stat__value num">
            {savingsRate === null ? '—' : `${fmt.number(savingsRate)}٪`}
          </strong>
        </div>
      </section>

      <section className="card">
        <header className="card__head">
          <div>
            <h2 className="card__title">روند درآمد و هزینه</h2>
            <p className="card__sub">
              {fmt.number(range)} ماه اخیر تا {fmt.month(month)}
            </p>
          </div>
          <div className="segmented segmented--small" role="group" aria-label="بازه گزارش">
            <button
              type="button"
              className={`segmented__item ${range === 6 ? 'is-active' : ''}`}
              onClick={() => setRange(6)}
              aria-pressed={range === 6}
            >
              {fmt.number(6)} ماه
            </button>
            <button
              type="button"
              className={`segmented__item ${range === 12 ? 'is-active' : ''}`}
              onClick={() => setRange(12)}
              aria-pressed={range === 12}
            >
              {fmt.number(12)} ماه
            </button>
          </div>
        </header>
        <TrendChart series={series} fmt={fmt} />
      </section>

      <div className="report-grid">
        <section className="card">
          <header className="card__head">
            <div>
              <h2 className="card__title">هزینه به تفکیک دسته</h2>
              <p className="card__sub">{fmt.month(month)}</p>
            </div>
          </header>
          {expenseCats.length === 0 ? (
            <EmptyState
              compact
              icon="chart"
              title="هزینه‌ای در این ماه نیست"
              text="برای دیدن ترکیب هزینه‌ها، ابتدا چند هزینه ثبت کنید."
            />
          ) : (
            <div className="report-donut">
              <DonutChart items={expenseCats} total={monthTotals.expense} fmt={fmt} />
              <ul className="cat-list">
                {expenseCats.map((item, index) => (
                  <li key={item.categoryId ?? 'none'} className="cat-list__row">
                    <span className="cat-list__rank num">{fmt.number(index + 1)}</span>
                    <i className="legend__dot" style={{ background: item.color }} />
                    <span className="cat-list__name">{item.name}</span>
                    <span className="cat-list__bar" aria-hidden="true">
                      <span
                        style={{
                          width: `${Math.max(item.share * 100, 3)}%`,
                          background: item.color,
                        }}
                      />
                    </span>
                    <span className="cat-list__share num">
                      {fmt.number(Math.round(item.share * 100))}٪
                    </span>
                    <span className="cat-list__amount num">{fmt.money(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="card">
          <header className="card__head">
            <div>
              <h2 className="card__title">بزرگ‌ترین هزینه‌ها</h2>
              <p className="card__sub">شش هزینه نخست این ماه</p>
            </div>
          </header>
          {top.length === 0 ? (
            <EmptyState compact icon="list" title="هزینه‌ای ثبت نشده است" />
          ) : (
            <ol className="top-list">
              {top.map((transaction, index) => {
                const category = state.categories.find(
                  (item) => item.id === transaction.categoryId,
                );
                return (
                  <li key={transaction.id} className="top-list__row">
                    <span className="top-list__rank num">{fmt.number(index + 1)}</span>
                    <div className="top-list__main">
                      <p className="top-list__title">
                        {transaction.note || category?.name || 'هزینه'}
                      </p>
                      <p className="top-list__meta">
                        {fmt.date(transaction.date, 'long')} · {category?.name ?? 'بدون دسته'}
                      </p>
                    </div>
                    <strong className="top-list__amount expense num">
                      {fmt.money(transaction.amount)}
                    </strong>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="card">
          <header className="card__head">
            <div>
              <h2 className="card__title">منابع درآمد</h2>
              <p className="card__sub">ترکیب درآمدهای {fmt.month(month)}</p>
            </div>
          </header>
          {incomeCats.length === 0 ? (
            <EmptyState compact icon="arrow-up" title="درآمدی در این ماه ثبت نشده" />
          ) : (
            <ul className="source-list">
              {incomeCats.map((item) => (
                <li key={item.categoryId ?? 'none'} className="source-list__row">
                  <div className="source-list__top">
                    <span className="source-list__name">
                      <i className="legend__dot" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="num">{fmt.money(item.amount)}</span>
                  </div>
                  <span className="source-list__bar" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.max(item.share * 100, 3)}%`,
                        background: item.color,
                      }}
                    />
                  </span>
                  <span className="source-list__share num">
                    {fmt.number(Math.round(item.share * 100))}٪ از کل درآمد
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card__head">
            <div>
              <h2 className="card__title">میانگین ماهانه</h2>
              <p className="card__sub">بر اساس {fmt.number(range)} ماه اخیر</p>
            </div>
          </header>
          <div className="avg-grid">
            <div className="avg-item">
              <span className="avg-item__label">درآمد</span>
              <strong className="avg-item__value income num">{fmt.money(average.income)}</strong>
            </div>
            <div className="avg-item">
              <span className="avg-item__label">هزینه</span>
              <strong className="avg-item__value expense num">{fmt.money(average.expense)}</strong>
            </div>
            <div className="avg-item">
              <span className="avg-item__label">تراز</span>
              <strong className={`avg-item__value num ${average.net >= 0 ? 'income' : 'expense'}`}>
                {fmt.signedMoney(Math.abs(average.net), average.net >= 0 ? 'income' : 'expense')}
              </strong>
            </div>
          </div>
          <p className="avg-note">
            میانگین‌ها به تومان و بر پایه ماه‌های دارای تراکنش محاسبه نشده‌اند؛ همه ماه‌های بازه
            در محاسبه حضور دارند.
          </p>
        </section>
      </div>
    </div>
  );
}
