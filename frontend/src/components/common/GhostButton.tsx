import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GhostButton: React.FC<GhostButtonProps> = ({
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
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-800/90 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span>{children}</span>
    </button>
  );
};

