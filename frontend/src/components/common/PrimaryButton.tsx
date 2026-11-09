import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading = false,
  icon,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
};

