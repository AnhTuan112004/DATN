import React from 'react';
import {
  X,
  FileText,
  DollarSign,
  Clock,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { PayrollRecord } from '../../types/payroll';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: PayrollRecord | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  payroll,
}) => {
  if (!isOpen || !payroll) return null;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(amount || 0));
  };

  const {
    period,
    periodLockedAt,
    userId,
    attendanceBreakdown: att,
    incomeBreakdown: inc,
    insuranceBreakdown: ins,
    taxBreakdown: tax,
    policySnapshot: policy,
    netSalary,
    employerTotalCost,
  } = payroll;

  const employeeName =
    typeof userId === 'object' ? userId.fullName : 'Nhân viên';
  const employeeCode =
    typeof userId === 'object' ? userId.employeeCode || '—' : '—';
  const employeeEmail =
    typeof userId === 'object' ? userId.email : '';
  const departmentName =
    typeof userId === 'object' && typeof userId.departmentId === 'object'
      ? userId.departmentId?.name
      : 'Văn phòng';
  const position =
    typeof userId === 'object' ? userId.position || 'Nhân viên' : 'Nhân viên';

  const isPeriodLocked = Boolean(periodLockedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400 backdrop-blur">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">
                  Phiếu Lương Chi Tiết Kỳ {period}
                </h3>
                {isPeriodLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Lock className="w-3 h-3" /> Đã Khóa Kỳ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Unlock className="w-3 h-3" /> Dự Tính (Chưa Khóa)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Chuẩn Pháp Lý Thuế & Bảo Hiểm 2026 (NQ 110/2025/UBTVQH15 & NĐ 253/2026)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Employee Info Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-slate-500 block">Họ và tên</span>
              <span className="font-semibold text-slate-900">{employeeName}</span>
              {employeeEmail ? (
                <span className="text-[11px] text-slate-400 block truncate">{employeeEmail}</span>
              ) : null}
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Mã nhân viên</span>
              <span className="font-semibold text-slate-900">{employeeCode}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Phòng ban</span>
              <span className="font-semibold text-slate-900">{departmentName}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Chức vụ</span>
              <span className="font-semibold text-slate-900">{position}</span>
            </div>
          </div>

          {/* Dữ liệu công & làm thêm giờ */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" /> Tổng Hợp Ngày Công & Giờ Làm Thêm
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                <span className="text-xs text-slate-500 block">Công thực tế / Chuẩn</span>
                <span className="font-bold text-slate-900 text-base">
                  {att?.actualWorkingDays || 0} / {att?.standardWorkingDays || 0} ngày
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                <span className="text-xs text-slate-500 block">Nghỉ phép hưởng lương</span>
                <span className="font-bold text-slate-900 text-base">
                  {att?.paidLeaveDays || 0} ngày
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                <span className="text-xs text-slate-500 block">Nghỉ ốm hưởng BHXH</span>
                <span className="font-bold text-slate-900 text-base">
                  {att?.sickLeaveDays || 0} ngày
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                <span className="text-xs text-slate-500 block">Tổng giờ làm thêm (OT)</span>
                <span className="font-bold text-indigo-700 text-base">
                  {att?.totalOtHours || 0}h
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    (Trần 40h)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI 1: KHỐI THỰC NHẬN (NET SALARY) - BẮT BUỘC THEO PHƯƠNG ÁN A */}
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950">
                    KHỐI THỰC NHẬN (NET SALARY)
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Công thức: Gross - Bảo hiểm bắt buộc (10.5%) - Thuế TNCN khấu trừ = Thực nhận
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block font-medium">Lương Thực Nhận (Net)</span>
                <span className="text-2xl font-black text-emerald-700 tracking-tight">
                  {formatVND(netSalary)}
                </span>
              </div>
            </div>

            {/* Chi tiết Thu nhập Gross */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>1. Tổng thu nhập (Gross)</span>
                <span className="text-slate-950">{formatVND(inc?.grossIncome || 0)}</span>
              </div>
              <div className="pl-4 space-y-1 text-xs text-slate-600 border-l-2 border-slate-200">
                <div className="flex justify-between">
                  <span>- Lương cơ bản theo ngày công ({att?.actualWorkingDays || 0}/{att?.standardWorkingDays || 0} ngày)</span>
                  <span className="font-medium text-slate-900">{formatVND(inc?.proratedBaseSalary || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Phụ cấp ăn ca / trưa</span>
                  <span className="font-medium text-slate-900">{formatVND(inc?.allowances?.meal || 0)}</span>
                </div>
                {inc?.allowances?.other ? (
                  <div className="flex justify-between">
                    <span>- Phụ cấp khác (đi lại, trách nhiệm, điện thoại)</span>
                    <span className="font-medium text-slate-900">{formatVND(inc?.allowances?.other || 0)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>
                    - Tiền làm thêm giờ (OT) hợp lệ Điều 98 (Miễn thuế TNCN)
                  </span>
                  <span className="font-medium text-emerald-700">{formatVND(inc?.otPay?.exempt || 0)}</span>
                </div>
                {inc?.otPay?.taxable ? (
                  <div className="flex justify-between">
                    <span>
                      - Tiền OT vượt hạn mức / vượt hệ số (Chịu thuế TNCN)
                    </span>
                    <span className="font-medium text-amber-700">{formatVND(inc?.otPay?.taxable || 0)}</span>
                  </div>
                ) : null}
                {inc?.nightWorkPay?.total ? (
                  <div className="flex justify-between">
                    <span>- Tiền phụ cấp làm đêm (22h - 06h)</span>
                    <span className="font-medium text-slate-900">{formatVND(inc?.nightWorkPay?.total || 0)}</span>
                  </div>
                ) : null}
                {inc?.unusedLeaveComp?.amount ? (
                  <div className="flex justify-between">
                    <span>- Tiền bồi thường phép năm chưa nghỉ ({inc.unusedLeaveComp.days} ngày)</span>
                    <span className="font-medium text-emerald-700">{formatVND(inc.unusedLeaveComp.amount)}</span>
                  </div>
                ) : null}
                {inc?.bonus ? (
                  <div className="flex justify-between">
                    <span>- Thưởng hiệu quả / năng suất</span>
                    <span className="font-medium text-slate-900">{formatVND(inc.bonus)}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Chi tiết Khấu trừ */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>2. Tổng các khoản giảm trừ vào lương</span>
                <span className="text-rose-700">
                  -{formatVND((ins?.employee?.total || 0) + (tax?.pitAmount || 0))}
                </span>
              </div>
              <div className="pl-4 space-y-1 text-xs text-slate-600 border-l-2 border-rose-200">
                <div className="flex justify-between">
                  <span>- Bảo hiểm bắt buộc người lao động đóng (10.5%):</span>
                  <span className="font-semibold text-rose-600">-{formatVND(ins?.employee?.total || 0)}</span>
                </div>
                <div className="pl-4 space-y-0.5 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>• BHXH (8% trên {formatVND(ins?.insurableSalary || 0)})</span>
                    <span>-{formatVND(ins?.employee?.social || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• BHYT (1.5%)</span>
                    <span>-{formatVND(ins?.employee?.health || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• BHTN (1%)</span>
                    <span>-{formatVND(ins?.employee?.unemployment || 0)}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <span>- Thuế thu nhập cá nhân (TNCN) khấu trừ:</span>
                  <span className="font-semibold text-rose-600">-{formatVND(tax?.pitAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: KHỐI THÔNG TIN TÍNH THUẾ TNCN (GIẢI TRÌNH/THAM CHIẾU - KHÔNG TRỪ VÀO LƯƠNG) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  KHỐI THÔNG TIN TÍNH THUẾ TNCN 2026 (CHỈ MANG TÍNH CHẤT GIẢI TRÌNH)
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200 text-amber-900">
                    KHÔNG TRỪ VÀO LƯƠNG THỰC NHẬN
                  </span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Các khoản giảm trừ bản thân (15.5M) và người phụ thuộc (6.2M) chỉ dùng để xác định thu nhập tính thuế theo Luật Thuế TNCN mới, tuyệt đối không bị trừ vào tiền lương thực nhận của người lao động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-amber-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  A. Thu nhập chịu thuế & Các khoản miễn thuế
                </span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Tổng thu nhập chịu thuế:</span>
                    <span className="font-bold text-slate-900">{formatVND(tax?.taxableIncome || 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>• Miễn thuế ăn ca (Trần {formatVND(policy?.taxPolicy?.mealAllowanceExemptCap || 730000)}):</span>
                    <span>{formatVND(tax?.exemptions?.mealAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>• Miễn thuế toàn bộ tiền OT hợp lệ (Đ98):</span>
                    <span>{formatVND(tax?.exemptions?.otExempt || 0)}</span>
                  </div>
                  {tax?.exemptions?.nightExempt ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>• Miễn thuế làm đêm:</span>
                      <span>{formatVND(tax.exemptions.nightExempt)}</span>
                    </div>
                  ) : null}
                  {tax?.exemptions?.unusedLeaveExempt ? (
                    <div className="flex justify-between text-emerald-700">
                      <span>• Miễn thuế bồi thường phép chưa nghỉ:</span>
                      <span>{formatVND(tax.exemptions.unusedLeaveExempt)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-amber-200/80 space-y-2">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  B. Các khoản giảm trừ thuế TNCN
                </span>
                <div className="space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>• Giảm trừ bản thân người nộp thuế:</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(tax?.deductions?.personal || 15500000)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Giảm trừ người phụ thuộc ({tax?.deductions?.dependentCount || 0} người x 6.2M):</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(tax?.deductions?.dependents || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Giảm trừ bảo hiểm bắt buộc:</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(tax?.deductions?.insurance || 0)}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                    <span>= Thu nhập tính thuế (Sau giảm trừ):</span>
                    <span className="text-indigo-700">{formatVND(tax?.assessableIncome || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng biểu thuế 5 bậc mới */}
            <div className="bg-white p-3 rounded-lg border border-amber-200/80">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Biểu thuế lũy tiến từng phần 5 bậc mới 2026 áp dụng cho kỳ này:
              </span>
              <div className="grid grid-cols-5 gap-2 text-[11px] text-center">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Bậc 1 (5%)</span>
                  <span className="font-semibold text-slate-800">Đến 10 triệu</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Bậc 2 (10%)</span>
                  <span className="font-semibold text-slate-800">10M - 30M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Bậc 3 (20%)</span>
                  <span className="font-semibold text-slate-800">30M - 60M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Bậc 4 (30%)</span>
                  <span className="font-semibold text-slate-800">60M - 100M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Bậc 5 (35%)</span>
                  <span className="font-semibold text-slate-800">Trên 100M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chi phí Doanh nghiệp đóng thêm (Bảo hiểm 21.5%) */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">
                Chi phí doanh nghiệp đóng thêm cho nhân sự (21.5% BHXH, BHYT, BHTN):
              </span>
              <span>
                BHXH (17.5%), BHYT (3%), BHTN (1%) = {formatVND(ins?.employer?.total || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Tổng chi phí nhân sự công ty:</span>
              <span className="text-base font-bold text-slate-900">
                {formatVND(employerTotalCost || (inc?.grossIncome || 0) + (ins?.employer?.total || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm text-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
