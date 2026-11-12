import type { Account, Category, Transaction } from '../core/types';
import type { Formatter } from '../format';
import { Icon } from './Icon';

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  account: Account | undefined;
  fmt: Formatter;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showDate?: boolean;
}

export function TransactionRow({
  transaction,
  category,
  account,
  fmt,
  onEdit,
  onDelete,
  showDate = true,
}: TransactionRowProps) {
  const title =
    transaction.note || category?.name || (transaction.type === 'expense' ? 'هزینه' : 'درآمد');
  return (
    <div className="tx-row">
      <span
        className="tx-row__dot"
        style={{ background: category?.color ?? '#94a3b8' }}
        aria-hidden="true"
      />
      <div className="tx-row__main">
        <p className="tx-row__title">{title}</p>
        <p className="tx-row__meta">
          <span>{category?.name ?? 'بدون دسته'}</span>
          <span className="tx-row__sep" aria-hidden="true">
            ·
          </span>
          <span>{account?.name ?? 'حساب نامشخص'}</span>
        </p>
      </div>
      <div className="tx-row__amount">
        <span className={`tx-row__value tx-row__value--${transaction.type} num`}>
          {fmt.signedMoney(transaction.amount, transaction.type)}
        </span>
        {showDate ? (
          <span className="tx-row__date num">{fmt.date(transaction.date, 'long')}</span>
        ) : null}
      </div>
      <div className="tx-row__actions">
        <button
          type="button"
          className="icon-btn icon-btn--soft"
          onClick={() => onEdit(transaction)}
          aria-label={`ویرایش ${title}`}
          title="ویرایش"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--soft icon-btn--danger"
          onClick={() => onDelete(transaction)}
          aria-label={`حذف ${title}`}
          title="حذف"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}
