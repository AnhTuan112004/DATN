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
  DollarSign,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  Eye,
  Info,
} from 'lucide-react';

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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Math.round(amount || 0));
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
        setError(`Chưa có phiếu lương cho kỳ ${period}`);
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
      setSuccessMessage(
        `Đã tính toán thành công bảng lương cho ${res.data.length} nhân sự!`
      );
      setPayrolls(res.data);
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
        `Đã khóa thành công kỳ lương ${period} cho ${res.data.lockedCount} bản ghi!`
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

  // Xem chi tiết phiếu lương nhân viên (mở modal)
  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setIsModalOpen(true);
  };

  // Kiểm tra kỳ đã khóa chưa
  const isPeriodLocked = payrolls.some((p) => p.periodLockedAt !== null);
  const lockedAtDate = payrolls.find((p) => p.periodLockedAt)?.periodLockedAt;

  // Tính KPI tổng quan
  const totalEmployees = payrolls.length;
  const totalGross = payrolls.reduce(
    (sum, p) => sum + (p.incomeBreakdown?.grossIncome || 0),
    0
  );
  const totalNet = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const totalEmployeeInsurance = payrolls.reduce(
    (sum, p) => sum + (p.insuranceBreakdown?.employee?.total || 0),
    0
  );
  const totalEmployerInsurance = payrolls.reduce(
    (sum, p) => sum + (p.insuranceBreakdown?.employer?.total || 0),
    0
  );
  const totalPit = payrolls.reduce(
    (sum, p) => sum + (p.taxBreakdown?.pitAmount || 0),
    0
  );

  // Lọc tìm kiếm nhân sự
  const filteredPayrolls = payrolls.filter((p) => {
    const name = typeof p.userId === 'object' ? p.userId.fullName : '';
    const email = typeof p.userId === 'object' ? p.userId.email : '';
    const code =
      typeof p.userId === 'object' ? p.userId.employeeCode || '' : '';
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      code.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Phân Hệ Tính Lương Chuẩn Pháp Lý 2026
              </h1>
              <p className="text-xs text-slate-500">
                Luật Thuế TNCN mới 2026 (NQ 110/2025/UBTVQH15) • Nghị định 253/2026/NĐ-CP • Điều 98 BLLĐ
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Chọn kỳ & Nút chuyển chế độ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-sm">
            <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
            <span className="text-xs font-semibold text-slate-600">Kỳ lương:</span>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {isManagerOrAdmin && (
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('company')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'company'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toàn Công Ty
              </button>
              <button
                type="button"
                onClick={() => setViewMode('self')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'self'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phiếu Lương Của Tôi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="flex-1 font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* CHẾ ĐỘ 1: TOÀN CÔNG TY (DÀNH CHO CEO & HR MANAGER) */}
      {viewMode === 'company' && isManagerOrAdmin && (
        <div className="space-y-6">
          {/* Action Bar & Trạng Thái Khóa Kỳ */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isPeriodLocked ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Kỳ lương {period} đã khóa vào {new Date(lockedAtDate!).toLocaleDateString('vi-VN')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                  <Unlock className="w-4 h-4 text-amber-600" />
                  <span>Kỳ lương {period} đang mở (Chưa khóa số)</span>
                </div>
              )}
              <span className="text-xs text-slate-400">
                {payrolls.length} nhân sự trong kỳ
              </span>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={fetchCompanyPayrolls}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                title="Tải lại dữ liệu"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {!isPeriodLocked && (
                <>
                  <button
                    type="button"
                    onClick={handleCalculatePayroll}
                    disabled={calculating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {calculating ? 'Đang Tính Lương...' : 'Chạy Tính Lương Toàn Bộ'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmLockOpen(true)}
                    disabled={locking || payrolls.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    Khóa Kỳ Lương
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 4 Thẻ KPI Tổng Hợp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Tổng Quỹ Lương Gross</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatVND(totalGross)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Thu nhập trước bảo hiểm & thuế ({totalEmployees} nhân sự)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Lương Thực Nhận (Net)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {formatVND(totalNet)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Tổng số tiền chi trả thực tế vào tài khoản NV
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Bảo Hiểm Bắt Buộc (32%)</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatVND(totalEmployeeInsurance + totalEmployerInsurance)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                NLĐ: {formatVND(totalEmployeeInsurance)} • NSDLĐ: {formatVND(totalEmployerInsurance)}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Thuế TNCN Khấu Trừ</span>
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatVND(totalPit)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Theo Biểu lũy tiến 5 bậc 2026 mới
              </span>
            </div>
          </div>

          {/* Bảng Danh Sách Bảng Lương Nhân Viên */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Danh Sách Phiếu Lương Nhân Sự ({filteredPayrolls.length}/{payrolls.length})
                </h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, mã NV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                Đang tải bảng lương...
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Calculator className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium">Chưa có bảng lương cho kỳ {period}</p>
                {!isPeriodLocked && (
                  <button
                    onClick={handleCalculatePayroll}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Bấm vào đây để tính lương kỳ này
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Nhân sự</th>
                      <th className="py-3 px-3">Phòng ban</th>
                      <th className="py-3 px-3 text-center">Công TT/Chuẩn</th>
                      <th className="py-3 px-3 text-right">Lương Gross</th>
                      <th className="py-3 px-3 text-right">BH (10.5%)</th>
                      <th className="py-3 px-3 text-right">Thuế TNCN</th>
                      <th className="py-3 px-3 text-right font-black text-emerald-800">Lương Net</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        typeof record.userId.departmentId === 'object'
                          ? record.userId.departmentId?.name
                          : '—';

                      return (
                        <tr
                          key={record._id}
                          className="hover:bg-slate-50/80 transition"
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block text-sm">
                              {empName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {empCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{deptName}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-slate-800">
                              {record.attendanceBreakdown?.actualWorkingDays || 0}
                            </span>
                            <span className="text-slate-400">
                              /{record.attendanceBreakdown?.standardWorkingDays || 0}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-slate-900">
                            {formatVND(record.incomeBreakdown?.grossIncome || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-rose-600">
                            -{formatVND(record.insuranceBreakdown?.employee?.total || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-rose-600">
                            -{formatVND(record.taxBreakdown?.pitAmount || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700 text-sm">
                            {formatVND(record.netSalary || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleViewPayslip(record)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem Chi Tiết
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

      {/* CHẾ ĐỘ 2: PHIẾU LƯƠNG CỦA TÔI (CHO TẤT CẢ VAI TRÒ) */}
      {(viewMode === 'self' || !isManagerOrAdmin) && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Đang tải phiếu lương của bạn...
            </div>
          ) : !myPayslip ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">
                Không tìm thấy phiếu lương kỳ {period}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bảng lương cho kỳ này chưa được phòng Nhân sự tính toán hoặc phát hành. Vui lòng liên hệ HR hoặc quay lại sau.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card thông tin tóm tắt Net */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 block">
                    Phiếu Lương Cá Nhân Kỳ {period}
                  </span>
                  <h2 className="text-3xl font-black tracking-tight mt-1">
                    {formatVND(myPayslip.netSalary)}
                  </h2>
                  <p className="text-xs text-emerald-100 mt-1">
                    Lương thực nhận chuyển khoản sau khi trừ bảo hiểm và thuế TNCN
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewPayslip(myPayslip)}
                    className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:bg-emerald-50 transition flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Mở Chi Tiết Đầy Đủ
                  </button>
                </div>
              </div>

              {/* Nhúng trực tiếp bản xem nhanh 2 khối Phương án A */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-lg">
                      Bảng Kê Chi Tiết Thu Nhập & Giảm Trừ
                    </h3>
                  </div>
                  {myPayslip.periodLockedAt ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <Lock className="w-3.5 h-3.5" /> Đã Khóa Kỳ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Unlock className="w-3.5 h-3.5" /> Tạm Tính
                    </span>
                  )}
                </div>

                {/* 2 Khối chuẩn */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Khối Thực nhận */}
                  <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3 text-sm">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" /> 1. Khối Thực Nhận (Net)
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Tổng thu nhập Gross:</span>
                        <span>{formatVND(myPayslip.incomeBreakdown?.grossIncome || 0)}</span>
                      </div>
                      <div className="pl-3 space-y-1 text-slate-500 text-[11px]">
                        <div className="flex justify-between">
                          <span>• Lương theo công ({myPayslip.attendanceBreakdown?.actualWorkingDays || 0} ngày):</span>
                          <span>{formatVND(myPayslip.incomeBreakdown?.proratedBaseSalary || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Phụ cấp ăn ca:</span>
                          <span>{formatVND(myPayslip.incomeBreakdown?.allowances?.meal || 0)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>• Tiền OT miễn thuế Điều 98:</span>
                          <span>{formatVND(myPayslip.incomeBreakdown?.otPay?.exempt || 0)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between font-semibold text-rose-700 pt-2 border-t border-slate-200">
                        <span>Trừ BH bắt buộc (10.5%):</span>
                        <span>-{formatVND(myPayslip.insuranceBreakdown?.employee?.total || 0)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-rose-700">
                        <span>Trừ Thuế TNCN:</span>
                        <span>-{formatVND(myPayslip.taxBreakdown?.pitAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-emerald-800 pt-2 border-t border-emerald-200">
                        <span>Thực nhận (Net):</span>
                        <span>{formatVND(myPayslip.netSalary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Khối Giải trình Thuế */}
                  <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3 text-sm">
                    <h4 className="font-bold text-amber-950 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600" /> 2. Khối Tham Chiếu Thuế TNCN
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Khoản giảm trừ gia cảnh (15.5M bản thân + 6.2M phụ thuộc) chỉ dùng để trừ vào thu nhập tính thuế, KHÔNG BỊ TRỪ VÀO LƯƠNG.
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Thu nhập chịu thuế:</span>
                        <span className="font-semibold text-slate-800">
                          {formatVND(myPayslip.taxBreakdown?.taxableIncome || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>- Giảm trừ bản thân:</span>
                        <span>{formatVND(myPayslip.taxBreakdown?.deductions?.personal || 15500000)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>- Giảm trừ phụ thuộc ({myPayslip.taxBreakdown?.deductions?.dependentCount || 0} người):</span>
                        <span>{formatVND(myPayslip.taxBreakdown?.deductions?.dependents || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>- Giảm trừ bảo hiểm:</span>
                        <span>{formatVND(myPayslip.taxBreakdown?.deductions?.insurance || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                        <span>Thu nhập tính thuế:</span>
                        <span className="text-indigo-700">{formatVND(myPayslip.taxBreakdown?.assessableIncome || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-rose-700">
                        <span>Thuế TNCN phải nộp (Biểu 5 bậc):</span>
                        <span>{formatVND(myPayslip.taxBreakdown?.pitAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận khóa kỳ lương */}
      {confirmLockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Xác Nhận Khóa Kỳ Lương {period}?
                </h3>
                <p className="text-xs text-slate-500">
                  Thao tác mang tính pháp lý nguyên tử
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
              Cảnh báo: Sau khi khóa, hệ thống sẽ:
              <br />• Đánh dấu <span className="font-mono font-bold text-rose-700">periodLockedAt</span> và đóng băng toàn bộ số liệu lương.
              <br />• Tuyệt đối chặn sửa đổi bảng lương hoặc tính lại kỳ này.
              <br />• Chặn chỉnh sửa dữ liệu nguồn (chấm công, OT, đơn từ) của kỳ đã khóa.
              <br />• Tự động gửi thông báo thời gian thực đến toàn bộ nhân viên.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLockOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleLockPayroll}
                disabled={locking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                {locking ? 'Đang Khóa...' : 'Đồng Ý Khóa Kỳ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payroll={selectedPayroll}
      />
    </div>
  );
};

export default PayrollPage;
