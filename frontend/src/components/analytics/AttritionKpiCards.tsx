import React from 'react';
import { Users, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AttritionSummary } from '../../api/analytics';

interface AttritionKpiCardsProps {
  summary: AttritionSummary;
}

export const AttritionKpiCards: React.FC<AttritionKpiCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng nhân sự phân tích */}
      <div className="app-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Quy mô đánh giá
          </span>
          <Users className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-[var(--text)] tabular-nums">
            {summary.totalEmployees}
          </span>
          <span className="text-xs text-[var(--text-muted)]">nhân sự</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
          <span>Điểm rủi ro trung bình:</span>
          <span className="font-medium text-[var(--text)] tabular-nums">
            {summary.averageRiskScore}/100
          </span>
        </div>
      </div>

      {/* 2. Nhóm Nguy Cơ Cao */}
      <div className="app-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Nguy cơ cao
          </span>
          <AlertTriangle className={`w-4 h-4 ${summary.highRiskCount > 0 ? 'text-[var(--danger-text)]' : 'text-[var(--text-muted)]'}`} strokeWidth={1.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold tabular-nums ${summary.highRiskCount > 0 ? 'text-[var(--danger-text)]' : 'text-[var(--text)]'}`}>
            {summary.highRiskCount}
          </span>
          {summary.highRiskCount > 0 ? (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] font-medium">
              {summary.highRiskPercentage}%
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">
              0% · Mức an toàn
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
          <span>Ngưỡng xác suất:</span>
          <span className="font-medium text-[var(--text)]">Từ 50% trở lên</span>
        </div>
      </div>

      {/* 3. Nhóm Nguy Cơ Trung Bình */}
      <div className="app-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Nguy cơ trung bình
          </span>
          <AlertCircle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-[var(--text)] tabular-nums">
            {summary.mediumRiskCount}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--warning-bg)] text-[var(--warning-text)] font-medium">
            {summary.mediumRiskPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
          <span>Ngưỡng xác suất:</span>
          <span className="font-medium text-[var(--text)]">Từ 30% đến 49%</span>
        </div>
      </div>

      {/* 4. Nhóm Ổn Định */}
      <div className="app-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            Ổn định
          </span>
          <CheckCircle2 className="w-4 h-4 text-[var(--success-text)]" strokeWidth={1.5} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-[var(--text)] tabular-nums">
            {summary.lowRiskCount}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--success-bg)] text-[var(--success-text)] font-medium">
            {summary.lowRiskPercentage}%
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
          <span>Ngưỡng xác suất:</span>
          <span className="font-medium text-[var(--text)]">Dưới 30%</span>
        </div>
      </div>
    </div>
  );
};
