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
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll?: PayrollRecord | null;
  record?: PayrollRecord | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  isOpen,
  onClose,
  payroll,
  record,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
  const activePayroll = payroll || record;
  if (!isOpen || !activePayroll) return null;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(amount || 0));
  };

  const userObj = activePayroll.userId && typeof activePayroll.userId === 'object' ? (activePayroll.userId as any) : null;
  const employeeName = userObj?.fullName || 'Nhân viên';
  const employeeCode = userObj?.employeeCode || '—';
  const employeeEmail = userObj?.email || '';
  const departmentName = (userObj?.departmentId && typeof userObj.departmentId === 'object' ? userObj.departmentId.name : null) || 'Văn phòng';
  const position = userObj?.position || (userObj?.role === 'HR_MANAGER' ? 'Trưởng phòng Nhân sự' : userObj?.role === 'CEO' ? 'Tổng Giám Đốc' : userObj?.role === 'MANAGER' ? 'Trưởng bộ phận' : 'Nhân viên');

  const isPeriodLocked = Boolean(activePayroll.periodLockedAt);
  const period = activePayroll.period || '—';

  // 1. Dữ liệu ngày công & OT
  const actualDays = activePayroll.actualWorkingDays ?? (activePayroll as any).attendanceBreakdown?.actualWorkingDays ?? 22;
  const standardDays = activePayroll.standardWorkingDays ?? (activePayroll as any).attendanceBreakdown?.standardWorkingDays ?? 22;
  const paidLeaveDays = activePayroll.paidLeaveDays ?? (activePayroll as any).attendanceBreakdown?.paidLeaveDays ?? 0;
  const sickLeaveDays = (activePayroll as any).attendanceBreakdown?.sickLeaveDays ?? 0;
  const totalOtHours = (activePayroll.otHoursWeekday || 0) + (activePayroll.otHoursWeekend || 0) + (activePayroll.otHoursHoliday || 0) || (activePayroll as any).attendanceBreakdown?.totalOtHours || 0;

  // 2. Thu nhập Gross & Net
  const gross = activePayroll.grossIncome ?? (activePayroll as any).incomeBreakdown?.grossIncome ?? 0;
  const net = activePayroll.netSalary ?? 0;
  const proratedBase = activePayroll.baseSalaryProrated ?? (activePayroll as any).incomeBreakdown?.proratedBaseSalary ?? gross;
  const mealAllowance = activePayroll.mealAllowanceTotal ?? (activePayroll as any).incomeBreakdown?.allowances?.meal ?? 0;
  const otherAllowance = activePayroll.allowanceTotal ?? (activePayroll as any).incomeBreakdown?.allowances?.other ?? 0;
  const otExempt = activePayroll.taxExemptOt ?? activePayroll.otPayTotal ?? (activePayroll as any).incomeBreakdown?.otPay?.exempt ?? 0;
  const otTaxable = (activePayroll.otPayTotal && activePayroll.taxExemptOt ? Math.max(0, activePayroll.otPayTotal - activePayroll.taxExemptOt) : 0) || (activePayroll as any).incomeBreakdown?.otPay?.taxable || 0;
  const nightPay = activePayroll.nightPayTotal ?? (activePayroll as any).incomeBreakdown?.nightWorkPay?.total ?? 0;
  const bonus = activePayroll.bonusTotal ?? (activePayroll as any).incomeBreakdown?.bonus ?? 0;

  // 3. Bảo hiểm bắt buộc (10.5%)
  const insurableSalary = activePayroll.insurableSalary ?? (activePayroll as any).insuranceBreakdown?.insurableSalary ?? gross;
  const totalInsurance = activePayroll.totalInsuranceEmployee ?? (activePayroll as any).insuranceBreakdown?.employee?.total ?? (insurableSalary * 0.105);
  const bhxh = activePayroll.bhxhEmployee ?? (activePayroll as any).insuranceBreakdown?.employee?.social ?? (insurableSalary * 0.08);
  const bhyt = activePayroll.bhytEmployee ?? (activePayroll as any).insuranceBreakdown?.employee?.health ?? (insurableSalary * 0.015);
  const bhtn = activePayroll.bhtnEmployee ?? (activePayroll as any).insuranceBreakdown?.employee?.unemployment ?? (insurableSalary * 0.01);

  // 4. Thuế TNCN & Giảm trừ gia cảnh 2026
  const pitAmount = activePayroll.personalIncomeTax ?? (activePayroll as any).taxBreakdown?.pitAmount ?? 0;
  const taxableIncome = activePayroll.taxableIncome ?? (activePayroll as any).taxBreakdown?.taxableIncome ?? gross;
  const assessableIncome = activePayroll.assessableIncome ?? (activePayroll as any).taxBreakdown?.assessableIncome ?? Math.max(0, taxableIncome - 15500000 - totalInsurance);
  const mealExempt = activePayroll.taxExemptMeal ?? (activePayroll as any).taxBreakdown?.exemptions?.mealAllowance ?? mealAllowance;
  const personalDeduction = activePayroll.personalDeductionAmount ?? (activePayroll as any).taxBreakdown?.deductions?.personal ?? 15500000;
  const dependentDeduction = activePayroll.dependentDeductionAmount ?? (activePayroll as any).taxBreakdown?.deductions?.dependents ?? 0;
  const dependentCount = Math.round(dependentDeduction / 6200000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payslip-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="payslip-modal-title" className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Phiếu Lương Chi Tiết Kỳ {period}
                </h3>
                {isPeriodLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    <Lock className="w-3 h-3" /> Đã Khóa Kỳ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    <Unlock className="w-3 h-3" /> Dự Tính (Chưa Khóa)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                Chuẩn Pháp Lý Thuế & Bảo Hiểm 2026 (NQ 110/2025/UBTVQH15 & NĐ 253/2026)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Employee Info Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 block">Họ và tên</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employeeName}</span>
              {employeeEmail ? (
                <span className="text-[11px] text-slate-400 block truncate">{employeeEmail}</span>
              ) : null}
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 block">Mã nhân viên</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employeeCode}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 block">Phòng ban</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{departmentName}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-400 block">Chức vụ</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{position}</span>
            </div>
          </div>

          {/* Dữ liệu công & làm thêm giờ */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" strokeWidth={1.5} /> Tổng hợp ngày công & giờ làm thêm
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 dark:text-slate-400 block">Công thực tế / Chuẩn</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {actualDays} / {standardDays} ngày
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 dark:text-slate-400 block">Nghỉ phép hưởng lương</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {paidLeaveDays} ngày
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 dark:text-slate-400 block">Nghỉ ốm hưởng BHXH</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  {sickLeaveDays} ngày
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 dark:text-slate-400 block">Tổng giờ làm thêm (OT)</span>
                <span className="font-bold text-teal-700 dark:text-teal-400 text-base">
                  {totalOtHours}h
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    (Trần 40h)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI 1: KHỐI THỰC NHẬN (NET SALARY) - BẮT BUỘC THEO PHƯƠNG ÁN A */}
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                    KHỐI THỰC NHẬN (NET SALARY)
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Công thức: Gross - Bảo hiểm bắt buộc (10.5%) - Thuế TNCN khấu trừ = Thực nhận
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 dark:text-slate-400 block font-medium">Lương Thực Nhận (Net)</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                  {formatVND(net)}
                </span>
              </div>
            </div>

            {/* Chi tiết Thu nhập Gross */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                <span>1. Tổng thu nhập (Gross)</span>
                <span className="text-slate-950 dark:text-slate-100 font-mono">{formatVND(gross)}</span>
              </div>
              <div className="pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span>- Lương cơ bản theo ngày công ({actualDays}/{standardDays} ngày)</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">{formatVND(proratedBase)}</span>
                </div>
                {mealAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>- Phụ cấp ăn ca / trưa</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">{formatVND(mealAllowance)}</span>
                  </div>
                )}
                {otherAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>- Phụ cấp khác (đi lại, trách nhiệm, điện thoại)</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">{formatVND(otherAllowance)}</span>
                  </div>
                )}
                {otExempt > 0 && (
                  <div className="flex justify-between">
                    <span>- Tiền làm thêm giờ (OT) hợp lệ Điều 98 (Miễn thuế TNCN)</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400 font-mono">{formatVND(otExempt)}</span>
                  </div>
                )}
                {otTaxable > 0 && (
                  <div className="flex justify-between">
                    <span>- Tiền OT vượt hạn mức / vượt hệ số (Chịu thuế TNCN)</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400 font-mono">{formatVND(otTaxable)}</span>
                  </div>
                )}
                {nightPay > 0 && (
                  <div className="flex justify-between">
                    <span>- Tiền phụ cấp làm đêm (22h - 06h)</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">{formatVND(nightPay)}</span>
                  </div>
                )}
                {bonus > 0 && (
                  <div className="flex justify-between">
                    <span>- Thưởng hiệu quả / năng suất</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">{formatVND(bonus)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết Khấu trừ */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                <span>2. Tổng các khoản giảm trừ vào lương</span>
                <span className="text-rose-700 dark:text-rose-400 font-mono">
                  -{formatVND(totalInsurance + pitAmount)}
                </span>
              </div>
              <div className="pl-4 space-y-1 text-xs text-slate-600 dark:text-slate-300 border-l-2 border-rose-200 dark:border-rose-800">
                <div className="flex justify-between">
                  <span>- Bảo hiểm bắt buộc người lao động đóng (10.5%):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">-{formatVND(totalInsurance)}</span>
                </div>
                <div className="pl-4 space-y-0.5 text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                  <div className="flex justify-between">
                    <span>• BHXH (8% trên {formatVND(insurableSalary)})</span>
                    <span>-{formatVND(bhxh)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• BHYT (1.5%)</span>
                    <span>-{formatVND(bhyt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• BHTN (1%)</span>
                    <span>-{formatVND(bhtn)}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <span>- Thuế thu nhập cá nhân (TNCN) khấu trừ:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono">-{formatVND(pitAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: KHỐI THÔNG TIN TÍNH THUẾ TNCN (GIẢI TRÌNH/THAM CHIẾU - KHÔNG TRỪ VÀO LƯƠNG) */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  KHỐI THÔNG TIN TÍNH THUẾ TNCN 2026 (CHỈ MANG TÍNH CHẤT GIẢI TRÌNH)
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                    KHÔNG TRỪ VÀO LƯƠNG THỰC NHẬN
                  </span>
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Các khoản giảm trừ bản thân (15.5M) và người phụ thuộc (6.2M) chỉ dùng để xác định thu nhập tính thuế theo Luật Thuế TNCN mới, tuyệt đối không bị trừ vào tiền lương thực nhận của người lao động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                  A. Thu nhập chịu thuế & các khoản miễn thuế
                </span>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Tổng thu nhập chịu thuế:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{formatVND(taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>• Miễn thuế ăn ca (Trần 730.000đ):</span>
                    <span className="font-mono">{formatVND(mealExempt)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                    <span>• Miễn thuế toàn bộ tiền OT hợp lệ (Đ98):</span>
                    <span className="font-mono">{formatVND(otExempt)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                  B. Các khoản giảm trừ thuế TNCN
                </span>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>• Giảm trừ bản thân người nộp thuế:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {formatVND(personalDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Giảm trừ người phụ thuộc ({dependentCount} người x 6.2M):</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {formatVND(dependentDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Giảm trừ bảo hiểm bắt buộc:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                      {formatVND(totalInsurance)}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>= Thu nhập tính thuế (Sau giảm trừ):</span>
                    <span className="text-teal-700 dark:text-teal-400 font-mono">{formatVND(assessableIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng biểu thuế 5 bậc mới */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Biểu thuế lũy tiến từng phần 5 bậc mới 2026 áp dụng cho kỳ này:
              </span>
              <div className="grid grid-cols-5 gap-2 text-[11px] text-center">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block">Bậc 1 (5%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Đến 10 triệu</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block">Bậc 2 (10%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">10M - 30M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block">Bậc 3 (20%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">30M - 60M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block">Bậc 4 (30%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">60M - 100M</span>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block">Bậc 5 (35%)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Trên 100M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
