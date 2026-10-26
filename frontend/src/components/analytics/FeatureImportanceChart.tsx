import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Info } from 'lucide-react';
import { FeatureImportanceItem } from '../../api/analytics';

interface FeatureImportanceChartProps {
  data: FeatureImportanceItem[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ data }) => {
  // Chuẩn bị dữ liệu hiển thị sắp xếp theo độ ảnh hưởng tuyệt đối giảm dần
  const chartData = [...data].sort((a, b) => b.absWeight - a.absWeight);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Trọng Số Quyết Định Của 6 Đặc Trưng (Feature Importance)
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Mô hình Logistic Regression tối ưu hóa theo tiêu chuẩn Explainable AI (XAI)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Tăng nguy cơ (Dương)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">Giảm nguy cơ (Âm)</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b825" />
            <XAxis
              type="number"
              domain={[-2.5, 2.5]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => val.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12, fill: '#475569' }}
              width={160}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as FeatureImportanceItem;
                  const isPositive = item.weight > 0;
                  return (
                    <div className="bg-slate-900/95 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700 backdrop-blur-sm max-w-xs">
                      <p className="font-semibold text-sm mb-1">{item.label}</p>
                      <p className="text-slate-300 mb-1">
                        Tên biến: <code className="text-sky-300">{item.feature}</code>
                      </p>
                      <p className="text-slate-300 mb-1">
                        Hệ số hồi quy ($\beta$):{' '}
                        <span className={`font-bold ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.weight > 0 ? `+${item.weight}` : item.weight}
                        </span>
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        {isPositive ? (
                          <span className="text-rose-300">
                            ▲ Tác động: Càng tăng chỉ số này, xác suất thôi việc càng cao.
                          </span>
                        ) : (
                          <span className="text-emerald-300">
                            ▼ Tác động: Càng tăng chỉ số này, nhân sự càng gắn bó lâu dài.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />
            <Bar dataKey="weight" radius={[4, 4, 4, 4]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.weight > 0 ? '#f43f5e' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <p>
          <strong>Diễn giải mô hình:</strong> Tổng thâm niên nghề nghiệp ($\beta = -1.97$) và Mức thu nhập ($\beta = -1.32$) là 2 mỏ neo giữ chân lớn nhất; trong khi Làm thêm giờ thường xuyên ($\beta = +1.46$) là nguyên nhân hàng đầu gây kiệt sức và nghỉ việc.
        </p>
      </div>
    </div>
  );
};
