import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { payrollApi } from '../api/payroll';
import { PayrollRecord } from '../types/payroll';
import { PayslipModal } from '../components/payroll/PayslipModal';
import {
  Lock,
  Unlock,
  Play,
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
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-white">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 pb-1 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase">
              Chuẩn Pháp Lý 2026 (NQ 110/2025/UBTVQH15)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Miễn thuế OT theo Điều 98 BLLĐ</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white leading-tight">
            Bảng Lương & Chi Trả Thu Nhập
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Biểu thuế lũy tiến 5 bậc mới (10M - 30M - 60M - 100M), giảm trừ gia cảnh 15.5M/bản thân & 6.2M/phụ thuộc, bảo hiểm trần 2026.
          </p>
        </div>

        {/* Controls: Chọn kỳ & Nút chuyển chế độ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium text-slate-400">Kỳ lương:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-white font-semibold font-mono focus:outline-none cursor-pointer text-xs"
            />
          </div>

          {isManagerOrAdmin && (
            <div className="flex p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('company')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  viewMode === 'company'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Toàn công ty
              </button>
              <button
                type="button"
                onClick={() => setViewMode('self')}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  viewMode === 'self'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Phiếu của tôi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
              isPeriodLocked
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
            }`}
          >
            {isPeriodLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isPeriodLocked
              ? `Đã khóa kỳ (${new Date(lockedAtDate!).toLocaleDateString('vi-VN')})`
              : `Kỳ ${formatPeriodVN(period)} đang mở`}
          </span>

          {isManagerOrAdmin && viewMode === 'company' && (
            <span className="text-xs text-slate-400">
              <strong className="text-white">{safePayrolls.length}</strong> nhân sự · Tổng quỹ thực nhận: <strong className="text-emerald-400 font-mono text-sm">{formatVND(totalNet)}</strong>
            </span>
          )}
        </div>

        {/* Action buttons */}
        {isManagerOrAdmin && viewMode === 'company' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCalculatePayroll}
              disabled={calculating || isPeriodLocked}
              className="px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition active:scale-[0.98] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {calculating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{calculating ? 'Đang tính toán...' : 'Tính Lương Toàn Bộ'}</span>
            </button>

            {!isPeriodLocked && safePayrolls.length > 0 && (
              <button
                onClick={() => setConfirmLockOpen(true)}
                disabled={locking}
                className="px-3.5 py-2 rounded-lg border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa Kỳ Lương</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thông báo Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* VIEW: TOÀN CÔNG TY (BẢNG QUẢN TRỊ HR/CEO) */}
      {isManagerOrAdmin && viewMode === 'company' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên, email, mã nhân viên..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Hiển thị <strong className="text-white">{filteredPayrolls.length}</strong> / {safePayrolls.length} nhân sự</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium tracking-wide bg-slate-950">
                <tr>
                  <th className="py-2.5 px-4">Nhân sự</th>
                  <th className="py-2.5 px-4">Phòng ban</th>
                  <th className="py-2.5 px-4 text-center">Công TT/Chuẩn</th>
                  <th className="py-2.5 px-4 text-right">Lương Gross</th>
                  <th className="py-2.5 px-4 text-right">Bảo hiểm (10.5%)</th>
                  <th className="py-2.5 px-4 text-right">Thuế TNCN</th>
                  <th className="py-2.5 px-4 text-right">Thực nhận (Net)</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                        <span>Đang tải bảng lương kỳ này...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <FileText className="w-7 h-7 mx-auto text-slate-600 mb-1.5" />
                      <p className="text-xs font-semibold text-white">Chưa có dữ liệu bảng lương</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
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
                      <tr key={record._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{empName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{empCode}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{deptName}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="font-semibold text-white">
                            {record.actualWorkingDays ?? record.attendanceBreakdown?.actualWorkingDays ?? 0}
                          </span>
                          <span className="text-slate-500">
                            /{record.standardWorkingDays ?? record.attendanceBreakdown?.standardWorkingDays ?? 22}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-slate-200">
                          {formatVND(record.grossIncome ?? record.incomeBreakdown?.grossIncome ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-300">
                          -{formatVND(record.totalInsuranceEmployee ?? record.insuranceBreakdown?.employee?.total ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-300">
                          {formatVND(record.personalIncomeTax ?? record.taxBreakdown?.pitAmount ?? 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatVND(record.netSalary)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleViewPayslip(record)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 ml-auto transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-400" />
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
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Đang tải phiếu lương của bạn...</span>
            </div>
          ) : !myPayslip ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-base font-bold text-white">Chưa có phiếu lương cho kỳ này</p>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ lương đang mở hoặc HR chưa chạy tính toán phiếu lương cá nhân.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Phiếu Lương Kỳ {formatPeriodVN(myPayslip.period)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Họ và tên: <strong className="text-white">{(myPayslip.userId as any)?.fullName}</strong> ({(myPayslip.userId as any)?.employeeCode})
                  </p>
                </div>

                <button
                  onClick={() => handleViewPayslip(myPayslip)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Chi Tiết Thuế & BHXH</span>
                </button>
              </div>

              {/* KHỐI 1: THỰC NHẬN (NET) */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Khối Thực Nhận (Net Salary)
                  </span>
                  <span className="text-xs text-slate-500">Gross - BH (10.5%) - Thuế TNCN</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Tổng thu nhập (Gross)</span>
                    <p className="text-base font-bold font-mono text-white mt-1">
                      {formatVND(myPayslip.grossIncome ?? myPayslip.incomeBreakdown?.grossIncome ?? 0)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Bảo hiểm khấu trừ (10.5%)</span>
                    <p className="text-base font-bold font-mono text-rose-300 mt-1">
                      -{formatVND(myPayslip.totalInsuranceEmployee ?? myPayslip.insuranceBreakdown?.employee?.total ?? 0)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Thuế TNCN tạm tính</span>
                    <p className="text-base font-bold font-mono text-amber-300 mt-1">
                      -{formatVND(myPayslip.personalIncomeTax ?? myPayslip.taxBreakdown?.pitAmount ?? 0)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50">
                    <span className="text-[11px] text-emerald-300 font-bold">Thực nhận về tài khoản</span>
                    <p className="text-lg font-extrabold font-mono text-emerald-400 mt-1">
                      {formatVND(myPayslip.netSalary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THÔNG TIN THAM CHIẾU TÍNH THUẾ TNCN (KHÔNG TRỪ VÀO LƯƠNG) */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Khối Tham Chiếu Tính Thuế TNCN (Chỉ Để Giải Trình, Tuyệt Đối Không Trừ Vào Tiền Lương)
                  </span>
                  <span className="text-[11px] text-slate-500">NQ 110/2025/UBTVQH15</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Giảm trừ gia cảnh bản thân:</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">
                      {formatVND(myPayslip.personalDeductionAmount ?? (myPayslip as any).taxBreakdown?.deductions?.personal ?? 15500000)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Giảm trừ người phụ thuộc:</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">
                      {formatVND(myPayslip.dependentDeductionAmount ?? myPayslip.taxBreakdown?.deductions?.dependents ?? 0)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Thu nhập tính thuế:</span>
                    <span className="text-sm font-bold font-mono text-indigo-300 mt-1 block">
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

      {/* Modal xác nhận khóa kỳ lương */}
      {confirmLockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold">Khóa Nguyên Tử Kỳ Lương?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Khi kỳ lương <strong>{formatPeriodVN(period)}</strong> được khóa, toàn bộ số liệu công, OT, bảo hiểm và tiền lương của {safePayrolls.length} nhân sự sẽ đóng băng bất biến. Không ai (kể cả CEO) có thể sửa đổi dữ liệu nguồn của kỳ này nữa.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmLockOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleLockPayroll}
                disabled={locking}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{locking ? 'Đang khóa...' : 'Xác Nhận Khóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
