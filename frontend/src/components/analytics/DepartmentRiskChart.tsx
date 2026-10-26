import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DepartmentBreakdown } from '../../api/analytics';

interface DepartmentRiskChartProps {
  data: DepartmentBreakdown[];
}

export const DepartmentRiskChart: React.FC<DepartmentRiskChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Phân Bổ Mức Rủi Ro Theo Phòng Ban
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Số lượng nhân sự theo từng phân khúc nguy cơ (Nguy cơ cao, Trung bình, Ổn định)
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-700 dark:text-slate-300">
            Chưa có dữ liệu phòng ban
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b825" />
              <XAxis
                dataKey="departmentName"
                tick={{ fontSize: 12, fill: '#64748b' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dept = data.find((d) => d.departmentName === label);
                    return (
                      <div className="bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 backdrop-blur-sm">
                        <p className="font-bold text-sm mb-2 text-sky-300">{label}</p>
                        <div className="space-y-1">
                          <p className="flex justify-between gap-4">
                            <span className="text-red-400">Nguy cơ cao:</span>
                            <span className="font-bold">{dept?.highRiskCount || 0} người</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-amber-400">Nguy cơ TB:</span>
                            <span className="font-bold">{dept?.mediumRiskCount || 0} người</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-emerald-400">Ổn định:</span>
                            <span className="font-bold">{dept?.lowRiskCount || 0} người</span>
                          </p>
                          <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between gap-4 text-slate-300">
                            <span>Điểm rủi ro TB:</span>
                            <span className="font-bold text-white">{dept?.averageRiskScore || 0} / 100</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />
              <Bar dataKey="highRiskCount" name="Nguy cơ cao" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="mediumRiskCount" name="Trung bình" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="lowRiskCount" name="Ổn định" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
