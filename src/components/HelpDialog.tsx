import { CONTACT_EMAIL, REPO_URL, SITE_URL } from '../constants';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  onInstall: () => void;
  canInstall: boolean;
}

const SHORTCUTS: Array<[string, string]> = [
  ['N', 'ثبت تراکنش جدید'],
  ['Ctrl + Z', 'بازگرداندن آخرین تغییر'],
  ['Ctrl + Shift + Z', 'اجرای دوباره تغییر'],
  ['?', 'باز کردن همین راهنما'],
  ['Esc', 'بستن پنجره‌ها'],
];

export function HelpDialog({ open, onClose, onInstall, canInstall }: HelpDialogProps) {
  return (
    <Modal
      open={open}
      title="راهنمای NoxaPlus Ledger"
      subtitle="دفتر مالی شخصی، کاملاً روی همین دستگاه."
      size="lg"
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            بستن
          </button>
          {canInstall ? (
            <button type="button" className="btn btn--primary" onClick={onInstall}>
              <Icon name="install" size={17} />
              نصب روی دستگاه
            </button>
          ) : null}
        </div>
      }
    >
      <div className="help">
        <section className="help__section">
          <h3 className="help__title">
            <Icon name="book" size={18} />
            شروع سریع
          </h3>
          <ol className="help__steps">
            <li>تراکنش‌های هزینه و درآمد را با تقویم جلالی ثبت کنید.</li>
            <li>
              برای دسته‌بندی خودکار، در بخش «مدیریت» قاعده بسازید؛ مثلاً کلیدواژه «تاکسی» با
              دسته «حمل‌ونقل».
            </li>
            <li>برای هر دسته هزینه، بودجه ماهانه تعیین کنید و پیشرفت را در داشبورد ببینید.</li>
            <li>از بخش تنظیمات، پشتیبان JSON بگیرید یا خروجی CSV بسازید.</li>
          </ol>
        </section>

        <section className="help__section">
          <h3 className="help__title">
            <Icon name="sliders" size={18} />
            میان‌برهای صفحه‌کلید
          </h3>
          <div className="shortcuts">
            {SHORTCUTS.map(([key, label]) => (
              <div key={key} className="shortcuts__row">
                <kbd>{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="help__section help__section--privacy">
          <h3 className="help__title">
            <Icon name="shield" size={18} />
            حریم خصوصی
          </h3>
          <p>
            همه داده‌ها فقط در حافظه محلی مرورگر شما ذخیره می‌شوند. هیچ اطلاعاتی آپلود نمی‌شود،
            هیچ حساب کاربری یا کلید API لازم نیست و هیچ ابزار ردیابی در برنامه وجود ندارد. برای
            جابه‌جایی بین دستگاه‌ها از پشتیبان JSON استفاده کنید.
          </p>
        </section>

        <section className="help__section">
          <h3 className="help__title">
            <Icon name="sparkles" size={18} />
            درباره سازنده
          </h3>
          <p>
            NoxaPlus Ledger توسط <strong>NoxaPlus</strong> طراحی و توسعه داده شده است و به صورت
            آزاد و متن‌باز با مجوز MIT منتشر می‌شود.
          </p>
          <div className="help__links">
            <a href={SITE_URL} target="_blank" rel="noreferrer">
              <Icon name="globe" size={15} /> وب‌سایت رسمی
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Icon name="github" size={15} /> مخزن GitHub
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Icon name="mail" size={15} /> {CONTACT_EMAIL}
            </a>
          </div>
        </section>
      </div>
    </Modal>
  );
}
