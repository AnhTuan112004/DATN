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
    <div className={`flex items-center gap-1 overflow-x-auto border-b border-slate-800 scrollbar-thin ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              isActive
                ? 'border-teal-500 text-teal-300 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive
                    ? 'bg-teal-950 text-teal-300 border border-teal-800/80 font-bold'
                    : 'bg-slate-800 text-slate-400'
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
