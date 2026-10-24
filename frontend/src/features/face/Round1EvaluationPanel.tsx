import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Download,
  Sliders,
  CheckCircle2,
  XCircle,
  Eye,
  Video,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';

interface ThresholdData {
  threshold: number;
  far: number;
  frr: number;
  evalText: string;
  isOptimal: boolean;
}

const THRESHOLD_DATA: ThresholdData[] = [
  { threshold: 0.35, far: 0.0, frr: 68.57, evalText: 'Quá khắt khe, từ chối nhiều người thật', isOptimal: false },
  { threshold: 0.40, far: 0.0, frr: 57.14, evalText: 'Chưa phù hợp thực tế', isOptimal: false },
  { threshold: 0.45, far: 0.0, frr: 45.71, evalText: 'Tỷ lệ từ chối người thật còn cao', isOptimal: false },
  { threshold: 0.50, far: 0.0, frr: 11.43, evalText: 'Tiếp cận vùng an toàn', isOptimal: false },
  { threshold: 0.55, far: 0.0, frr: 0.0, evalText: 'Vùng vận hành an toàn', isOptimal: false },
  { threshold: 0.60, far: 0.0, frr: 0.0, evalText: 'TỐI ƯU KHUYẾN NGHỊ (Zero Error Rate & Biên an toàn cao nhất)', isOptimal: true },
  { threshold: 0.65, far: 0.0, frr: 0.0, evalText: 'Vùng an toàn (dự phòng ánh sáng kém)', isOptimal: false },
  { threshold: 0.70, far: 0.0, frr: 0.0, evalText: 'Tiệm cận ngưỡng Impostor', isOptimal: false },
  { threshold: 0.75, far: 0.0, frr: 0.0, evalText: 'Sát ngưỡng Impostor (0.751)', isOptimal: false },
];

export const Round1EvaluationPanel: React.FC = () => {
  const [sliderThreshold, setSliderThreshold] = useState<number>(0.6);

  // Tìm thông số theo ngưỡng slider
  const currentMetric =
    THRESHOLD_DATA.reduce((prev, curr) =>
      Math.abs(curr.threshold - sliderThreshold) < Math.abs(prev.threshold - sliderThreshold) ? curr : prev
    );

  const handleDownloadCsv = () => {
    window.open('/experiments/faceid/trials.csv', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* KPI 1: APCER */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>APCER (Giả mạo lọt)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">0.00%</div>
          <p className="text-[11px] text-slate-500 mt-1">Chặn 80/80 lượt tấn công 2D</p>
        </div>

        {/* KPI 2: BPCER */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>BPCER (Từ chối nhầm)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">2.78%</div>
          <p className="text-[11px] text-slate-500 mt-1">1/36 lượt cúi sâu thiếu sáng</p>
        </div>

        {/* KPI 3: FAR @ 0.60 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>FAR (Nhận nhầm mặt)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">0.00%</div>
          <p className="text-[11px] text-slate-500 mt-1">0/30 lượt Impostor lọt qua</p>
        </div>

        {/* KPI 4: FRR @ 0.60 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
            <span>FRR (Từ chối người thật)</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">0.00%</div>
          <p className="text-[11px] text-slate-500 mt-1">0/35 lượt Genuine bị từ chối</p>
        </div>
      </div>

      {/* Separation Margin & Distance Distribution */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Khoảng Cách Phân Tách An Toàn (Separation Margin)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chứng minh không có sự chồng lấn giữa tập Genuine và Impostor trong không gian vector 128 chiều
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Δ = 0.223 &gt; 0 (Zero Overlap)
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>0.00 (Trùng khớp tuyệt đối)</span>
            <span className="text-cyan-400 font-bold">Max Genuine: 0.528</span>
            <span className="text-emerald-400 font-bold font-mono">Ngưỡng: 0.60</span>
            <span className="text-rose-400 font-bold">Min Impostor: 0.751</span>
            <span>1.20 (Hoàn toàn khác biệt)</span>
          </div>

          <div className="h-6 w-full bg-slate-950 rounded-xl relative overflow-hidden flex items-center p-1 border border-slate-800">
            {/* Genuine Zone */}
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-lg opacity-80"
              style={{ width: `${(0.528 / 1.2) * 100}%` }}
              title="Vùng Genuine (0.280 - 0.528)"
            />
            {/* Safe Margin Zone */}
            <div
              className="h-full bg-emerald-500/20 border-x-2 border-dashed border-emerald-400/60"
              style={{ width: `${((0.751 - 0.528) / 1.2) * 100}%` }}
              title="Khoảng cách an toàn Δ = 0.223"
            />
            {/* Impostor Zone */}
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-700 rounded-lg opacity-80"
              style={{ width: `${((1.2 - 0.751) / 1.2) * 100}%` }}
              title="Vùng Impostor (0.751 - 1.120)"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              Tập Người Thật (0.280 - 0.528)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-400" />
              Biên An Toàn Không Chồng Lấn (0.528 - 0.751)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              Tập Người Khác (0.751 - 1.120)
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Simulator Slider */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Mô Phỏng Quét Ngưỡng (Threshold Simulator)</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800">
            θ = {sliderThreshold.toFixed(2)}
          </span>
        </div>

        <input
          type="range"
          min="0.35"
          max="0.75"
          step="0.05"
          value={sliderThreshold}
          onChange={(e) => setSliderThreshold(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="text-slate-400 text-xs">Tỷ lệ FAR:</span>
            <div className={`text-base font-bold ${currentMetric.far === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentMetric.far.toFixed(2)}%
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Tỷ lệ FRR:</span>
            <div className={`text-base font-bold ${currentMetric.frr === 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {currentMetric.frr.toFixed(2)}%
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs">Đánh giá vận hành:</span>
            <div className={`text-xs font-semibold mt-0.5 ${currentMetric.isOptimal ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
              {currentMetric.evalText}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Chi Tiết Thực Nghiệm & Tấn Công */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phân nhóm điều kiện ánh sáng */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Điều Kiện Ánh Sáng (Bona Fide)
          </h4>
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-2">Môi trường</th>
                <th className="pb-2">Cường độ lux</th>
                <th className="pb-2">Khoảng cách trung bình</th>
                <th className="pb-2">Độ trễ trung bình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2 font-medium text-emerald-300">Văn phòng chuẩn</td>
                <td className="py-2 font-mono">350 - 485 lux</td>
                <td className="py-2 font-mono">0.372 ± 0.045</td>
                <td className="py-2 font-mono text-cyan-400">39.8 ms</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-amber-300">Ánh sáng yếu / đêm</td>
                <td className="py-2 font-mono">62 - 92 lux</td>
                <td className="py-2 font-mono">0.485 ± 0.052</td>
                <td className="py-2 font-mono text-cyan-400">46.5 ms</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Phân nhóm tấn công giả mạo */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Tấn Công Giả Mạo 2D (Presentation Attack)
          </h4>
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-2">Phương thức tấn công</th>
                <th className="pb-2">Số lượt</th>
                <th className="pb-2">Kết quả Tầng 1</th>
                <th className="pb-2">Tỷ lệ chặn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-2 font-medium flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-slate-400" /> Ảnh in màu A4 (Glossy/Matte)
                </td>
                <td className="py-2 font-mono">50 lượt</td>
                <td className="py-2 text-rose-400 font-semibold">Bị từ chối</td>
                <td className="py-2 font-bold text-emerald-400">100.0%</td>
              </tr>
              <tr>
                <td className="py-2 font-medium flex items-center gap-1.5">
                  <Video className="w-3 h-3 text-slate-400" /> Video Replay (iPad/Laptop)
                </td>
                <td className="py-2 font-mono">30 lượt</td>
                <td className="py-2 text-rose-400 font-semibold">Bị từ chối</td>
                <td className="py-2 font-bold text-emerald-400">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Callout Footer */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs text-slate-300 leading-relaxed">
            Dữ liệu thực nghiệm 146 lượt đo được ghi nhận chuẩn khoa học tại{' '}
            <code className="text-indigo-300 font-mono">experiments/faceid/trials.csv</code>.
          </span>
        </div>
        <button
          onClick={handleDownloadCsv}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Tải trials.csv (146 lượt)
        </button>
      </div>
    </div>
  );
};
