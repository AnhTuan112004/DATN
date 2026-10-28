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
    <div className="app-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">
            Phân bổ mức rủi ro theo phòng ban
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Số lượng nhân sự theo từng nhóm nguy cơ trong mỗi phòng ban.
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu phòng ban
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="departmentName"
                tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dept = data.find((d) => d.departmentName === label);
                    return (
                      <div className="app-surface p-3 shadow-lg text-xs min-w-44">
                        <p className="font-semibold text-sm mb-2 text-[var(--text)]">{label}</p>
                        <div className="space-y-1">
                          <p className="flex justify-between gap-4">
                            <span className="text-rose-500">Nguy cơ cao:</span>
                            <span className="font-semibold">{dept?.highRiskCount || 0} người</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-amber-500">Nguy cơ trung bình:</span>
                            <span className="font-semibold">{dept?.mediumRiskCount || 0} người</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-emerald-500">Ổn định:</span>
                            <span className="font-semibold">{dept?.lowRiskCount || 0} người</span>
                          </p>
                          <div className="pt-2 mt-2 border-t border-[var(--border)] flex justify-between gap-4 text-[var(--text-muted)]">
                            <span>Điểm rủi ro TB:</span>
                            <span className="font-semibold text-[var(--text)]">{dept?.averageRiskScore || 0}/100</span>
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
