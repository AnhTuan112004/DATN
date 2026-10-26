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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Tỷ Lệ Rủi Ro Toàn Doanh Nghiệp
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
          Tổng quan phân đoạn nhân sự theo ngưỡng xác suất Sigmoid
        </p>
      </div>

      <div className="h-64 w-full relative flex-1 flex items-center justify-center">
        {summary.totalEmployees === 0 ? (
          <div className="text-sm text-slate-700 dark:text-slate-300">Không có dữ liệu</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
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
                        <div className="bg-slate-900/95 text-white text-xs rounded-lg p-2.5 shadow-xl border border-slate-700">
                          <p className="font-semibold text-slate-200">{item.name}</p>
                          <p className="mt-1 font-bold text-sm text-white">
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
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner text for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {summary.highRiskPercentage}%
              </span>
              <span className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400">
                Báo động
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
