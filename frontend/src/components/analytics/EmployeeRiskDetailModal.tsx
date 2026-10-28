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
  Lightbulb,
} from 'lucide-react';
import { AnalyzedEmployee, getEmployeeAttritionDetail, EmployeeRiskDetailData } from '../../api/analytics';
import { useDialogA11y } from '../../hooks/useDialogA11y';

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

  const { dialogRef } = useDialogA11y({
    isOpen: Boolean(employee),
    onClose,
  });

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
        console.error('Lỗi khi tải chi tiết nhân sự:', err);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/30 animate-in fade-in duration-150">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="risk-detail-title"
        tabIndex={-1}
        className="app-surface w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden focus:outline-none"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 id="risk-detail-title" className="text-base font-semibold text-[var(--text)]">
              Hồ sơ đánh giá nguy cơ thôi việc
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {employee.fullName} · {employee.employeeCode} · {employee.department.name}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-1 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Thẻ Điểm Rủi Ro Chính */}
          <div className="p-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-muted)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-[var(--radius)] flex items-center justify-center font-bold text-lg text-white ${
                  pred.riskLevel === 'HIGH'
                    ? 'bg-rose-500'
                    : pred.riskLevel === 'MEDIUM'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              >
                {pred.riskScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Chỉ số rủi ro
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pred.riskLevel === 'HIGH'
                        ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                        : pred.riskLevel === 'MEDIUM'
                        ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                        : 'bg-[var(--success-bg)] text-[var(--success-text)]'
                    }`}
                  >
                    {pred.riskLabel}
                  </span>
                </div>
                <div className="text-base font-semibold text-[var(--text)] mt-0.5 tabular-nums">
                  Xác suất ước tính: {(pred.probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {pred.riskLevel === 'HIGH' && 'Xác suất từ 50% trở lên: Có dấu hiệu suy giảm gắn kết trong thời gian tới.'}
                  {pred.riskLevel === 'MEDIUM' && 'Xác suất từ 30% đến 49%: Cần theo dõi sự hài hòa trong công việc.'}
                  {pred.riskLevel === 'LOW' && 'Xác suất dưới 30%: Mức độ gắn bó tốt với công ty.'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Lưới Thông tin đầu vào đánh giá */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text)] mb-2.5">
              Thông tin đầu vào đánh giá
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Feature 1: OverTime */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Làm thêm giờ (30 ngày)
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {employee.features.otHoursMonth}h
                  <span className={`ml-1 text-xs ${employee.features.overTime === 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ({employee.features.overTime === 1 ? '≥4h/tháng' : 'Bình thường'})
                  </span>
                </div>
              </div>

              {/* Feature 2: Thâm niên công ty */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Building className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Thâm niên công ty
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {employee.features.yearsAtCompany} năm
                </div>
              </div>

              {/* Feature 3: Tổng thâm niên nghề */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Tổng số năm làm việc
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {employee.features.totalWorkingYears} năm
                </div>
              </div>

              {/* Feature 4: Mức thu nhập */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <DollarSign className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Thu nhập hàng tháng
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {formatVND(employee.features.monthlyIncome)}
                </div>
              </div>

              {/* Feature 5: Số công ty cũ */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Building className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Số công ty từng làm
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {employee.features.numCompaniesWorked} nơi
                </div>
              </div>

              {/* Feature 6: Khoảng cách đi làm */}
              <div className="p-3 bg-[var(--surface-muted)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Navigation className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Khoảng cách đi làm
                </div>
                <div className="text-sm font-semibold text-[var(--text)] mt-1">
                  {employee.features.distanceFromHome} km
                </div>
              </div>
            </div>
          </div>

          {/* 3. Bóc Tách Đóng Góp Chi Tiết */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text)] mb-2.5">
              Yếu tố tác động tới đánh giá
            </h4>

            {loading ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                Đang tải chi tiết các yếu tố...
              </div>
            ) : detailData?.featureContributions ? (
              <div className="space-y-2">
                {detailData.featureContributions.map((fc, idx) => {
                  const isPositive = fc.contribution > 0;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPositive ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-medium text-[var(--text)]">
                          {fc.label}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          (Giá trị: {fc.value})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            isPositive
                              ? 'bg-[var(--danger-bg)] text-[var(--danger-text)]'
                              : 'bg-[var(--success-bg)] text-[var(--success-text)]'
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
                    className="p-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[var(--text)]">{f.label}</span>
                    <span className="font-semibold text-rose-500">
                      +{f.impactScore} điểm
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Khuyến Nghị Hỗ Trợ Nhân Sự */}
          <div className="p-4 rounded-[var(--radius)] bg-[var(--surface-muted)]/50 border border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[var(--accent)]" />
              Gợi ý hành động hỗ trợ
            </h4>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              {pred.recommendedAction}
            </p>

            <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Lên lịch trao đổi trực tiếp trong 7 ngày tới
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Rà soát khối lượng làm thêm giờ trong tháng
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Tìm hiểu thêm về mức độ hài lòng công việc
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Tạo cơ hội phát triển hoặc luân chuyển phù hợp
              </div>
            </div>
          </div>

          {/* 5. Ghi chú bảo đảm pháp lý */}
          <div className="flex items-start gap-2 bg-[var(--surface-muted)]/30 p-3 rounded-[var(--radius)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <p>
              Đánh giá rủi ro chỉ đóng vai trò tham khảo nhằm hỗ trợ ban quản lý và HR lắng nghe nhân viên kịp thời. Hệ thống không sử dụng các yếu tố tuổi tác, giới tính hay tình trạng hôn nhân để tránh thiên lệch.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="app-button-secondary text-xs h-9 min-h-0 py-1.5 px-4"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
