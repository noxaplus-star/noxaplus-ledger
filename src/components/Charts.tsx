import { MONTH_NAMES } from '../core/jalali';
import type { MonthlyTotals } from '../core/reports';
import type { Formatter } from '../format';

interface TrendChartProps {
  series: MonthlyTotals[];
  fmt: Formatter;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function TrendChart({ series, fmt }: TrendChartProps) {
  const width = 760;
  const height = 290;
  const padding = { top: 24, right: 18, bottom: 44, left: 64 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = niceMax(Math.max(...series.map((item) => Math.max(item.income, item.expense)), 1));
  const groupWidth = innerWidth / Math.max(series.length, 1);
  const barWidth = Math.min(18, groupWidth * 0.26);
  const baseline = padding.top + innerHeight;
  const ticks = [0.25, 0.5, 0.75, 1];

  return (
    <div className="chart">
      <div className="chart-legend">
        <span className="chart-legend__item">
          <i className="chart-legend__dot chart-legend__dot--income" /> درآمد
        </span>
        <span className="chart-legend__item">
          <i className="chart-legend__dot chart-legend__dot--expense" /> هزینه
        </span>
      </div>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="نمودار ستونی درآمد و هزینه ماه‌های اخیر"
      >
        {ticks.map((tick) => {
          const y = baseline - innerHeight * tick;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="chart__grid"
              />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="chart__axis">
                {fmt.compact(Math.round(maxValue * tick))}
              </text>
            </g>
          );
        })}
        <line
          x1={padding.left}
          x2={width - padding.right}
          y1={baseline}
          y2={baseline}
          className="chart__axis-line"
        />
        {series.map((item, index) => {
          const center = padding.left + groupWidth * index + groupWidth / 2;
          const incomeHeight = Math.max((item.income / maxValue) * innerHeight, item.income > 0 ? 3 : 0);
          const expenseHeight = Math.max(
            (item.expense / maxValue) * innerHeight,
            item.expense > 0 ? 3 : 0,
          );
          return (
            <g key={`${item.ref.jy}-${item.ref.jm}`} className="chart__group">
              <rect
                x={center - barWidth - 2}
                y={baseline - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                rx={Math.min(5, barWidth / 2)}
                className="chart__bar chart__bar--income"
              >
                <title>{`${fmt.month(item.ref)} — درآمد ${fmt.money(item.income)}`}</title>
              </rect>
              <rect
                x={center + 2}
                y={baseline - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                rx={Math.min(5, barWidth / 2)}
                className="chart__bar chart__bar--expense"
              >
                <title>{`${fmt.month(item.ref)} — هزینه ${fmt.money(item.expense)}`}</title>
              </rect>
              <text x={center} y={height - 16} textAnchor="middle" className="chart__label">
                {MONTH_NAMES[item.ref.jm - 1]}
              </text>
              <text x={center} y={height - 3} textAnchor="middle" className="chart__label chart__label--year">
                {fmt.digits(String(item.ref.jy).slice(2))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export interface DonutItem {
  name: string;
  color: string;
  amount: number;
  share: number;
}

interface DonutChartProps {
  items: DonutItem[];
  total: number;
  fmt: Formatter;
  label?: string;
}

export function DonutChart({ items, total, fmt, label = 'هزینه' }: DonutChartProps) {
  const size = 190;
  const radius = 66;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`نمودار حلقه‌ای ترکیب ${label}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="donut__track"
        />
        {items.map((item) => {
          const length = Math.max(item.share * circumference, 0);
          const dashOffset = -offset;
          offset += length;
          return (
            <circle
              key={`${item.name}-${item.color}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            >
              <title>{`${item.name} — ${fmt.money(item.amount)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="donut__center">
        <span className="donut__label">{label} ماه</span>
        <strong className="donut__value num">{fmt.compact(total)}</strong>
        <span className="donut__unit">تومان</span>
      </div>
    </div>
  );
}
