import React from 'react';
import { createPortal } from 'react-dom';
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
import { formatVND } from '../../utils/formatters';

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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payslip-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-surface rounded-3xl shadow-hard-lg border-2 border-line w-full max-w-4xl my-8 overflow-hidden text-fg"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b-2 border-line bg-surface-2 flex items-center justify-between text-fg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime border-2 border-line text-ink flex items-center justify-center shadow-hard shrink-0">
              <FileText className="w-5 h-5 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="payslip-modal-title" className="text-xl font-black text-fg font-display">
                  Phiếu Lương Chi Tiết Kỳ {period}
                </h3>
                {isPeriodLocked ? (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-xl text-xs font-black bg-lime text-ink border-2 border-line shadow-hard">
                    <Lock className="w-3.5 h-3.5" /> Đã Khóa Kỳ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-xl text-xs font-black bg-amber-300 text-ink border-2 border-line shadow-hard">
                    <Unlock className="w-3.5 h-3.5" /> Dự Tính (Chưa Khóa)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-medium mt-0.5">
                Chuẩn Pháp Lý Thuế &amp; Bảo Hiểm 2026 (NQ 110/2025/UBTVQH15 &amp; NĐ 253/2026)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-line hover:bg-surface text-fg cursor-pointer transition shadow-hard"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5 text-fg font-medium">
          {/* Employee Info Header Card */}
          <div className="p-4 rounded-2xl bg-surface-2 border-2 border-line shadow-hard grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted font-bold block">Họ và tên</span>
              <span className="font-black text-fg text-sm font-display">{employeeName}</span>
              {employeeEmail ? (
                <span className="text-[11px] text-muted font-mono block truncate">{employeeEmail}</span>
              ) : null}
            </div>
            <div>
              <span className="text-muted font-bold block">Mã nhân viên</span>
              <span className="font-bold text-fg font-mono text-sm">{employeeCode}</span>
            </div>
            <div>
              <span className="text-muted font-bold block">Phòng ban</span>
              <span className="font-bold text-fg">{departmentName}</span>
            </div>
            <div>
              <span className="text-muted font-bold block">Chức vụ</span>
              <span className="font-bold text-fg">{position}</span>
            </div>
          </div>

          {/* Dữ liệu công & làm thêm giờ */}
          <div className="p-4 rounded-2xl border-2 border-line bg-surface shadow-hard space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-fg flex items-center gap-1.5 font-display">
              <Clock className="w-4 h-4 text-accent" /> Tổng hợp ngày công &amp; giờ làm thêm
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-surface-2 p-3.5 rounded-xl border-2 border-line shadow-hard-xs">
                <span className="text-muted font-bold block">Công thực tế / Chuẩn</span>
                <span className="font-black text-fg text-base font-mono">
                  {actualDays} / {standardDays} ngày
                </span>
              </div>
              <div className="bg-surface-2 p-3.5 rounded-xl border-2 border-line shadow-hard-xs">
                <span className="text-muted font-bold block">Nghỉ phép hưởng lương</span>
                <span className="font-black text-fg text-base font-mono">
                  {paidLeaveDays} ngày
                </span>
              </div>
              <div className="bg-surface-2 p-3.5 rounded-xl border-2 border-line shadow-hard-xs">
                <span className="text-muted font-bold block">Nghỉ ốm hưởng BHXH</span>
                <span className="font-black text-fg text-base font-mono">
                  {sickLeaveDays} ngày
                </span>
              </div>
              <div className="bg-surface-2 p-3.5 rounded-xl border-2 border-line shadow-hard-xs">
                <span className="text-muted font-bold block">Tổng giờ làm thêm (OT)</span>
                <span className="font-black text-fg text-base font-mono">
                  {totalOtHours}h
                  <span className="text-xs font-normal text-muted ml-1">
                    (Trần 40h)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI 1: KHỐI THỰC NHẬN (NET SALARY) - BẮT BUỘC THEO PHƯƠNG ÁN A */}
          <div className="rounded-2xl border-2 border-line bg-surface-2 p-5 space-y-4 shadow-hard text-fg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-lime border-2 border-line text-ink flex items-center justify-center shadow-hard shrink-0">
                  <DollarSign className="w-4 h-4 text-ink" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-fg font-display">
                    KHỐI THỰC NHẬN (NET SALARY)
                  </h4>
                  <p className="text-xs text-muted font-medium">
                    Công thức: Gross - Bảo hiểm bắt buộc (10.5%) - Thuế TNCN khấu trừ = Thực nhận
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted block font-bold">Lương Thực Nhận (Net)</span>
                <span className="text-2xl font-black text-fg font-display tracking-tight">
                  {formatVND(net)}
                </span>
              </div>
            </div>

            {/* Chi tiết Thu nhập Gross */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-fg font-display">
                <span>1. Tổng thu nhập (Gross)</span>
                <span className="font-mono text-sm">{formatVND(gross)}</span>
              </div>
              <div className="pl-3.5 space-y-1.5 text-xs text-fg border-l-2 border-line font-medium">
                <div className="flex justify-between">
                  <span>- Lương cơ bản theo ngày công ({actualDays}/{standardDays} ngày)</span>
                  <span className="font-bold font-mono">{formatVND(proratedBase)}</span>
                </div>
                {mealAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>- Phụ cấp ăn ca / trưa</span>
                    <span className="font-bold font-mono">{formatVND(mealAllowance)}</span>
                  </div>
                )}
                {otherAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>- Phụ cấp khác (đi lại, trách nhiệm, điện thoại)</span>
                    <span className="font-bold font-mono">{formatVND(otherAllowance)}</span>
                  </div>
                )}
                {otExempt > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>- Tiền làm thêm giờ (OT) hợp lệ Điều 98 (Miễn thuế TNCN)</span>
                    <span className="font-mono">{formatVND(otExempt)}</span>
                  </div>
                )}
                {otTaxable > 0 && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold">
                    <span>- Tiền OT vượt hạn mức / vượt hệ số (Chịu thuế TNCN)</span>
                    <span className="font-mono">{formatVND(otTaxable)}</span>
                  </div>
                )}
                {nightPay > 0 && (
                  <div className="flex justify-between">
                    <span>- Tiền phụ cấp làm đêm (22h - 06h)</span>
                    <span className="font-bold font-mono">{formatVND(nightPay)}</span>
                  </div>
                )}
                {bonus > 0 && (
                  <div className="flex justify-between">
                    <span>- Thưởng hiệu quả / năng suất</span>
                    <span className="font-bold font-mono">{formatVND(bonus)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết Khấu trừ */}
            <div className="space-y-2 pt-3 border-t-2 border-line">
              <div className="flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400 font-display">
                <span>2. Tổng các khoản giảm trừ vào lương</span>
                <span className="font-mono text-sm">
                  -{formatVND(totalInsurance + pitAmount)}
                </span>
              </div>
              <div className="pl-3.5 space-y-1.5 text-xs border-l-2 border-rose-500 font-medium">
                <div className="flex justify-between">
                  <span>- Bảo hiểm bắt buộc người lao động đóng (10.5%):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">-{formatVND(totalInsurance)}</span>
                </div>
                <div className="pl-3 space-y-0.5 text-[11px] text-muted font-mono">
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
                  <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">-{formatVND(pitAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: KHỐI THÔNG TIN TÍNH THUẾ TNCN (GIẢI TRÌNH/THAM CHIẾU - KHÔNG TRỪ VÀO LƯƠNG) */}
          <div className="rounded-2xl border-2 border-line bg-surface p-5 space-y-4 shadow-hard text-fg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-ink border-2 border-line flex items-center justify-center shadow-hard shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-ink" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black text-fg flex flex-wrap items-center gap-2 font-display">
                  KHỐI THÔNG TIN TÍNH THUẾ TNCN 2026 (CHỈ MANG TÍNH CHẤT GIẢI TRÌNH)
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-300 text-ink border border-line">
                    KHÔNG TRỪ VÀO LƯƠNG THỰC NHẬN
                  </span>
                </h4>
                <p className="text-xs text-muted mt-0.5 font-medium">
                  Các khoản giảm trừ bản thân (15.5M) và người phụ thuộc (6.2M) chỉ dùng để xác định thu nhập tính thuế theo Luật Thuế TNCN mới, tuyệt đối không bị trừ vào tiền lương thực nhận của người lao động.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border-2 border-line bg-surface-2 space-y-2 shadow-hard-xs">
                <span className="font-black text-fg block text-xs font-display">
                  A. Thu nhập chịu thuế &amp; các khoản miễn thuế
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted">Tổng thu nhập chịu thuế:</span>
                    <span className="font-bold text-fg font-mono">{formatVND(taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>• Miễn thuế ăn ca (Trần 730.000đ):</span>
                    <span className="font-mono">{formatVND(mealExempt)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                    <span>• Miễn thuế toàn bộ tiền OT hợp lệ (Đ98):</span>
                    <span className="font-mono">{formatVND(otExempt)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border-2 border-line bg-surface-2 space-y-2 shadow-hard-xs">
                <span className="font-black text-fg block text-xs font-display">
                  B. Các khoản giảm trừ thuế TNCN
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted">• Giảm trừ bản thân người nộp thuế:</span>
                    <span className="font-bold text-fg font-mono">
                      {formatVND(personalDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">• Giảm trừ người phụ thuộc ({dependentCount} người x 6.2M):</span>
                    <span className="font-bold text-fg font-mono">
                      {formatVND(dependentDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">• Giảm trừ bảo hiểm bắt buộc:</span>
                    <span className="font-bold text-fg font-mono">
                      {formatVND(totalInsurance)}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t-2 border-line flex justify-between font-black text-fg">
                    <span>= Thu nhập tính thuế (Sau giảm trừ):</span>
                    <span className="font-mono">{formatVND(assessableIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng biểu thuế 5 bậc mới */}
            <div className="bg-surface-2 p-3.5 rounded-xl border-2 border-line shadow-hard-xs">
              <span className="text-xs font-black text-fg block mb-2 font-display">
                Biểu thuế lũy tiến từng phần 5 bậc mới 2026 áp dụng cho kỳ này:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-center font-bold">
                <div className="p-2 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                  <span className="text-muted block text-[10px]">Bậc 1 (5%)</span>
                  <span className="font-black text-fg">Đến 10 triệu</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                  <span className="text-muted block text-[10px]">Bậc 2 (10%)</span>
                  <span className="font-black text-fg">10M - 30M</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                  <span className="text-muted block text-[10px]">Bậc 3 (20%)</span>
                  <span className="font-black text-fg">30M - 60M</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                  <span className="text-muted block text-[10px]">Bậc 4 (30%)</span>
                  <span className="font-black text-fg">60M - 100M</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border-2 border-line shadow-hard-xs col-span-2 sm:col-span-1">
                  <span className="text-muted block text-[10px]">Bậc 5 (35%)</span>
                  <span className="font-black text-fg">Trên 100M</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
