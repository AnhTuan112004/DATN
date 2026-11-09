import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'lime' | 'primary';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  icon,
  disabled,
  variant = 'lime',
  className = '',
  ...props
}) => {
  const variantStyles =
    variant === 'lime'
      ? 'bg-lime text-ink hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1'
      : 'bg-primary text-on-primary hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1';

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border-2 border-line shadow-hard transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles} ${className}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
};
