import { useRef } from 'react';
import type { PageProps } from '../appTypes';
import { APP_VERSION, CONTACT_EMAIL, REPO_URL, SITE_URL } from '../constants';
import { buildCsv } from '../core/csv';
import { jalaliKey, todayJalali } from '../core/jalali';
import { parseBackup, serializeBackup } from '../core/storage';
import { downloadText } from '../download';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';

export function Settings({ ctx }: PageProps) {
  const { ledger, fmt, notify, confirm, openImport, openHelp, canInstall, install } = ctx;
  const state = ledger.state;
  const restoreRef = useRef<HTMLInputElement>(null);
  const todayKey = jalaliKey(todayJalali());

  const downloadBackup = () => {
    downloadText(
      `noxaplus-ledger-backup-${todayKey}.json`,
      serializeBackup(state),
      'application/json',
    );
    notify('فایل پشتیبان ساخته شد.', 'success');
  };

  const downloadCsv = () => {
    downloadText(`noxaplus-ledger-${todayKey}.csv`, buildCsv(state), 'text/csv;charset=utf-8');
    notify('خروجی CSV آماده شد.', 'success');
  };

  const restoreFile = async (file: File) => {
    let text = '';
    try {
      text = await file.text();
    } catch {
      notify('خواندن فایل ممکن نشد.', 'error');
      return;
    }
    const parsed = parseBackup(text);
    if ('error' in parsed) {
      notify(parsed.error, 'error');
      return;
    }
    confirm({
      title: 'بازگردانی پشتیبان',
      message: `دفتر فعلی با ${fmt.number(parsed.state.transactions.length)} تراکنش و ${fmt.number(parsed.state.accounts.length)} حساب از فایل پشتیبان جایگزین می‌شود.`,
      confirmLabel: 'بازگردانی',
      onConfirm: () => {
        ledger.replaceState(parsed.state);
        notify('پشتیبان با موفقیت بازگردانی شد.', 'success', {
          label: 'بازگردانی',
          onClick: ledger.undo,
        });
      },
    });
  };

  const loadSample = () => {
    confirm({
      title: 'بارگذاری داده نمونه',
      message:
        'دفتر فعلی با یک دفتر نمونه شش‌ماهه جایگزین می‌شود. این کار برای آشنایی با گزارش‌ها و بودجه‌ها مناسب است و بلافاصله قابل بازگردانی است.',
      confirmLabel: 'بارگذاری نمونه',
      onConfirm: () => {
        ledger.loadSample();
        notify('دفتر نمونه بارگذاری شد.', 'success', {
          label: 'بازگردانی',
          onClick: ledger.undo,
        });
      },
    });
  };

  const resetAll = () => {
    confirm({
      title: 'پاک کردن دفتر',
      message:
        'همه تراکنش‌ها، حساب‌ها، دسته‌بندی‌ها، قواعد و بودجه‌ها حذف می‌شوند و دفتر با یک حساب پیش‌فرض خالی می‌شود. پیش از ادامه، پشتیبان بگیرید.',
      confirmLabel: 'پاک کردن همه',
      tone: 'danger',
      onConfirm: () => {
        ledger.resetAll();
        notify('دفتر خالی شد.', 'info', { label: 'بازگردانی', onClick: ledger.undo });
      },
    });
  };

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <h1 className="page-head__title">تنظیمات</h1>
          <p className="page-head__sub">ظاهر، داده‌ها و اطلاعات برنامه</p>
        </div>
      </header>

      {ledger.storageFailed ? (
        <div className="alert alert--danger" role="alert">
          <Icon name="alert" size={18} />
          <div>
            <strong>ذخیره‌سازی محلی در دسترس نیست.</strong>
            <p>
              تغییرات فقط تا زمانی که این صفحه باز است نگه داشته می‌شوند. پیش از بستن، از بخش
              پشتیبان‌گیری یک فایل JSON بگیرید.
            </p>
          </div>
        </div>
      ) : null}

      <div className="settings-grid">
        <section className="card settings-card">
          <header className="card__head">
            <div>
              <h2 className="card__title">
                <Icon name="sliders" size={18} /> ظاهر و نمایش
              </h2>
              <p className="card__sub">تم و شکل اعداد را انتخاب کنید</p>
            </div>
          </header>

          <div className="theme-options" role="group" aria-label="تم برنامه">
            <button
              type="button"
              className={`theme-option ${state.settings.theme === 'light' ? 'is-active' : ''}`}
              onClick={() => ledger.setTheme('light')}
              aria-pressed={state.settings.theme === 'light'}
            >
              <span className="theme-option__swatch theme-option__swatch--light" aria-hidden="true" />
              <span className="theme-option__label">
                <Icon name="sun" size={16} />
                روشن
              </span>
              {state.settings.theme === 'light' ? <Icon name="check" size={16} /> : null}
            </button>
            <button
              type="button"
              className={`theme-option ${state.settings.theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => ledger.setTheme('dark')}
              aria-pressed={state.settings.theme === 'dark'}
            >
              <span className="theme-option__swatch theme-option__swatch--dark" aria-hidden="true" />
              <span className="theme-option__label">
                <Icon name="moon" size={16} />
                تیره
              </span>
              {state.settings.theme === 'dark' ? <Icon name="check" size={16} /> : null}
            </button>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={state.settings.persianDigits}
              onChange={(event) => ledger.setPersianDigits(event.target.checked)}
            />
            <span className="switch__track" aria-hidden="true">
              <span className="switch__thumb" />
            </span>
            <span className="switch__copy">
              <span className="switch__label">نمایش ارقام فارسی</span>
              <span className="switch__hint">
                خاموش کردن این گزینه، اعداد را با ارقام لاتین نمایش می‌دهد.
              </span>
            </span>
          </label>

          <div className="settings-preview">
            <span className="settings-preview__label">پیش‌نمایش</span>
            <strong className="settings-preview__value num">{fmt.money(12_500_000)} تومان</strong>
            <span className="settings-preview__meta num">
              {fmt.date(todayKey, 'long')} · {fmt.weekday(todayKey)}
            </span>
          </div>
        </section>

        <section className="card settings-card">
          <header className="card__head">
            <div>
              <h2 className="card__title">
                <Icon name="database" size={18} /> داده‌ها
              </h2>
              <p className="card__sub">تغییرات به‌صورت خودکار در همین مرورگر ذخیره می‌شوند</p>
            </div>
          </header>

          <div className="data-list">
            <div className="data-row">
              <span className="data-row__icon">
                <Icon name="download" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">پشتیبان‌گیری JSON</p>
                <p className="data-row__desc">همه حساب‌ها، تراکنش‌ها، قواعد و تنظیمات</p>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={downloadBackup}>
                دریافت فایل
              </button>
            </div>

            <div className="data-row">
              <span className="data-row__icon">
                <Icon name="upload" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">بازگردانی از پشتیبان</p>
                <p className="data-row__desc">فایل JSON ساخته‌شده توسط NoxaPlus Ledger</p>
              </div>
              <button
                type="button"
                className="btn btn--soft btn--sm"
                onClick={() => restoreRef.current?.click()}
              >
                انتخاب فایل
              </button>
              <input
                ref={restoreRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void restoreFile(file);
                  event.target.value = '';
                }}
              />
            </div>

            <div className="data-row">
              <span className="data-row__icon">
                <Icon name="download" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">خروجی CSV</p>
                <p className="data-row__desc">مناسب اکسل و گوگل‌شیت، با سرستون‌های انگلیسی</p>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={downloadCsv}>
                دریافت فایل
              </button>
            </div>

            <div className="data-row">
              <span className="data-row__icon">
                <Icon name="upload" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">ورود از CSV</p>
                <p className="data-row__desc">افزودن گروهی تراکنش با پیش‌نمایش و اعتبارسنجی</p>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={openImport}>
                آغاز ورود
              </button>
            </div>

            <div className="data-row">
              <span className="data-row__icon">
                <Icon name="database" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">بارگذاری داده نمونه</p>
                <p className="data-row__desc">شش ماه تراکنش نمونه برای آشنایی با گزارش‌ها</p>
              </div>
              <button type="button" className="btn btn--soft btn--sm" onClick={loadSample}>
                بارگذاری
              </button>
            </div>

            <div className="data-row data-row--danger">
              <span className="data-row__icon">
                <Icon name="trash" size={18} />
              </span>
              <div className="data-row__copy">
                <p className="data-row__title">پاک کردن دفتر</p>
                <p className="data-row__desc">حذف همه داده‌ها و بازگشت به دفتر خالی</p>
              </div>
              <button type="button" className="btn btn--danger btn--sm" onClick={resetAll}>
                پاک کردن
              </button>
            </div>
          </div>
        </section>

        <section className="card settings-card settings-card--about">
          <div className="about">
            <Logo size={56} />
            <div className="about__copy">
              <h2 className="about__title">NoxaPlus Ledger</h2>
              <p className="about__version num">نسخه {fmt.digits(APP_VERSION)}</p>
              <p className="about__text">
                دفتر مالی شخصی و محلی با تقویم جلالی. این پروژه توسط{' '}
                <strong>NoxaPlus</strong> طراحی و توسعه داده شده و به‌صورت آزاد با مجوز MIT
                منتشر می‌شود.
              </p>
            </div>
          </div>
          <div className="about__links">
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="about__link">
              <Icon name="globe" size={16} />
              وب‌سایت رسمی
              <span className="about__link-url">noxaplus.ir</span>
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="about__link">
              <Icon name="github" size={16} />
              مخزن GitHub
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="about__link">
              <Icon name="mail" size={16} />
              {CONTACT_EMAIL}
            </a>
            <button type="button" className="about__link" onClick={openHelp}>
              <Icon name="help" size={16} />
              راهنما و میان‌برها
            </button>
            {canInstall ? (
              <button type="button" className="about__link" onClick={install}>
                <Icon name="install" size={16} />
                نصب روی دستگاه
              </button>
            ) : (
              <p className="about__install-note">
                برای نصب، از منوی مرورگر گزینه «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب
                کنید.
              </p>
            )}
          </div>
          <div className="about__foot">
            <span>ساخته‌شده با دقت برای فارسی‌زبانان</span>
            <span>MIT License</span>
          </div>
        </section>

        <section className="card settings-card">
          <header className="card__head">
            <div>
              <h2 className="card__title">
                <Icon name="shield" size={18} /> حریم خصوصی
              </h2>
              <p className="card__sub">مالکیت داده‌ها فقط با شماست</p>
            </div>
          </header>
          <ul className="privacy-list">
            <li>
              <Icon name="check" size={16} />
              هیچ داده‌ای آپلود یا به سروری ارسال نمی‌شود.
            </li>
            <li>
              <Icon name="check" size={16} />
              هیچ حساب کاربری، کلید API یا ثبت‌نامی لازم نیست.
            </li>
            <li>
              <Icon name="check" size={16} />
              هیچ ابزار تحلیلی، تبلیغات یا ردیابی در برنامه وجود ندارد.
            </li>
            <li>
              <Icon name="check" size={16} />
              برای انتقال بین دستگاه‌ها، از پشتیبان JSON استفاده کنید.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
