import { useEffect, useRef, useState } from 'react';
import { addMonths, MONTH_NAMES, todayJalali } from '../core/jalali';
import type { MonthRef } from '../core/types';
import type { Formatter } from '../format';
import { Icon } from './Icon';

interface MonthSwitcherProps {
  month: MonthRef;
  onChange: (ref: MonthRef) => void;
  fmt: Formatter;
}

export function MonthSwitcher({ month, onChange, fmt }: MonthSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(month.jy);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = todayJalali();
  const isCurrent = month.jy === today.jy && month.jm === today.jm;

  useEffect(() => {
    setYear(month.jy);
  }, [month.jy]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="month-switcher" ref={rootRef}>
      <button
        type="button"
        className="icon-btn icon-btn--soft"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="ماه قبل"
        title="ماه قبل"
      >
        <Icon name="chevron-right" />
      </button>
      <button
        type="button"
        className="month-switcher__label"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="calendar" size={16} />
        <span>{fmt.month(month)}</span>
        <Icon name="chevron-down" size={14} className="month-switcher__caret" />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--soft"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="ماه بعد"
        title="ماه بعد"
      >
        <Icon name="chevron-left" />
      </button>
      {!isCurrent ? (
        <button
          type="button"
          className="month-switcher__today"
          onClick={() => onChange({ jy: today.jy, jm: today.jm })}
        >
          ماه جاری
        </button>
      ) : null}

      {open ? (
        <div className="month-pop" role="dialog" aria-label="انتخاب ماه">
          <div className="month-pop__head">
            <button
              type="button"
              className="icon-btn icon-btn--soft"
              onClick={() => setYear((value) => value - 1)}
              aria-label="سال قبل"
            >
              <Icon name="chevron-right" size={16} />
            </button>
            <strong className="num">{fmt.number(year)}</strong>
            <button
              type="button"
              className="icon-btn icon-btn--soft"
              onClick={() => setYear((value) => value + 1)}
              aria-label="سال بعد"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          </div>
          <div className="month-pop__grid">
            {MONTH_NAMES.map((name, index) => {
              const jm = index + 1;
              const selected = month.jy === year && month.jm === jm;
              const current = today.jy === year && today.jm === jm;
              return (
                <button
                  key={name}
                  type="button"
                  className={`month-pop__item ${selected ? 'is-selected' : ''} ${
                    current ? 'is-current' : ''
                  }`}
                  onClick={() => {
                    onChange({ jy: year, jm });
                    setOpen(false);
                  }}
                  aria-pressed={selected}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="month-pop__today"
            onClick={() => {
              onChange({ jy: today.jy, jm: today.jm });
              setOpen(false);
            }}
          >
            رفتن به ماه جاری
          </button>
        </div>
      ) : null}
    </div>
  );
}
