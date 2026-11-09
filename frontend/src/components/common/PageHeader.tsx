import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  badge,
  title,
  subtitle,
  actions,
  icon,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
      <div className="space-y-1">
        {(eyebrow || badge) && (
          <div className="flex items-center gap-2 flex-wrap">
            {eyebrow && (
              <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">
                {eyebrow}
              </span>
            )}
            {badge}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          {icon}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </div>
  );
};
