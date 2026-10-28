import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollApi } from '../api/payroll';
import { PayrollRecord } from '../types/payroll';
import { PayslipModal } from '../components/payroll/PayslipModal';
import {
  Calculator,
  Lock,
  Unlock,
  Play,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  Eye,
} from 'lucide-react';

const formatPeriodVN = (periodStr: string) => {
  if (!periodStr) return '';
  const parts = periodStr.split('-');
  if (parts.length === 2) {
    return `Tháng ${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  return periodStr;
};

export const PayrollPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['CEO', 'HR_MANAGER']);

  // Format YYYY-MM
  const getInitialPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [period, setPeriod] = useState<string>(getInitialPeriod());
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [myPayslip, setMyPayslip] = useState<PayrollRecord | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mode cho HR/CEO: xem toàn công ty vs xem phiếu lương cá nhân
  const [viewMode, setViewMode] = useState<'company' | 'self'>(
    isManagerOrAdmin ? 'company' : 'self'
  );

  const formatVND = (amount: number) => {
    const rounded = Math.round(amount || 0);
    const safeAmount = Math.abs(rounded) === 0 ? 0 : rounded;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(safeAmount);
  };

  // Load bảng lương công ty
  const fetchCompanyPayrolls = useCallback(async () => {
    if (!isManagerOrAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getPeriodPayrolls(period);
      setPayrolls(res.data || []);
    } catch (err: any) {
      console.error('Error fetching payrolls:', err);
      setError(
        err.response?.data?.message || 'Không thể tải bảng lương kỳ này'
      );
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  }, [isManagerOrAdmin, period]);

  // Load phiếu lương của chính mình
  const fetchMyPayslip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getMyPayslip(period);
      setMyPayslip(res.data);
    } catch (err: any) {
      console.error('Error fetching my payslip:', err);
      if (err.response?.status === 404) {
        setMyPayslip(null);
        setError(`Chưa có phiếu lương cho kỳ ${formatPeriodVN(period)}`);
      } else {
        setError(err.response?.data?.message || 'Không thể tải phiếu lương');
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (viewMode === 'company' && isManagerOrAdmin) {
      fetchCompanyPayrolls();
    } else {
      fetchMyPayslip();
    }
  }, [viewMode, isManagerOrAdmin, fetchCompanyPayrolls, fetchMyPayslip]);

  // Chạy tính lương toàn doanh nghiệp
  const handleCalculatePayroll = async () => {
    setCalculating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await payrollApi.calculatePayroll({ period });
      const records = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.payrolls || [];
      const count = (res.data as any)?.totalEmployees ?? records.length;
      setSuccessMessage(
        `Đã tính toán thành công bảng lương cho ${count} nhân sự!`
      );
      await fetchCompanyPayrolls();
    } catch (err: any) {
      console.error('Error calculating payroll:', err);
      setError(
        err.response?.data?.message || 'Lỗi trong quá trình tính lương'
      );
    } finally {
      setCalculating(false);
    }
  };

  // Khóa kỳ lương nguyên tử
  const handleLockPayroll = async () => {
    setLocking(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await payrollApi.lockPayroll({ period });
      setSuccessMessage(
        `Đã khóa thành công kỳ lương ${formatPeriodVN(period)} cho ${res.data?.lockedCount || 0} bản ghi!`
      );
      setConfirmLockOpen(false);
      fetchCompanyPayrolls();
    } catch (err: any) {
      console.error('Error locking payroll:', err);
      setError(
        err.response?.data?.message || 'Không thể khóa kỳ lương này'
      );
    } finally {
      setLocking(false);
    }
  };

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setIsModalOpen(true);
  };

  const safePayrolls = Array.isArray(payrolls) ? payrolls : [];
  const isPeriodLocked = safePayrolls.some((p) => p.periodLockedAt !== null);
  const lockedAtDate = safePayrolls.find((p) => p.periodLockedAt)?.periodLockedAt;

  const totalNet = safePayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const filteredPayrolls = safePayrolls.filter((record) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name =
      typeof record.userId === 'object' ? record.userId.fullName || '' : '';
    const email =
      typeof record.userId === 'object' ? record.userId.email || '' : '';
    const code =
      typeof record.userId === 'object'
        ? record.userId.employeeCode || ''
        : '';
    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      code.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight">
            Bảng lương 2026
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Biểu thuế lũy tiến 5 bậc mới (NQ 110/2025/UBTVQH15) · Miễn thuế làm thêm giờ theo Điều 98 BLLĐ.
          </p>
        </div>

        {/* Controls: Chọn kỳ & Nút chuyển chế độ */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[var(--surface-muted)] px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] text-xs">
            <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="font-medium text-[var(--text-muted)]">Kỳ lương:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-[var(--text)] font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          {isManagerOrAdmin && (
            <div className="flex p-1 bg-[var(--surface-muted)] rounded-[var(--radius)] border border-[var(--border)] text-xs">
              <button
                type="button"
                onClick={() => setViewMode('company')}
                className={`px-3 py-1 rounded-[6px] font-medium transition ${
                  viewMode === 'company'
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Toàn công ty
              </button>
              <button
                type="button"
                onClick={() => setViewMode('self')}
                className={`px-3 py-1 rounded-[6px] font-medium transition ${
                  viewMode === 'self'
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Phiếu lương của tôi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo Alert */}
      {error && (
        <div className="p-3.5 rounded-[var(--radius)] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-[var(--radius)] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* CHẾ ĐỘ 1: TOÀN CÔNG TY (DÀNH CHO CEO & HR MANAGER) */}
      {viewMode === 'company' && isManagerOrAdmin && (
        <div className="space-y-5">
          {/* Action Bar & Trạng Thái Khóa Kỳ */}
          <div className="app-surface p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {isPeriodLocked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--success-bg)] text-[var(--success-text)] text-xs font-medium border border-emerald-500/20">
                  <Lock className="w-3.5 h-3.5" />
                  Đã khóa kỳ lương {formatPeriodVN(period)} ({new Date(lockedAtDate!).toLocaleDateString('vi-VN')})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-800">
                  <Unlock className="w-3.5 h-3.5" />
                  Kỳ lương {formatPeriodVN(period)} đang mở
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {safePayrolls.length} nhân sự · Tổng quỹ lương thực nhận: <strong>{formatVND(totalNet)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={fetchCompanyPayrolls}
                disabled={loading}
                className="app-button-secondary p-2 h-9 min-h-0 text-xs"
                title="Tải lại dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {!isPeriodLocked && (
                <>
                  <button
                    type="button"
                    onClick={handleCalculatePayroll}
                    disabled={calculating}
                    className="app-button text-xs h-9 min-h-0 py-1 px-3.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{calculating ? 'Đang tính toán...' : 'Tính lương toàn bộ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmLockOpen(true)}
                    disabled={locking || safePayrolls.length === 0}
                    className="app-button-secondary text-xs h-9 min-h-0 py-1 px-3.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa kỳ lương</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bảng Danh Sách Bảng Lương Nhân Viên */}
          <div className="app-surface overflow-hidden">
            <div className="p-3.5 border-b border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[var(--text-muted)]">
                Hiển thị <span className="font-semibold text-[var(--text)]">{filteredPayrolls.length}</span> / {safePayrolls.length} nhân sự
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, mã NV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="app-input !pl-9 text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-[var(--text-muted)] text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                Đang tải dữ liệu bảng lương...
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)] space-y-3">
                <Calculator className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p className="text-xs">Chưa có bảng lương cho {formatPeriodVN(period)}</p>
                {!isPeriodLocked && (
                  <button
                    onClick={handleCalculatePayroll}
                    className="app-button text-xs py-1.5 px-3"
                  >
                    Bấm vào đây để tính lương kỳ này
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[var(--surface-muted)] border-b border-[var(--border)] text-[var(--text-muted)] font-medium">
                    <tr>
                      <th className="py-2.5 px-4">Nhân sự</th>
                      <th className="py-2.5 px-3">Phòng ban</th>
                      <th className="py-2.5 px-3 text-center">Công TT/Chuẩn</th>
                      <th className="py-2.5 px-3 text-right">Lương Gross</th>
                      <th className="py-2.5 px-3 text-right">Bảo hiểm (10.5%)</th>
                      <th className="py-2.5 px-3 text-right">Thuế TNCN</th>
                      <th className="py-2.5 px-4 text-right font-semibold text-[var(--text)]">Thực nhận (Net)</th>
                      <th className="py-2.5 px-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredPayrolls.map((record) => {
                      const empName =
                        typeof record.userId === 'object'
                          ? record.userId.fullName
                          : 'Nhân viên';
                      const empCode =
                        typeof record.userId === 'object'
                          ? record.userId.employeeCode || '—'
                          : '—';
                      const deptName =
                        typeof record.userId === 'object' &&
                        typeof (record.userId as any).departmentId === 'object' &&
                        (record.userId as any).departmentId?.name
                          ? (record.userId as any).departmentId.name
                          : ((record as any).departmentName || 'Chưa phân bổ');

                      const gross = (record as any).grossIncome ?? record.incomeBreakdown?.grossIncome ?? 0;
                      const insurance = (record as any).totalInsuranceEmployee ?? record.insuranceBreakdown?.employee?.total ?? 0;
                      const pit = (record as any).personalIncomeTax ?? record.taxBreakdown?.pitAmount ?? 0;

                      return (
                        <tr
                          key={record._id}
                          className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-[var(--text)] block text-xs">
                              {empName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              {empCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[var(--text)]">{deptName}</td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="font-medium text-[var(--text)]">
                              {(record as any).actualWorkingDays ?? record.attendanceBreakdown?.actualWorkingDays ?? 0}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              /{(record as any).standardWorkingDays ?? record.attendanceBreakdown?.standardWorkingDays ?? 0}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-[var(--text)] font-mono">
                            {formatVND(gross)}
                          </td>
                          <td className="py-3 px-3 text-right text-[var(--text-muted)] font-mono">
                            {insurance > 0 ? `-${formatVND(insurance)}` : '0 đ'}
                          </td>
                          <td className="py-3 px-3 text-right text-[var(--text-muted)] font-mono">
                            {pit > 0 ? `-${formatVND(pit)}` : '0 đ'}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-[var(--text)] font-mono">
                            {formatVND(record.netSalary || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleViewPayslip(record)}
                              className="app-button-secondary text-xs h-7 min-h-0 py-0.5 px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: PHIẾU LƯƠNG CỦA TÔI (CHO MỌI NHÂN VIÊN) */}
      {(viewMode === 'self' || !isManagerOrAdmin) && (
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="app-surface p-12 text-center text-[var(--text-muted)] text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent)]" />
              Đang tải phiếu lương của bạn...
            </div>
          ) : !myPayslip ? (
            <div className="app-surface p-12 text-center text-[var(--text-muted)] space-y-3">
              <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
              <p className="text-xs">Chưa có phiếu lương cho {formatPeriodVN(period)}</p>
              <p className="text-[11px]">Bảng lương sẽ hiển thị sau khi phòng nhân sự chốt kỳ.</p>
            </div>
          ) : (
            <div className="app-surface p-6 space-y-5">
              <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">
                    Phiếu lương {formatPeriodVN(period)}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Họ và tên: <strong>{myPayslip.userId?.fullName || 'Nhân viên'}</strong> ({myPayslip.userId?.employeeCode || '—'})
                  </p>
                </div>
                <button
                  onClick={() => handleViewPayslip(myPayslip)}
                  className="app-button-secondary text-xs py-1 px-3"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết thuế & BHXH</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-[var(--radius)] bg-[var(--surface-muted)]">
                  <span className="text-[var(--text-muted)]">Tổng thu nhập (Gross)</span>
                  <p className="text-base font-semibold text-[var(--text)] mt-1 font-mono">
                    {formatVND((myPayslip as any).grossIncome ?? myPayslip.incomeBreakdown?.grossIncome ?? 0)}
                  </p>
                </div>
                <div className="p-3 rounded-[var(--radius)] bg-[var(--accent-soft)]">
                  <span className="text-[var(--accent)] font-medium">Thực nhận (Net)</span>
                  <p className="text-base font-bold text-[var(--accent)] mt-1 font-mono">
                    {formatVND(myPayslip.netSalary || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Xác nhận Khóa Kỳ Lương */}
      {confirmLockOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-[var(--text)]">
              Xác nhận khóa kỳ lương {formatPeriodVN(period)}
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Hành động này sẽ chốt sổ toàn bộ bảng lương của {safePayrolls.length} nhân sự. Sau khi khóa, dữ liệu nguồn (chấm công, OT, đơn từ) của kỳ này sẽ được bảo vệ bất biến.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setConfirmLockOpen(false)}
                className="app-button-secondary text-xs py-1.5 px-3"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleLockPayroll}
                className="app-button text-xs py-1.5 px-3.5 text-rose-600 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100"
              >
                Xác nhận khóa kỳ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Phiếu Lương */}
      {selectedPayroll && (
        <PayslipModal
          record={selectedPayroll}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPayroll(null);
          }}
        />
      )}
    </div>
  );
};

export default PayrollPage;
