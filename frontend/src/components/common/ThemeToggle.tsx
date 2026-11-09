import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [t, setT] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme || 'light';
    }
    return 'light';
  });

  const flip = () => {
    const n = t === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try {
      localStorage.setItem('theme', n);
    } catch {}
    setT(n);
  };

  return (
    <button
      onClick={flip}
      type="button"
      aria-label={t === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={t === 'dark' ? 'Giao diện Giấy & Mực' : 'Giao diện Tối'}
      className="h-9 w-9 grid place-items-center rounded-xl border-2 border-line bg-surface text-fg shadow-hard-sm hover:bg-surface-2 transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
    >
      {t === 'dark' ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
    </button>
  );
};

