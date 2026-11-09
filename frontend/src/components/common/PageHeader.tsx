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
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-3 border-b-2 border-line">
      <div className="space-y-1.5">
        {(eyebrow || badge) && (
          <div className="flex items-center gap-2 flex-wrap">
            {eyebrow && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-line bg-surface-2 text-fg">
                {eyebrow}
              </span>
            )}
            {badge}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-fg tracking-tight flex items-center gap-2.5 font-display leading-tight">
          {icon}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
