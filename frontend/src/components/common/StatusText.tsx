import React from 'react';
import { CheckCircle2, Clock, XCircle, Ban, AlertCircle } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusTextProps {
  variant: StatusVariant;
  label: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { text: string; dot: string; icon: React.ReactNode }> = {
  success: {
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  },
  warning: {
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    icon: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  },
  danger: {
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />,
  },
  info: {
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    icon: <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
  },
  neutral: {
    text: 'text-slate-400',
    dot: 'bg-slate-500',
    icon: <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
  },
};

export const StatusText: React.FC<StatusTextProps> = ({
  variant,
  label,
  icon,
  showIcon = true,
  className = '',
}) => {
  const current = variantStyles[variant] || variantStyles.neutral;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${current.text} ${className}`}>
      {showIcon ? (icon || current.icon) : <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      <span>{label}</span>
    </span>
  );
};
