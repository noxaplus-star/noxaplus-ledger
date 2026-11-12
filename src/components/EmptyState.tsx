import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon = 'sparkles', title, text, action, compact }: EmptyStateProps) {
  return (
    <div className={`empty ${compact ? 'empty--compact' : ''}`}>
      <span className="empty__icon">
        <Icon name={icon} size={compact ? 22 : 28} />
      </span>
      <div className="empty__copy">
        <p className="empty__title">{title}</p>
        {text ? <p className="empty__text">{text}</p> : null}
      </div>
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
