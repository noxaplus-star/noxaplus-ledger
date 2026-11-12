import { useEffect, useMemo, useState } from 'react';
import { csvTemplate, parseCsv } from '../core/csv';
import type { Formatter } from '../format';
import type { LedgerApi } from '../hooks/useLedger';
import { downloadText, readTextFile } from '../download';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface ImportDialogProps {
  open: boolean;
  ledger: LedgerApi;
  fmt: Formatter;
  onClose: () => void;
  onImported: (count: number) => void;
}

export function ImportDialog({ open, ledger, fmt, onClose, onImported }: ImportDialogProps) {
  const accounts = ledger.state.accounts;
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fallbackAccountId, setFallbackAccountId] = useState(accounts[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFallbackAccountId((current) =>
      accounts.some((account) => account.id === current) ? current : (accounts[0]?.id ?? ''),
    );
  }, [open, accounts]);

  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text]);
  const ready = parsed ? parsed.rows.length : 0;

  const loadFile = async (file: File) => {
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setError('فقط فایل CSV یا متن جداشده با کاما پذیرفته می‌شود.');
      return;
    }
    try {
      const content = await readTextFile(file);
      setText(content);
      setFileName(file.name);
      setError(null);
    } catch {
      setError('خواندن فایل ممکن نشد.');
    }
  };

  const handleImport = () => {
    if (!parsed || parsed.rows.length === 0) {
      setError('هیچ سطر معتبری برای افزودن پیدا نشد.');
      return;
    }
    if (!fallbackAccountId) {
      setError('یک حساب پیش‌فرض انتخاب کنید.');
      return;
    }
    const count = ledger.importTransactions(parsed.rows, fallbackAccountId);
    if (count === 0) {
      setError('هیچ تراکنشی افزوده نشد.');
      return;
    }
    setText('');
    setFileName(null);
    onImported(count);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="ورود تراکنش‌ها از CSV"
      subtitle="فایل را انتخاب کنید یا محتوای آن را جای‌گذاری کنید."
      size="lg"
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleImport}
            disabled={ready === 0}
          >
            <Icon name="upload" size={17} />
            افزودن {ready > 0 ? `${fmt.number(ready)} تراکنش` : ''}
          </button>
        </div>
      }
    >
      <div className="form">
        {error ? (
          <p className="form__error" role="alert">
            <Icon name="alert" size={16} />
            {error}
          </p>
        ) : null}

        <label
          className="dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) void loadFile(file);
          }}
        >
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="visually-hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadFile(file);
              event.target.value = '';
            }}
          />
          <span className="dropzone__icon">
            <Icon name="upload" size={22} />
          </span>
          <span className="dropzone__title">
            {fileName ? fileName : 'انتخاب فایل CSV یا رها کردن آن در این کادر'}
          </span>
          <span className="dropzone__hint">
            ستون‌های تاریخ، نوع و مبلغ الزامی هستند؛ حساب، دسته و توضیح اختیاری‌اند.
          </span>
        </label>

        <label className="field">
          <span className="field__label">محتوای CSV</span>
          <textarea
            className="field__control field__control--area"
            dir="ltr"
            rows={7}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            placeholder={'date,type,amount,account,category,note\n1405-08-21,expense,250000,حساب اصلی,خوراک,خرید روزانه'}
            spellCheck={false}
          />
        </label>

        <div className="import-meta">
          <div className="import-meta__row">
            <span className={`badge ${ready > 0 ? 'badge--mint' : 'badge--muted'}`}>
              {fmt.number(ready)} تراکنش آماده
            </span>
            {parsed && parsed.errors.length > 0 ? (
              <span className="badge badge--danger">
                {fmt.number(parsed.errors.length)} خطا
              </span>
            ) : null}
            <button
              type="button"
              className="link-btn"
              onClick={() =>
                downloadText('noxaplus-ledger-template.csv', csvTemplate(), 'text/csv;charset=utf-8')
              }
            >
              <Icon name="download" size={14} />
              دریافت فایل نمونه
            </button>
          </div>
          {parsed && parsed.errors.length > 0 ? (
            <details className="import-errors">
              <summary>مشاهده خطاهای خواندن</summary>
              <ul>
                {parsed.errors.slice(0, 8).map((message) => (
                  <li key={message}>{message}</li>
                ))}
                {parsed.errors.length > 8 ? (
                  <li>و {fmt.number(parsed.errors.length - 8)} خطای دیگر…</li>
                ) : null}
              </ul>
            </details>
          ) : null}
        </div>

        <label className="field">
          <span className="field__label">حساب پیش‌فرض برای نام‌های ناشناخته</span>
          <select
            className="field__control"
            value={fallbackAccountId}
            onChange={(event) => setFallbackAccountId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <span className="field__hint">
            اگر نام حساب یا دسته در فایل با دفتر هم‌خوان نباشد، حساب پیش‌فرض استفاده می‌شود و
            دسته از طریق قواعد حدس زده می‌شود.
          </span>
        </label>
      </div>
    </Modal>
  );
}
