import { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className }: LogoProps) {
  const gradientId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-label="NoxaPlus Ledger"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#20304f" />
          <stop offset="1" stopColor="#111a2c" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${gradientId})`} />
      <circle cx="424" cy="88" r="140" fill="#e4572e" opacity="0.16" />
      <rect x="118" y="100" width="276" height="312" rx="30" fill="#fff8ea" />
      <rect x="118" y="100" width="48" height="312" rx="24" fill="#e4572e" />
      <rect x="196" y="152" width="156" height="18" rx="9" fill="#17233d" opacity="0.22" />
      <rect x="196" y="200" width="112" height="14" rx="7" fill="#17233d" opacity="0.15" />
      <rect x="196" y="238" width="142" height="14" rx="7" fill="#17233d" opacity="0.15" />
      <rect x="196" y="276" width="96" height="14" rx="7" fill="#17233d" opacity="0.15" />
      <circle cx="352" cy="356" r="70" fill="#2a9d8f" />
      <rect x="320" y="342" width="64" height="10" rx="5" fill="#f6f1e7" />
      <rect x="320" y="362" width="40" height="10" rx="5" fill="#f6f1e7" opacity="0.82" />
    </svg>
  );
}

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={className}>
      <strong>NoxaPlus</strong> Ledger
    </span>
  );
}
