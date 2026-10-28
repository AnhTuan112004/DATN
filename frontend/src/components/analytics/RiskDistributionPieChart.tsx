import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AttritionSummary } from '../../api/analytics';

interface RiskDistributionPieChartProps {
  summary: AttritionSummary;
}

export const RiskDistributionPieChart: React.FC<RiskDistributionPieChartProps> = ({ summary }) => {
  const pieData = [
    {
      name: 'Nguy cơ cao (P ≥ 50%)',
      value: summary.highRiskCount,
      percentage: summary.highRiskPercentage,
      color: '#ef4444',
    },
    {
      name: 'Trung bình (30% - 49%)',
      value: summary.mediumRiskCount,
      percentage: summary.mediumRiskPercentage,
      color: '#f59e0b',
    },
    {
      name: 'Ổn định (P < 30%)',
      value: summary.lowRiskCount,
      percentage: summary.lowRiskPercentage,
      color: '#10b981',
    },
  ];

  return (
    <div className="app-surface p-5 flex flex-col">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-[var(--text)]">
          Tỷ lệ rủi ro toàn doanh nghiệp
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Phân bổ nhân sự theo các nhóm mức độ nguy cơ thôi việc.
        </p>
      </div>

      <div className="h-64 w-full relative" style={{ minHeight: 250 }}>
        {summary.totalEmployees === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
            Không có dữ liệu
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="app-surface p-2.5 shadow-lg text-xs">
                          <p className="font-medium text-[var(--text)]">{item.name}</p>
                          <p className="mt-1 font-semibold text-sm text-[var(--text)]">
                            {item.value} nhân sự ({item.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner text for donut - canh chính xác tâm đường tròn cy=45% */}
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl font-semibold text-[var(--text)] tabular-nums leading-none">
                {summary.highRiskPercentage}%
              </span>
              <span className={`text-[10px] font-medium mt-1 ${summary.highRiskCount > 0 ? 'text-[var(--danger-text)]' : 'text-[var(--success-text)]'}`}>
                {summary.highRiskCount > 0 ? 'Nguy cơ cao' : 'Mức an toàn'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
