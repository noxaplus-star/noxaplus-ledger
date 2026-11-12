interface ProgressBarProps {
  ratio: number;
  tone?: 'default' | 'warn' | 'danger' | 'mint';
  label?: string;
}

export function ProgressBar({ ratio, tone = 'default', label }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(ratio, 1)) * 100;
  return (
    <div
      className={`progress progress--${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
    >
      <span className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
