/**
 * Department Identity Colors
 * Colors strictly chosen from non-status palettes (sky, cyan, violet, stone, zinc)
 * to avoid colliding with status semantics (emerald = approved, amber = pending, rose = rejected/high-risk).
 */

export interface DepartmentColorTheme {
  name: string;
  dot: string;
  text: string;
  badge: string;
  border: string;
  borderLeft: string;
}

const DEPARTMENT_THEMES: Record<string, DepartmentColorTheme> = {
  // Ban Giám Đốc
  BGD: {
    name: 'Ban Giám Đốc',
    dot: 'bg-sky-400',
    text: 'text-sky-300',
    badge: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    border: 'border-sky-800/60',
    borderLeft: 'border-l-sky-500',
  },
  // Kỹ thuật / Công nghệ / Phần mềm
  DEV: {
    name: 'Phát Triển Phần Mềm',
    dot: 'bg-cyan-400',
    text: 'text-cyan-300',
    badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60',
    border: 'border-cyan-800/60',
    borderLeft: 'border-l-cyan-500',
  },
  // Marketing & Truyền thông
  MKT: {
    name: 'Marketing & Thương Hiệu',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    badge: 'bg-violet-950/60 text-violet-300 border-violet-800/60',
    border: 'border-violet-800/60',
    borderLeft: 'border-l-violet-500',
  },
  // Tài chính & Kế toán
  ACC: {
    name: 'Kế Toán Tổng Hợp',
    dot: 'bg-stone-400',
    text: 'text-stone-300',
    badge: 'bg-stone-900 text-stone-300 border-stone-700',
    border: 'border-stone-700',
    borderLeft: 'border-l-stone-500',
  },
  // Mặc định
  DEFAULT: {
    name: 'Khối Chức Năng',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
    badge: 'bg-slate-900 text-slate-300 border-slate-700',
    border: 'border-slate-800',
    borderLeft: 'border-l-slate-500',
  },
};

export function getDepartmentTheme(codeOrName?: string | null): DepartmentColorTheme {
  if (!codeOrName) return DEPARTMENT_THEMES.DEFAULT;
  const upper = codeOrName.toUpperCase();

  if (upper.includes('BGD') || upper.includes('GIÁM ĐỐC') || upper.includes('CEO') || upper.includes('LÃNH ĐẠO')) {
    return DEPARTMENT_THEMES.BGD;
  }
  if (upper.includes('DEV') || upper.includes('PHẦN MỀM') || upper.includes('IT') || upper.includes('KỸ THUẬT') || upper.includes('SOFTWARE')) {
    return DEPARTMENT_THEMES.DEV;
  }
  if (upper.includes('MKT') || upper.includes('MARKETING') || upper.includes('THƯƠNG HIỆU') || upper.includes('TRUYỀN THÔNG')) {
    return DEPARTMENT_THEMES.MKT;
  }
  if (upper.includes('ACC') || upper.includes('KẾ TOÁN') || upper.includes('TÀI CHÍNH') || upper.includes('FINANCE')) {
    return DEPARTMENT_THEMES.ACC;
  }
  return DEPARTMENT_THEMES.DEFAULT;
}
