import { useEffect, useId, useRef, useState } from 'react';
import { addMonths, jalaliKey, monthGrid, parseJalaliKey, todayJalali } from '../core/jalali';
import type { Formatter } from '../format';
import { Icon } from './Icon';

const WEEKDAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

interface JalaliDatePickerProps {
  value: string;
  onChange: (key: string) => void;
  fmt: Formatter;
}

export function JalaliDatePicker({ value, onChange, fmt }: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseJalaliKey(value) ?? todayJalali();
  const [view, setView] = useState({ jy: parsed.jy, jm: parsed.jm });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const today = todayJalali();
  const selectedKey = parseJalaliKey(value) ? value : '';
  const grid = monthGrid(view.jy, view.jm);

  useEffect(() => {
    if (!open) return;
    const current = parseJalaliKey(value);
    if (current) setView({ jy: current.jy, jm: current.jm });
    const onPointer = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, value]);

  return (
    <div className="date-picker" ref={wrapperRef}>
      <span id={labelId} className="field__label">
        تاریخ
      </span>
      <button
        ref={triggerRef}
        type="button"
        className={`date-picker__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((state) => !state)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={labelId}
      >
        <Icon name="calendar" size={17} />
        <span className="num">{fmt.date(value, 'long')}</span>
        <Icon name="chevron-down" size={15} className="date-picker__caret" />
      </button>

      {open ? (
        <div className="cal-pop" role="dialog" aria-label="انتخاب تاریخ">
          <div className="cal-pop__head">
            <button
              type="button"
              className="icon-btn icon-btn--soft"
              onClick={() => setView((current) => addMonths(current, -1))}
              aria-label="ماه قبل"
            >
              <Icon name="chevron-right" size={16} />
            </button>
            <strong>{fmt.month(view)}</strong>
            <button
              type="button"
              className="icon-btn icon-btn--soft"
              onClick={() => setView((current) => addMonths(current, 1))}
              aria-label="ماه بعد"
            >
              <Icon name="chevron-left" size={16} />
            </button>
          </div>
          <div className="cal-pop__weekdays" aria-hidden="true">
            {WEEKDAY_LETTERS.map((letter) => (
              <span key={letter}>{letter}</span>
            ))}
          </div>
          <div className="cal-pop__grid">
            {Array.from({ length: grid.blanks }, (_, index) => (
              <span key={`blank-${index}`} className="cal-pop__blank" />
            ))}
            {grid.days.map((day) => {
              const key = jalaliKey({ jy: view.jy, jm: view.jm, jd: day });
              const isSelected = key === selectedKey;
              const isToday = today.jy === view.jy && today.jm === view.jm && today.jd === day;
              return (
                <button
                  key={key}
                  type="button"
                  className={`cal-pop__day ${isSelected ? 'is-selected' : ''} ${
                    isToday ? 'is-today' : ''
                  }`}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  aria-pressed={isSelected}
                >
                  {fmt.number(day)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="cal-pop__today"
            onClick={() => {
              onChange(jalaliKey(today));
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            امروز — {fmt.date(jalaliKey(today), 'long')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
