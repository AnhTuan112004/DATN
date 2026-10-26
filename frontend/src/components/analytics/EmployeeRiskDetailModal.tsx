import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  DollarSign,
  Building,
  Navigation,
  ShieldCheck,
  BrainCircuit,
  Lightbulb,
} from 'lucide-react';
import { AnalyzedEmployee, getEmployeeAttritionDetail, EmployeeRiskDetailData } from '../../api/analytics';

interface EmployeeRiskDetailModalProps {
  employee: AnalyzedEmployee | null;
  onClose: () => void;
}

export const EmployeeRiskDetailModal: React.FC<EmployeeRiskDetailModalProps> = ({
  employee,
  onClose,
}) => {
  const [detailData, setDetailData] = useState<EmployeeRiskDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employee) {
      setDetailData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getEmployeeAttritionDetail(employee.userId)
      .then((data) => {
        if (isMounted) setDetailData(data);
      })
      .catch((err) => {
        console.error('Lỗi khi tải chi tiết nhân sự XAI:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [employee]);

  if (!employee) return null;

  const pred = employee.prediction;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hồ Sơ Phân Tích Nguy Cơ Thôi Việc (Explainable AI)
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {employee.fullName} • {employee.employeeCode} • {employee.department.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. Thẻ Điểm Rủi Ro Chính */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              pred.riskLevel === 'HIGH'
                ? 'bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                : pred.riskLevel === 'MEDIUM'
                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                : 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                  pred.riskLevel === 'HIGH'
                    ? 'bg-red-500 text-white'
                    : pred.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {pred.riskScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Chỉ số rủi ro thôi việc
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      pred.riskLevel === 'HIGH'
                        ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : pred.riskLevel === 'MEDIUM'
                        ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                        : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    {pred.riskLabel}
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Xác suất mô hình: {(pred.probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {pred.riskLevel === 'HIGH' && 'Xác suất $P \ge 50\%$: Nguy cơ rời bỏ tổ chức trong 3–6 tháng tới rất cao.'}
                  {pred.riskLevel === 'MEDIUM' && 'Xác suất $30\% \le P < 50\%$: Cần theo dõi sự hài lòng và mức độ gắn kết định kỳ.'}
                  {pred.riskLevel === 'LOW' && 'Xác suất $P < 30\%$: Nhân sự đang có mức độ ổn định và hài lòng cao.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {pred.riskLevel === 'HIGH' ? (
                <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 shadow-sm">
                  <AlertTriangle className="w-4 h-4" /> Báo động Đỏ
                </div>
              ) : pred.riskLevel === 'MEDIUM' ? (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60 shadow-sm">
                  <AlertCircle className="w-4 h-4" /> Cần Chú Ý
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Gắn Kết Cao
                </div>
              )}
            </div>
          </div>

          {/* 2. Lưới 6 Đặc Trưng Đầu Vào Định Lượng (IBM Dataset Features) */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-500" />
              6 Đặc Trưng Định Lượng Đầu Vào (Chuẩn Điều 8 BLLĐ)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Feature 1: OverTime */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Giờ Làm Thêm (OT 30d)
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {employee.features.otHoursMonth}h
                  <span
                    className={`ml-1 text-xs font-bold ${
                      employee.features.overTime === 1
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    ({employee.features.overTime === 1 ? '≥4h/tháng' : 'Bình thường'})
                  </span>
                </div>
              </div>

              {/* Feature 2: Thâm niên công ty */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Thâm Niên Tại Cty
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {employee.features.yearsAtCompany} năm
                </div>
              </div>

              {/* Feature 3: Tổng thâm niên nghề */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Tổng Kinh Nghiệm
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {employee.features.totalWorkingYears} năm
                </div>
              </div>

              {/* Feature 4: Mức thu nhập */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Thu Nhập Hàng Tháng
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {formatVND(employee.features.monthlyIncome)}
                </div>
              </div>

              {/* Feature 5: Số công ty cũ */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Số Cty Từng Làm
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {employee.features.numCompaniesWorked} cty
                </div>
              </div>

              {/* Feature 6: Khoảng cách đi làm */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-slate-400" /> Khoảng Cách Đến Cty
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {employee.features.distanceFromHome} km
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bóc Tách Đóng Góp Chi Tiết (Explainable AI - XAI) */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-purple-500" />
              Đóng Góp Biên Của Từng Đặc Trưng (Log-Odds Contribution)
            </h4>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-700 dark:text-slate-300">
                Đang phân tích đóng góp biên XAI...
              </div>
            ) : detailData?.featureContributions ? (
              <div className="space-y-2">
                {detailData.featureContributions.map((fc, idx) => {
                  const isPositive = fc.contribution > 0;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {fc.label}
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">
                          (Giá trị: {fc.value} | Trọng số: {fc.weight > 0 ? `+${fc.weight}` : fc.weight})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {fc.contribution > 0 ? `+${fc.contribution}` : fc.contribution}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isPositive
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {isPositive ? 'Tăng nguy cơ' : 'Giảm nguy cơ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {pred.primaryRiskFactors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      +{f.impactScore} điểm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Khuyến Nghị Quản Trị Nhân Sự (Prescriptive HR Actions) */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Khuyến Nghị Can Thiệp Định Hướng Cho HR / Quản Lý
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {pred.recommendedAction}
            </p>

            <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Lên lịch phỏng vấn 1-on-1 trong 7 ngày tới
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Kiểm tra khối lượng làm thêm giờ (tránh trần 40h/tháng)
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Đánh giá mức độ cạnh tranh thu nhập theo ngành
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Xây dựng lộ trình thăng tiến và đào tạo nội bộ
              </div>
            </div>
          </div>

          {/* 5. Tuyên Bố Tuân Thủ Pháp Lý Điều 8 BLLĐ */}
          <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p>
              <strong>Bảo đảm Pháp Lý & Đạo Đức AI:</strong> Hệ thống tuân thủ nghiêm ngặt Điều 8 Bộ luật Lao động 2019 về chống phân biệt đối xử. Mô hình tuyệt đối không sử dụng độ tuổi (Age), giới tính (Gender) hay tình trạng hôn nhân (MaritalStatus). Dự báo chỉ đóng vai trò tham vấn hỗ trợ giữ chân nhân tài, không được sử dụng làm căn cứ sa thải hoặc xử lý kỷ luật lao động.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
