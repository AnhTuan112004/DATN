import React from 'react';
import { Users, AlertTriangle, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { AttritionSummary } from '../../api/analytics';

interface AttritionKpiCardsProps {
  summary: AttritionSummary;
}

export const AttritionKpiCards: React.FC<AttritionKpiCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng nhân sự phân tích */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Quy Mô Đánh Giá
          </span>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {summary.totalEmployees}
          </span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">nhân sự hoạt động</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <span>Điểm rủi ro TB:</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {summary.averageRiskScore} / 100
          </span>
        </div>
      </div>

      {/* 2. Nhóm Nguy Cơ Cao (High Risk >= 50%) */}
      <div className="bg-white dark:bg-slate-900 border border-red-200/80 dark:border-red-900/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">
            Nguy Cơ Cao (Báo động)
          </span>
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">
            {summary.highRiskCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
            {summary.highRiskPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-red-100 dark:border-red-900/40">
          <span className="text-red-600/90 dark:text-red-400/90 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Xác suất P &ge; 50%
          </span>
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Cần can thiệp gấp</span>
        </div>
      </div>

      {/* 3. Nhóm Nguy Cơ Trung Bình (Medium Risk 30-49%) */}
      <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Nguy Cơ Trung Bình
          </span>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
            {summary.mediumRiskCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
            {summary.mediumRiskPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-amber-100 dark:border-amber-900/40">
          <span className="text-amber-700 dark:text-amber-400/90 font-medium">
            Khoảng 30% &le; P &lt; 50%
          </span>
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Theo dõi định kỳ</span>
        </div>
      </div>

      {/* 4. Nhóm Ổn Định / An Toàn (Low Risk < 30%) */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Mức Độ Ổn Định Cao
          </span>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {summary.lowRiskCount}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            {summary.lowRiskPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-emerald-100 dark:border-emerald-900/40">
          <span className="text-emerald-700 dark:text-emerald-400/90 font-medium">
            Xác suất P &lt; 30%
          </span>
          <span className="text-[11px] text-slate-700 dark:text-slate-300">Gắn kết bền vững</span>
        </div>
      </div>
    </div>
  );
};
