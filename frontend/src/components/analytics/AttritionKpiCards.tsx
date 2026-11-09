import React from 'react';
import { Users, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AttritionSummary } from '../../api/analytics';

interface AttritionKpiCardsProps {
  summary: AttritionSummary;
}

export const AttritionKpiCards: React.FC<AttritionKpiCardsProps> = ({ summary }) => {
  const isHighRiskAlert = summary.highRiskCount > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
      {/* 1. Nhóm Nguy Cơ Cao - THẺ NỔI BẬT CHỦ ĐẠO (Dominant Bento Card 5 cols) */}
      <div
        className={`lg:col-span-5 p-5 rounded-2xl border-2 flex flex-col justify-between transition-all shadow-hard ${
          isHighRiskAlert
            ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500'
            : 'bg-surface border-line'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isHighRiskAlert ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-muted'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 ${isHighRiskAlert ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-muted'}`} />
              <span>Nguy cơ nghỉ việc cao</span>
            </span>
            {isHighRiskAlert ? (
              <span className="text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold bg-rose-600 text-white dark:bg-rose-500/20 dark:text-rose-200 border border-rose-700 dark:border-rose-400 shadow-xs">
                {summary.highRiskPercentage}% tổng nhân sự
              </span>
            ) : (
              <span className="text-xs text-muted font-mono font-semibold bg-surface-2 px-2 py-0.5 rounded border border-line">
                0% · An toàn
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-2">
            <span
              className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${
                isHighRiskAlert ? 'text-rose-700 dark:text-rose-400' : 'text-fg'
              }`}
            >
              {summary.highRiskCount}
            </span>
            <span className="text-xs font-semibold text-fg/80 dark:text-muted">
              nhân sự cần hỗ trợ giữ chân kịp thời
            </span>
          </div>
        </div>
        <div
          className={`mt-4 flex items-center justify-between text-xs pt-3 border-t ${
            isHighRiskAlert
              ? 'text-rose-800 dark:text-rose-300/80 border-rose-300 dark:border-rose-800/60'
              : 'text-muted border-line/40'
          }`}
        >
          <span className="font-medium">Ngưỡng xác suất mô hình:</span>
          <span className={`font-mono font-bold ${isHighRiskAlert ? 'text-rose-700 dark:text-rose-300' : 'text-fg'}`}>
            ≥ 50%
          </span>
        </div>
      </div>

      {/* 2. Tổng nhân sự phân tích (3 cols) */}
      <div className="lg:col-span-3 bg-surface p-5 border-2 border-line rounded-2xl shadow-hard flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              Quy mô đánh giá
            </span>
            <div className="w-7 h-7 rounded-lg bg-surface-2 border border-line flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-fg tracking-tight">
              {summary.totalEmployees}
            </span>
            <span className="text-xs text-muted font-medium">nhân sự</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted pt-3 border-t border-line/40">
          <span className="font-medium">Điểm rủi ro TB:</span>
          <span className="font-mono font-bold text-fg">
            {summary.averageRiskScore}/100
          </span>
        </div>
      </div>

      {/* 3. Nhóm Nguy Cơ Trung Bình (2 cols) */}
      <div className="lg:col-span-2 bg-surface p-5 border-2 border-line rounded-2xl shadow-hard flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Trung bình
            </span>
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-fg tracking-tight">
              {summary.mediumRiskCount}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              {summary.mediumRiskPercentage}%
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted pt-3 border-t border-line/40">
          <span className="font-medium">Xác suất:</span>
          <span className="font-mono font-semibold text-fg">30% - 49%</span>
        </div>
      </div>

      {/* 4. Nhóm Ổn Định (2 cols) */}
      <div className="lg:col-span-2 bg-surface p-5 border-2 border-line rounded-2xl shadow-hard flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Ổn định
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-mono font-extrabold text-fg tracking-tight">
              {summary.lowRiskCount}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-lg font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              {summary.lowRiskPercentage}%
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted pt-3 border-t border-line/40">
          <span className="font-medium">Xác suất:</span>
          <span className="font-mono font-semibold text-fg">&lt; 30%</span>
        </div>
      </div>
    </div>
  );
};
