import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { payrollApi } from '../api/payroll';
import { PayrollRecord } from '../types/payroll';
import { PayslipModal } from '../components/payroll/PayslipModal';
import { formatVND } from '../utils/formatters';
import {
  Lock,
  Unlock,
  Calculator,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  Eye,
  DollarSign,
  Info,
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
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('Mở khóa kỳ lương để điều chỉnh số liệu');
  const [searchTerm, setSearchTerm] = useState('');

  // Mode cho HR/CEO: xem toàn công ty vs xem phiếu lương cá nhân
  const [viewMode, setViewMode] = useState<'company' | 'self'>(
    isManagerOrAdmin ? 'company' : 'self'
  );

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
        err.response?.data?.message || err.response?.data?.error || 'Không thể tải bảng lương kỳ này'
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
        setError(err.response?.data?.message || err.response?.data?.error || 'Không thể tải phiếu lương');
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
        err.response?.data?.message || err.response?.data?.error || 'Lỗi trong quá trình tính lương'
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
        err.response?.data?.message || err.response?.data?.error || 'Không thể khóa kỳ lương này'
      );
    } finally {
      setLocking(false);
    }
  };

  // Mở khóa kỳ lương (CEO / HR Manager)
  const handleUnlockPayroll = async () => {
    setUnlocking(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await payrollApi.unlockPayroll({
        period,
        reason: unlockReason.trim(),
      });
      setSuccessMessage(
        `Đã mở khóa thành công kỳ lương ${formatPeriodVN(period)} (${res.data?.unlockedCount || 0} bản ghi)! Bạn có thể tính toán lại hoặc điều chỉnh số liệu.`
      );
      setConfirmUnlockOpen(false);
      fetchCompanyPayrolls();
    } catch (err: any) {
      console.error('Error unlocking payroll:', err);
      setError(
        err.response?.data?.message || err.response?.data?.error || 'Không thể mở khóa kỳ lương này'
      );
    } finally {
      setUnlocking(false);
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
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-fg">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 pb-2 border-b-2 border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted bg-surface-2 border border-line px-2 py-0.5 rounded uppercase tracking-wider">
              Chuẩn Pháp Lý 2026 (NQ 110/2025/UBTVQH15)
            </span>
            <span className="text-muted">·</span>
            <span className="text-xs text-muted font-medium">Miễn thuế OT theo Điều 98 BLLĐ</span>
          </div>
          <h1 className="text-2xl sm:text-[1.85rem] font-bold font-display text-fg leading-tight">
            Bảng lương &amp; chi trả thu nhập
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            Biểu thuế lũy tiến 5 bậc mới (10M - 30M - 60M - 100M), giảm trừ gia cảnh 15.5M/bản thân & 6.2M/phụ thuộc, bảo hiểm trần 2026.
          </p>
        </div>

        {/* Controls: Chọn kỳ & Nút chuyển chế độ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border-2 border-line shadow-hard-sm text-xs cursor-pointer group hover:bg-surface-2 transition">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-muted">Kỳ lương:</span>
            <span className="font-bold text-fg font-mono">
              Tháng {period.split('-')[1]}/{period.split('-')[0]}
            </span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Chọn kỳ lương cần xem"
            />
          </div>

          {isManagerOrAdmin && (
            <div className="flex p-0.5 bg-surface rounded-xl border-2 border-line shadow-hard-sm text-xs">
              <button
                type="button"
                onClick={() => setViewMode('company')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  viewMode === 'company'
                    ? 'bg-lime text-ink'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Toàn công ty
              </button>
              <button
                type="button"
                onClick={() => setViewMode('self')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  viewMode === 'self'
                    ? 'bg-lime text-ink'
                    : 'text-muted hover:text-fg'
                }`}
              >
                Phiếu của tôi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. PAYROLL HERO MOMENT: Tổng Quỹ Lương Khổng Lồ Chiếm Trọn Tiêu Điểm */}
      {viewMode === 'company' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border-2 border-line shadow-hard-lg space-y-4 text-fg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-line pb-3">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2 font-display">
              <Calculator className="w-4 h-4 text-accent" />
              <span>Tổng Quỹ Lương Thực Nhận (Net Pay) · Kỳ {formatPeriodVN(period)}</span>
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-line shadow-hard flex items-center gap-1.5 ${
                  isPeriodLocked
                    ? 'bg-lime text-ink'
                    : 'bg-amber-300 text-ink'
                }`}
              >
                {isPeriodLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {isPeriodLocked
                  ? `Đã khóa kỳ (${new Date(lockedAtDate!).toLocaleDateString('vi-VN')})`
                  : 'Kỳ đang mở tính toán'}
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
            <div>
              <div className="text-4xl sm:text-6xl font-black font-display text-fg tracking-tight">
                {formatVND(totalNet)}
              </div>
              <p className="text-xs sm:text-sm text-muted mt-1 font-medium">
                Chi trả cho <strong className="text-fg font-black font-mono">{safePayrolls.length}</strong> nhân sự theo biểu thuế lũy tiến 5 bậc 2026 và NQ 110/2025/UBTVQH15.
              </p>
            </div>

            {/* Quick Actions (CEO & HR Manager) */}
            {isManagerOrAdmin && (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                {/* Nút Tính Lương Toàn Bộ */}
                <button
                  onClick={handleCalculatePayroll}
                  disabled={calculating || isPeriodLocked}
                  className="px-4 py-2.5 rounded-xl bg-lime text-ink text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={isPeriodLocked ? 'Kỳ lương đã khóa. Vui lòng mở khóa trước nếu cần tính lại.' : 'Chạy tính toán bảng lương toàn doanh nghiệp'}
                >
                  <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
                  <span>{calculating ? 'Đang tính toán...' : 'Tính Lương Toàn Bộ'}</span>
                </button>

                {/* Khi ĐÃ KHÓA: Hiển thị Nút Mở Khóa Kỳ Lương cho CEO / HR */}
                {isPeriodLocked && (
                  <button
                    onClick={() => setConfirmUnlockOpen(true)}
                    disabled={unlocking}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 flex items-center gap-2 cursor-pointer"
                    title="Mở khóa kỳ lương để cho phép tính toán lại hoặc điều chỉnh số liệu"
                  >
                    <Unlock className="w-4 h-4 text-ink" />
                    <span>{unlocking ? 'Đang mở khóa...' : 'Mở Khóa Kỳ Lương'}</span>
                  </button>
                )}

                {/* Khi CHƯA KHÓA: Hiển thị Nút Khóa Kỳ Lương */}
                {!isPeriodLocked && safePayrolls.length > 0 && (
                  <button
                    onClick={() => setConfirmLockOpen(true)}
                    disabled={locking}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    <span>Khóa Kỳ Lương</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-surface border-2 border-line shadow-hard flex items-center justify-between gap-4 text-fg font-medium">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-black border-2 border-line shadow-hard flex items-center gap-1.5 ${
              isPeriodLocked
                ? 'bg-lime text-ink'
                : 'bg-amber-300 text-ink'
            }`}
          >
            {isPeriodLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isPeriodLocked
              ? `Đã khóa kỳ (${new Date(lockedAtDate!).toLocaleDateString('vi-VN')})`
              : `Kỳ ${formatPeriodVN(period)} đang mở`}
          </span>
          <span className="text-xs text-muted font-bold">Phiếu lương cá nhân chính thức</span>
        </div>
      )}

      {/* Thông báo Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-hard">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-black">
            Đóng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-lime/20 border-2 border-line text-fg text-xs font-bold flex items-center justify-between animate-fadeIn shadow-hard">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-fg hover:underline cursor-pointer font-black">
            Đóng
          </button>
        </div>
      )}

      {/* VIEW: TOÀN CÔNG TY (BẢNG QUẢN TRỊ HR/CEO) */}
      {isManagerOrAdmin && viewMode === 'company' && (
        <div className="rounded-3xl bg-surface border-2 border-line p-5 shadow-hard-lg space-y-4 text-fg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-line pb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, email, mã nhân viên..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border-2 border-line text-fg placeholder:text-muted text-xs font-medium focus:outline-none focus:border-accent shadow-hard transition"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted font-bold">
              <span>Hiển thị <strong className="text-fg font-black">{filteredPayrolls.length}</strong> / {safePayrolls.length} nhân sự</span>
            </div>
          </div>

          {/* Mobile View: Stacked Cards (Visible on sm:hidden) */}
          <div className="space-y-3 sm:hidden">
            {loading ? (
              <div className="py-12 text-center text-muted font-bold">
                <RefreshCw className="w-5 h-5 animate-spin text-accent mx-auto mb-2" />
                <span>Đang tải bảng lương...</span>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="py-12 text-center text-muted bg-surface-2 rounded-2xl border-2 border-line shadow-hard">
                <p className="text-xs font-black text-fg">Không có dữ liệu bảng lương</p>
              </div>
            ) : (
              filteredPayrolls.map((p) => {
                const userObj = p.userId && typeof p.userId === 'object' ? (p.userId as any) : null;
                const employeeName = userObj?.fullName || 'Nhân viên';
                const employeeCode = userObj?.employeeCode || '—';
                const departmentName = userObj?.departmentId && typeof userObj.departmentId === 'object' ? userObj.departmentId.name : '—';
                const gross = p.grossIncome ?? (p as any).incomeBreakdown?.grossIncome ?? 0;
                const net = p.netSalary ?? 0;

                return (
                  <div key={p._id} className="p-4 rounded-2xl bg-surface-2 border-2 border-line shadow-hard space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-fg text-xs font-display">{employeeName}</div>
                        <div className="text-[10px] font-mono font-bold text-muted">{employeeCode} • {departmentName}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-surface border border-line text-fg shadow-hard-xs">
                        {p.actualWorkingDays ?? 22}/{p.standardWorkingDays ?? 22} công
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t-2 border-line font-mono">
                      <div>
                        <span className="text-[10px] text-muted block font-sans font-bold">Lương Gross:</span>
                        <span className="text-fg font-bold">{formatVND(gross)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block font-sans font-bold">Thực nhận (Net):</span>
                        <span className="text-fg font-black text-sm">{formatVND(net)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t-2 border-line">
                      <span className="text-[10px] font-mono font-bold text-muted">
                        Kỳ {p.period} {isPeriodLocked && '• Đã khóa'}
                      </span>
                      <button
                        onClick={() => setSelectedPayroll(p)}
                        className="px-3 py-1.5 bg-lime text-ink rounded-xl text-xs font-black border-2 border-line shadow-hard cursor-pointer uppercase tracking-wider hover:translate-x-0.5 hover:translate-y-0.5 transition"
                      >
                        Xem phiếu lương
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop View: Full Data Table (Hidden on Mobile) */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border-2 border-line bg-surface shadow-hard">
            <table className="w-full text-left text-xs">
              <thead className="border-b-2 border-line text-fg font-black tracking-wide bg-surface-2 font-display">
                <tr>
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4 text-center">Công TT/Chuẩn</th>
                  <th className="py-3 px-4 text-right">Lương Gross</th>
                  <th className="py-3 px-4 text-right">Bảo hiểm (10.5%)</th>
                  <th className="py-3 px-4 text-right">Thuế TNCN</th>
                  <th className="py-3 px-4 text-right">Thực nhận (Net)</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-line font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-muted font-bold">
                      <div className="inline-flex items-center gap-2 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                        <span>Đang tải bảng lương kỳ này...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-muted">
                      <FileText className="w-8 h-8 mx-auto text-muted mb-2" />
                      <p className="text-xs font-black text-fg">Chưa có dữ liệu bảng lương</p>
                      <p className="text-[11px] text-muted mt-1 font-medium">
                        Bấm &quot;Tính Lương Toàn Bộ&quot; để tổng hợp công và tính thuế tự động.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((record) => {
                    const empName =
                      typeof record.userId === 'object'
                        ? record.userId.fullName
                        : 'Nhân viên';
                    const empCode =
                      typeof record.userId === 'object'
                        ? record.userId.employeeCode
                        : '';
                    const deptName =
                      typeof record.userId === 'object' &&
                      typeof (record.userId as any).departmentId === 'object'
                        ? (record.userId as any).departmentId.name
                        : 'Chưa phân bổ';

                    return (
                      <tr key={record._id} className="hover:bg-surface-2/60 transition">
                        <td className={`py-3 px-4 border-l-4 ${record.periodLockedAt ? 'border-l-lime' : 'border-l-amber-400'}`}>
                          <div className="font-black text-fg font-display">{empName}</div>
                          <div className="text-[11px] font-mono font-bold text-muted">{empCode}</div>
                        </td>
                        <td className="py-3 px-4 text-fg font-medium">{deptName}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="font-black text-fg">
                            {record.actualWorkingDays ?? record.attendanceBreakdown?.actualWorkingDays ?? 0}
                          </span>
                          <span className="text-muted">
                            /{record.standardWorkingDays ?? record.attendanceBreakdown?.standardWorkingDays ?? 22}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-fg">
                          {formatVND(record.grossIncome ?? record.incomeBreakdown?.grossIncome ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          -{formatVND(record.totalInsuranceEmployee ?? record.insuranceBreakdown?.employee?.total ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-muted">
                          {formatVND(record.personalIncomeTax ?? record.taxBreakdown?.pitAmount ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-fg text-sm">
                          {formatVND(record.netSalary)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewPayslip(record)}
                            className="px-3 py-1.5 rounded-xl bg-lime text-ink text-xs font-black border-2 border-line shadow-hard-xs flex items-center gap-1.5 ml-auto transition hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer uppercase tracking-wider"
                          >
                            <Eye className="w-3.5 h-3.5 text-ink" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PHIẾU LƯƠNG CỦA CHÍNH MÌNH (TÁCH BIỆT 2 KHỐI THEO HIẾN PHÁP GEMINI.MD) */}
      {viewMode === 'self' && (
        <div className="rounded-3xl bg-surface border-2 border-line p-6 sm:p-8 shadow-hard-lg space-y-6 text-fg">
          {loading ? (
            <div className="py-16 text-center text-muted flex flex-col items-center justify-center gap-2 font-bold">
              <RefreshCw className="w-6 h-6 animate-spin text-accent" />
              <span>Đang tải phiếu lương của bạn...</span>
            </div>
          ) : !myPayslip ? (
            <div className="py-16 text-center text-muted">
              <FileText className="w-10 h-10 mx-auto text-muted mb-2" />
              <p className="text-base font-black text-fg font-display">Chưa có phiếu lương cho kỳ này</p>
              <p className="text-xs text-muted mt-1 font-medium">
                Kỳ lương đang mở hoặc HR chưa chạy tính toán phiếu lương cá nhân.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-line pb-5">
                <div>
                  <h3 className="text-lg font-black text-fg font-display">
                    Phiếu Lương Kỳ {formatPeriodVN(myPayslip.period)}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 font-medium">
                    Họ và tên: <strong className="text-fg font-black">{(myPayslip.userId as any)?.fullName}</strong> ({(myPayslip.userId as any)?.employeeCode})
                  </p>
                </div>

                <button
                  onClick={() => handleViewPayslip(myPayslip)}
                  className="px-5 py-2.5 rounded-xl bg-lime text-ink text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-ink" />
                  <span>Xem Chi Tiết Thuế &amp; BHXH</span>
                </button>
              </div>

              {/* KHỐI 1: THỰC NHẬN (NET) */}
              <div className="p-6 rounded-2xl bg-surface-2 border-2 border-line shadow-hard space-y-4">
                <div className="flex items-center justify-between border-b-2 border-line pb-3">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2 font-display">
                    <DollarSign className="w-4 h-4 text-accent" />
                    Khối Thực Nhận (Net Salary)
                  </span>
                  <span className="text-xs text-muted font-bold">Gross - BH (10.5%) - Thuế TNCN</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                    <span className="text-[11px] text-muted font-bold">Tổng thu nhập (Gross)</span>
                    <p className="text-base font-black font-mono text-fg mt-1">
                      {formatVND(myPayslip.grossIncome ?? myPayslip.incomeBreakdown?.grossIncome ?? 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                    <span className="text-[11px] text-muted font-bold">Bảo hiểm khấu trừ (10.5%)</span>
                    <p className="text-base font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                      -{formatVND(myPayslip.totalInsuranceEmployee ?? myPayslip.insuranceBreakdown?.employee?.total ?? 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border-2 border-line shadow-hard-xs">
                    <span className="text-[11px] text-muted font-bold">Thuế TNCN tạm tính</span>
                    <p className="text-base font-black font-mono text-muted mt-1">
                      -{formatVND(myPayslip.personalIncomeTax ?? myPayslip.taxBreakdown?.pitAmount ?? 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-lime/30 border-2 border-line shadow-hard-xs">
                    <span className="text-[11px] text-ink font-black">Thực nhận về tài khoản</span>
                    <p className="text-lg font-black font-mono text-ink mt-1">
                      {formatVND(myPayslip.netSalary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THÔNG TIN THAM CHIẾU TÍNH THUẾ TNCN (KHÔNG TRỪ VÀO LƯƠNG) */}
              <div className="p-6 rounded-2xl bg-surface border-2 border-line shadow-hard space-y-4">
                <div className="flex items-center justify-between border-b-2 border-line pb-3">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2 font-display">
                    <Info className="w-4 h-4 text-accent" />
                    Khối Tham Chiếu Tính Thuế TNCN (Chỉ Để Giải Trình, Tuyệt Đối Không Trừ Vào Tiền Lương)
                  </span>
                  <span className="text-[11px] text-muted font-mono font-bold">NQ 110/2025/UBTVQH15</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                  <div className="p-4 rounded-xl bg-surface-2 border-2 border-line shadow-hard-xs">
                    <span className="text-muted font-bold block">Giảm trừ gia cảnh bản thân:</span>
                    <span className="text-sm font-black font-mono text-fg mt-1 block">
                      {formatVND(myPayslip.personalDeductionAmount ?? (myPayslip as any).taxBreakdown?.deductions?.personal ?? 15500000)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-2 border-2 border-line shadow-hard-xs">
                    <span className="text-muted font-bold block">Giảm trừ người phụ thuộc:</span>
                    <span className="text-sm font-black font-mono text-fg mt-1 block">
                      {formatVND(myPayslip.dependentDeductionAmount ?? myPayslip.taxBreakdown?.deductions?.dependents ?? 0)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-2 border-2 border-line shadow-hard-xs">
                    <span className="text-muted font-bold block">Thu nhập tính thuế:</span>
                    <span className="text-sm font-black font-mono text-fg mt-1 block">
                      {formatVND(myPayslip.assessableIncome ?? myPayslip.taxBreakdown?.assessableIncome ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal chi tiết phiếu lương */}
      {isModalOpen && selectedPayroll && (
        <PayslipModal
          record={selectedPayroll}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Modal xác nhận KHÓA kỳ lương */}
      {confirmLockOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-hard-lg space-y-4 text-fg">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border-2 border-line flex items-center justify-center text-rose-600 shadow-hard">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-fg font-display">Khóa Nguyên Tử Kỳ Lương?</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Khi kỳ lương <strong>{formatPeriodVN(period)}</strong> được khóa, toàn bộ số liệu công, OT, bảo hiểm và tiền lương của {safePayrolls.length} nhân sự sẽ đóng băng bất biến.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-line">
              <button
                onClick={() => setConfirmLockOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg text-xs font-bold transition cursor-pointer shadow-hard"
              >
                Hủy
              </button>
              <button
                onClick={handleLockPayroll}
                disabled={locking}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{locking ? 'Đang khóa...' : 'Xác Nhận Khóa'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal xác nhận MỞ KHÓA kỳ lương */}
      {confirmUnlockOpen && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-surface border-2 border-line rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-hard-lg space-y-4 text-fg">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-ink border-2 border-line flex items-center justify-center shadow-hard">
              <Unlock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-fg font-display">Mở Khóa Kỳ Lương {formatPeriodVN(period)}?</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Thao tác này dành riêng cho <strong>Ban Giám Đốc (CEO)</strong> và <strong>Trưởng phòng HR</strong> để cho phép tính toán lại hoặc điều chỉnh số liệu lương. Mọi thao tác mở khóa sẽ được ghi lại vào nhật ký kiểm toán (AuditLog).
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-fg">Lý do mở khóa kỳ lương:</label>
              <input
                type="text"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Ví dụ: Điều chỉnh ngày công hoặc giờ OT phát sinh..."
                className="w-full mt-1 px-3.5 py-2 rounded-xl border-2 border-line bg-surface-2 text-fg text-xs font-medium focus:outline-none focus:border-accent shadow-hard"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-line">
              <button
                onClick={() => setConfirmUnlockOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-line hover:bg-surface-2 text-fg text-xs font-bold transition cursor-pointer shadow-hard"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlockPayroll}
                disabled={unlocking}
                className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink text-xs font-black border-2 border-line shadow-hard uppercase tracking-wider transition hover:translate-x-0.5 hover:translate-y-0.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{unlocking ? 'Đang mở khóa...' : 'Xác Nhận Mở Khóa'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PayrollPage;
