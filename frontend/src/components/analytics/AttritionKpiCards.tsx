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
        className={`lg:col-span-5 p-5 rounded-xl border flex flex-col justify-between transition-all ${
          isHighRiskAlert
            ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/30'
            : 'app-surface border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isHighRiskAlert ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${isHighRiskAlert ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Nguy cơ nghỉ việc cao</span>
            </span>
            {isHighRiskAlert ? (
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {summary.highRiskPercentage}% tổng nhân sự
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-mono">0% · An toàn</span>
            )}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span
              className={`text-4xl font-mono font-bold tracking-tight ${
                isHighRiskAlert ? 'text-rose-300' : 'text-white'
              }`}
            >
              {summary.highRiskCount}
            </span>
            <span className="text-xs text-slate-300">nhân sự cần hỗ trợ giữ chân kịp thời</span>
          </div>
        </div>
        <div
          className={`mt-4 flex items-center justify-between text-xs pt-3 border-t ${
            isHighRiskAlert
              ? 'text-rose-300/80 border-rose-800/40'
              : 'text-slate-400 border-slate-800/80'
          }`}
        >
          <span>Ngưỡng xác suất mô hình:</span>
          <span className="font-mono font-semibold text-rose-200">≥ 50%</span>
        </div>
      </div>

      {/* 2. Tổng nhân sự phân tích (3 cols) */}
      <div className="lg:col-span-3 app-surface p-5 border border-slate-800 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Quy mô đánh giá
            </span>
            <Users className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {summary.totalEmployees}
            </span>
            <span className="text-xs text-slate-400">nhân sự</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <span>Điểm rủi ro TB:</span>
          <span className="font-mono font-semibold text-slate-200">
            {summary.averageRiskScore}/100
          </span>
        </div>
      </div>

      {/* 3. Nhóm Nguy Cơ Trung Bình (2 cols) */}
      <div className="lg:col-span-2 app-surface p-5 border border-slate-800 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400/90 uppercase tracking-wider">
              Trung bình
            </span>
            <AlertCircle className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {summary.mediumRiskCount}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
              {summary.mediumRiskPercentage}%
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <span>Xác suất:</span>
          <span className="font-mono font-medium text-slate-300">30% - 49%</span>
        </div>
      </div>

      {/* 4. Nhóm Ổn Định (2 cols) */}
      <div className="lg:col-span-2 app-surface p-5 border border-slate-800 rounded-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400/90 uppercase tracking-wider">
              Ổn định
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-white tracking-tight">
              {summary.lowRiskCount}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {summary.lowRiskPercentage}%
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
          <span>Xác suất:</span>
          <span className="font-mono font-medium text-slate-300">&lt; 30%</span>
        </div>
      </div>
    </div>
  );
};
