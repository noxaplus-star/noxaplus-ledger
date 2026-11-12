import { useCallback, useEffect, useRef, useState } from 'react';
import { createId } from '../core/ids';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers) window.clearTimeout(timer);
      activeTimers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info', action?: ToastAction) => {
      const id = createId('toast');
      setToasts((current) => [...current.slice(-2), { id, tone, message, action }]);
      const timer = window.setTimeout(
        () => {
          timers.current.delete(timer);
          dismiss(id);
        },
        tone === 'error' ? 6500 : 4800,
      );
      timers.current.add(timer);
      return id;
    },
    [dismiss],
  );

  return { toasts, notify, dismiss };
}
