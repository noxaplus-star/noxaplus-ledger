import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { jalaliKey, parseJalaliKey, todayJalali } from '../core/jalali';
import { parseAmount } from '../core/money';
import { suggestCategoryId } from '../core/rules';
import type { Transaction, TransactionType } from '../core/types';
import type { Formatter } from '../format';
import type { LedgerApi } from '../hooks/useLedger';
import { Icon } from './Icon';
import { JalaliDatePicker } from './JalaliDatePicker';
import { Modal } from './Modal';

interface TransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  presetType: TransactionType;
  ledger: LedgerApi;
  fmt: Formatter;
  onClose: () => void;
  onSaved: (mode: 'created' | 'updated') => void;
}

export function TransactionDialog({
  open,
  transaction,
  presetType,
  ledger,
  fmt,
  onClose,
  onSaved,
}: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formId = `tx-form-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const accounts = ledger.state.accounts;
  const categories = ledger.state.categories;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setAccountId(transaction.accountId);
      setCategoryId(transaction.categoryId);
      setNote(transaction.note);
    } else {
      setType(presetType);
      setAmount('');
      setDate(jalaliKey(todayJalali()));
      setAccountId(accounts[0]?.id ?? '');
      setCategoryId(null);
      setNote('');
    }
  }, [open, transaction, presetType]);

  const typeCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const suggestion = useMemo(
    () => suggestCategoryId(ledger.state.rules, categories, type, note),
    [ledger.state.rules, categories, type, note],
  );
  const suggestionCategory = suggestion
    ? categories.find((category) => category.id === suggestion)
    : undefined;

  const parsedAmount = parseAmount(amount);

  const changeType = (next: TransactionType) => {
    setType(next);
    setCategoryId((current) => {
      if (!current) return current;
      const category = categories.find((item) => item.id === current);
      return category?.type === next ? current : null;
    });
    setError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = parseAmount(amount);
    if (value === null) {
      setError('مبلغ باید عدد صحیح و بزرگ‌تر از صفر باشد.');
      return;
    }
    if (!parseJalaliKey(date)) {
      setError('تاریخ انتخاب‌شده معتبر نیست.');
      return;
    }
    if (!accounts.some((account) => account.id === accountId)) {
      setError('یک حساب معتبر انتخاب کنید.');
      return;
    }
    const input = { date, amount: value, type, accountId, categoryId, note };
    if (transaction) {
      ledger.updateTransaction(transaction.id, input);
      onSaved('updated');
    } else {
      ledger.addTransaction(input);
      onSaved('created');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title={transaction ? 'ویرایش تراکنش' : 'تراکنش جدید'}
      subtitle={
        transaction
          ? 'تغییرات بلافاصله در دفتر مالی ذخیره می‌شود.'
          : 'مبلغ، تاریخ و حساب را وارد کنید؛ باقی کارها با قواعد انجام می‌شود.'
      }
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" form={formId} className="btn btn--primary">
            <Icon name={transaction ? 'check' : 'plus'} size={17} />
            {transaction ? 'ذخیره تغییرات' : type === 'expense' ? 'ثبت هزینه' : 'ثبت درآمد'}
          </button>
        </div>
      }
    >
      <form id={formId} className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <p className="form__error" role="alert">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : null}

        <div className="segmented segmented--type" role="group" aria-label="نوع تراکنش">
          <button
            type="button"
            className={`segmented__item ${type === 'expense' ? 'is-active is-expense' : ''}`}
            onClick={() => changeType('expense')}
            aria-pressed={type === 'expense'}
          >
            <Icon name="arrow-down" size={16} />
            هزینه
          </button>
          <button
            type="button"
            className={`segmented__item ${type === 'income' ? 'is-active is-income' : ''}`}
            onClick={() => changeType('income')}
            aria-pressed={type === 'income'}
          >
            <Icon name="arrow-up" size={16} />
            درآمد
          </button>
        </div>

        <label className="field field--amount">
          <span className="field__label">مبلغ</span>
          <span className={`amount-box ${type === 'income' ? 'amount-box--income' : ''}`}>
            <input
              className="amount-box__input num"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError(null);
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="مثلاً ۲۵۰٬۰۰۰"
              aria-describedby={`${formId}-amount-hint`}
              data-autofocus
            />
            <span className="amount-box__unit">تومان</span>
          </span>
          <span id={`${formId}-amount-hint`} className="field__hint num">
            {parsedAmount !== null
              ? `معادل ${fmt.money(parsedAmount)} تومان`
              : 'فقط عدد صحیح مثبت؛ جداکننده هزارگان و ارقام فارسی هم پذیرفته می‌شود.'}
          </span>
        </label>

        <JalaliDatePicker value={date} onChange={setDate} fmt={fmt} />

        <div className="form__row">
          <label className="field">
            <span className="field__label">حساب</span>
            <select
              className="field__control"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">دسته‌بندی</span>
            <select
              className="field__control"
              value={categoryId ?? ''}
              onChange={(event) => setCategoryId(event.target.value || null)}
            >
              <option value="">بدون دسته</option>
              {typeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.id === suggestion ? ' (پیشنهاد قاعده)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {suggestionCategory && suggestion !== categoryId ? (
          <div className="rule-hint">
            <Icon name="sparkles" size={16} />
            <span>
              دسته «{suggestionCategory.name}» با قاعده‌های شما هم‌خوان است.
            </span>
            <button
              type="button"
              className="rule-hint__apply"
              onClick={() => setCategoryId(suggestionCategory.id)}
            >
              اعمال
            </button>
          </div>
        ) : null}

        <label className="field">
          <span className="field__label">
            توضیح
            <span className="field__count num">
              {fmt.number(note.length)} از {fmt.number(160)}
            </span>
          </span>
          <input
            className="field__control"
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 160))}
            placeholder="مثلاً خرید هفتگی، تاکسی، حقوق ماهانه"
            maxLength={160}
          />
        </label>
        <p className="field__hint">
          اگر دسته را خالی بگذارید، قواعد دسته‌بندی بر اساس همین توضیح اعمال می‌شوند.
        </p>
      </form>
    </Modal>
  );
}
