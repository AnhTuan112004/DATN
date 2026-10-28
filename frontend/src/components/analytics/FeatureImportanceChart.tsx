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
    <div className="app-surface p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">
            Mức độ ảnh hưởng của các yếu tố
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Các yếu tố tác động đến quyết định gắn bó hoặc rời đi của nhân sự.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-[var(--text-muted)]">Tăng nguy cơ thôi việc</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[var(--text-muted)]">Giúp giữ chân nhân sự</span>
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
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              domain={[-2.5, 2.5]}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickFormatter={(val) => val.toFixed(1)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              width={160}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as FeatureImportanceItem;
                  const isPositive = item.weight > 0;
                  return (
                    <div className="app-surface p-3 shadow-lg max-w-xs text-xs">
                      <p className="font-semibold text-sm mb-1">{item.label}</p>
                      <p className="text-[var(--text-muted)] mb-1">
                        Mức độ tác động:{' '}
                        <span className={`font-semibold ${isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {item.weight > 0 ? `+${item.weight}` : item.weight}
                        </span>
                      </p>
                      <div className="mt-2 pt-2 border-t border-[var(--border)] text-[11px]">
                        {isPositive ? (
                          <span className="text-rose-500">
                            Càng tăng yếu tố này, nguy cơ nhân sự thôi việc càng cao.
                          </span>
                        ) : (
                          <span className="text-emerald-500">
                            Yếu tố tích cực giúp tăng sự gắn bó của nhân sự với công ty.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="var(--border)" strokeWidth={1.5} />
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

      <div className="mt-3 flex items-start gap-2 bg-[var(--surface-muted)] p-3 rounded-[var(--radius)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
        <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[var(--text)]">Tóm tắt xu hướng:</strong> Thâm niên và thu nhập là hai yếu tố then chốt giúp giữ chân nhân sự; ngược lại, làm thêm giờ nhiều và khoảng cách đi làm xa là những nguyên nhân phổ biến dẫn đến nguy cơ rời bỏ công ty.
        </p>
      </div>
    </div>
  );
};
