import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  moduleCode: string;
  weekSchedule: string;
  description: string;
  pillars: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  moduleCode,
  weekSchedule,
  description,
  pillars,
}) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Phân Hệ {moduleCode} • {weekSchedule}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{title}</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 mb-8 text-left max-w-lg mx-auto">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Đặc tả Kỹ thuật Hiến pháp v6.1 FINAL FREEZE:
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            {pillars.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
};
