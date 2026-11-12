import type { ConfirmOptions } from '../appTypes';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions | null;
  onClose: () => void;
}

export function ConfirmDialog({ open, options, onClose }: ConfirmDialogProps) {
  if (!options) return null;
  const danger = options.tone === 'danger';

  return (
    <Modal
      open={open}
      title={options.title}
      size="sm"
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className={danger ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => {
              options.onConfirm();
              onClose();
            }}
            data-autofocus
          >
            {options.confirmLabel ?? 'تأیید'}
          </button>
        </div>
      }
    >
      <div className="confirm">
        <span className={`confirm__icon ${danger ? 'confirm__icon--danger' : ''}`}>
          <Icon name={danger ? 'alert' : 'help'} size={24} />
        </span>
        <p className="confirm__text">{options.message}</p>
      </div>
    </Modal>
  );
}
