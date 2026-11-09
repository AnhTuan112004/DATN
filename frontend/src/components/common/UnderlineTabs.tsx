import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface UnderlineTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
}

export function UnderlineTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: UnderlineTabsProps<T>) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto border-b-2 border-line pb-0.5 scrollbar-thin ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              isActive
                ? 'border-primary text-primary font-bold -mb-[2px]'
                : 'border-transparent text-muted hover:text-fg hover:bg-surface-2 rounded-t-lg'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isActive
                    ? 'bg-lime text-ink border-line font-bold'
                    : 'bg-surface-2 text-muted border-line/40'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
