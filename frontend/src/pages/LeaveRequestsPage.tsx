import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../api/leave';
import { LeaveRequest, LeaveRequestFilterParams } from '../types/leave';
import { LeaveStatusBadge } from '../components/leave/LeaveStatusBadge';
import { LeaveTypeBadge } from '../components/leave/LeaveTypeBadge';
import { CreateLeaveModal } from '../components/leave/CreateLeaveModal';
import { LeaveApprovalModal } from '../components/leave/LeaveApprovalModal';
import { LeaveDetailModal } from '../components/leave/LeaveDetailModal';
import {
  FileText,
  Plus,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Eye,
  CheckSquare,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const LeaveRequestsPage: React.FC = () => {
  const { user } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  // Mặc định tab theo vai trò:
  // - CEO & HR: Mở tab 'stage2' (Cần duyệt Cấp 2 - Đơn đã qua Trưởng phòng duyệt)
  // - Trưởng phòng: Mở tab 'pending_stage1' (Cần Trưởng phòng duyệt Cấp 1)
  // - Nhân viên: Mở tab 'my' (Đơn của tôi)
  const defaultScope =
    user?.role === 'HR_MANAGER' || user?.role === 'CEO'
      ? 'stage2'
      : user?.role === 'MANAGER'
      ? 'pending_stage1'
      : 'my';

  const [scope, setScope] = useState<string>(defaultScope);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: LeaveRequestFilterParams = {
        page,
        limit: 15,
        scope,
        type: selectedType || undefined,
        status: selectedStatus || undefined,
      };

      const res = await leaveApi.getLeaveRequests(params);
      setRequests(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      setError(
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Không thể tải danh sách đơn từ. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, scope, selectedType, selectedStatus]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Client-side search filter by applicant name or code
  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = req.userId?.fullName?.toLowerCase().includes(q);
    const codeMatch = req.userId?.employeeCode?.toLowerCase().includes(q);
    const reasonMatch = req.reason?.toLowerCase().includes(q);
    return nameMatch || codeMatch || reasonMatch;
  });

  // KPI Counts
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const managerApprovedCount = requests.filter((r) => r.status === 'MANAGER_APPROVED').length;
  const hrApprovedCount = requests.filter((r) => r.status === 'HR_APPROVED').length;

  const handleOpenApproval = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setApprovalModalOpen(true);
  };

  const handleOpenDetail = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-white">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-1 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-teal-400 tracking-wider uppercase">
              Luồng Phê Duyệt 2 Cấp (Manager → HR)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Tổng số {totalCount} đơn</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-white leading-tight">
            Quản Lý Đơn Từ & Phê Duyệt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Theo dõi, gửi đơn nghỉ phép năm, nghỉ ốm hưởng BHXH, làm thêm giờ (OT) và giải trình quên chấm công theo Luật Lao động.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Mới</span>
        </button>
      </div>

      {/* 3 KPI Approval Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-800/40 transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-400 font-medium block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Chờ Trưởng phòng duyệt (Cấp 1)
            </span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">
              {pendingCount} <span className="text-xs text-slate-400 font-normal">đơn</span>
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/40 font-medium">
            CẤP 1
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-800/40 transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-indigo-400 font-medium block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Chờ HR / CEO duyệt (Cấp 2)
            </span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">
              {managerApprovedCount} <span className="text-xs text-slate-400 font-normal">đơn</span>
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 font-medium">
            CẤP 2
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-800/40 transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-medium block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất phê duyệt
            </span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">
              {hrApprovedCount} <span className="text-xs text-slate-400 font-normal">đơn</span>
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium">
            HOÀN TẤT
          </span>
        </div>
      </div>

      {/* 2. Main Filter & Data Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm space-y-3.5">
        {/* Navigation Tabs (Scopes) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {/* Tab dành cho HR Manager & CEO */}
            {(user?.role === 'HR_MANAGER' || user?.role === 'CEO') && (
              <>
                <button
                  onClick={() => { setScope('stage2'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    scope === 'stage2'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cần duyệt Cấp 2</span>
                  {managerApprovedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-300 text-slate-950 text-[10px] font-bold">
                      {managerApprovedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setScope('all'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Toàn bộ đơn
                </button>
              </>
            )}

            {/* Tab dành cho Trưởng phòng (MANAGER) */}
            {user?.role === 'MANAGER' && (
              <>
                <button
                  onClick={() => { setScope('pending_stage1'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    scope === 'pending_stage1'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Cần duyệt Cấp 1</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setScope('team'); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                    scope === 'team'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Đơn phòng ban
                </button>
              </>
            )}

            {/* Tab Đơn cá nhân */}
            <button
              onClick={() => { setScope('my'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                scope === 'my'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đơn của tôi
            </button>
          </div>

          <button
            onClick={() => fetchRequests()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã NV hoặc lý do..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Tất cả loại đơn</option>
              <option value="ANNUAL">Nghỉ phép năm (ANNUAL)</option>
              <option value="SICK">Nghỉ ốm (SICK)</option>
              <option value="OT">Làm thêm giờ (OT)</option>
              <option value="WFH">Làm từ xa (WFH)</option>
              <option value="FORGOT_CHECKIN">Giải trình quên công</option>
              <option value="CUSTOM">Đơn tự do / Văn bản (CUSTOM)</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ Quản lý duyệt (Cấp 1)</option>
              <option value="MANAGER_APPROVED">Chờ HR duyệt (Cấp 2)</option>
              <option value="HR_APPROVED">Đã phê duyệt (Xong)</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile View: Stacked Cards (Visible on sm:hidden) */}
        <div className="space-y-3 sm:hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-teal-400 mx-auto mb-2" />
              <span>Đang tải danh sách đơn từ...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-950/70 rounded-xl border border-slate-800">
              <FileText className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-white">Không có đơn từ nào</p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isApplicant = req.userId?._id?.toString() === user?._id?.toString();
              const canApproveStage1 = req.status === 'PENDING' && user?.role === 'MANAGER' && !isApplicant;
              const canApproveStage2 = req.status === 'MANAGER_APPROVED' && (user?.role === 'HR_MANAGER' || user?.role === 'CEO') && !(isApplicant && user?.role !== 'CEO');
              const canApprove = canApproveStage1 || canApproveStage2;

              return (
                <div key={req._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-white text-xs">{req.userId?.fullName || 'Không xác định'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{req.userId?.employeeCode}</div>
                    </div>
                    <LeaveStatusBadge status={req.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <LeaveTypeBadge type={req.type} />
                    <span className="font-mono text-[11px] text-slate-300">
                      {req.type === 'OT' && req.otHoursRequested ? `${req.otHoursRequested}h` : `${req.durationDays || 1} ngày`}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 italic">&quot;{req.reason}&quot;</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(req.startDate).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-2">
                      {canApprove && (
                        <button
                          onClick={() => handleOpenApproval(req)}
                          className={`px-3 py-1 rounded-lg font-semibold text-[11px] cursor-pointer ${
                            canApproveStage1 ? 'bg-amber-600 text-white' : 'bg-teal-700 text-white'
                          }`}
                        >
                          {canApproveStage1 ? 'Duyệt C1' : 'Duyệt C2'}
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDetail(req)}
                        className="px-2.5 py-1 text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Data Table (Hidden on Mobile) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-medium tracking-wide bg-slate-950">
              <tr>
                <th className="py-2.5 px-4">Nhân viên</th>
                <th className="py-2.5 px-4">Loại đơn</th>
                <th className="py-2.5 px-4">Thời gian</th>
                <th className="py-2.5 px-4">Thời lượng</th>
                <th className="py-2.5 px-4">Lý do</th>
                <th className="py-2.5 px-4">Trạng thái</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                      <span>Đang tải danh sách đơn từ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <FileText className="w-7 h-7 mx-auto text-slate-600 mb-1.5" />
                    <p className="text-xs font-semibold text-white">Không có đơn từ nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bấm &quot;Tạo đơn mới&quot; để gửi đề xuất nghỉ phép hoặc giải trình chấm công.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isApplicant = req.userId?._id?.toString() === user?._id?.toString();

                  const canApproveStage1 =
                    req.status === 'PENDING' &&
                    user?.role === 'MANAGER' &&
                    !isApplicant;

                  const canApproveStage2 =
                    req.status === 'MANAGER_APPROVED' &&
                    (user?.role === 'HR_MANAGER' || user?.role === 'CEO') &&
                    !(isApplicant && user?.role !== 'CEO');

                  const canApprove = canApproveStage1 || canApproveStage2;

                  return (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {req.userId?.fullName || 'Không xác định'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {req.userId?.employeeCode}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <LeaveTypeBadge type={req.type} />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                        {new Date(req.startDate).toLocaleDateString('vi-VN')}
                        {req.startDate !== req.endDate && (
                          <span> → {new Date(req.endDate).toLocaleDateString('vi-VN')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        {req.type === 'OT' && req.otHoursRequested
                          ? `${req.otHoursRequested} giờ`
                          : `${req.durationDays || 1} ngày`}
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate" title={req.reason}>
                        {req.reason || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <LeaveStatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApprove && (
                            <button
                              onClick={() => handleOpenApproval(req)}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer ${
                                canApproveStage1
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                  : 'bg-teal-700 hover:bg-teal-800 text-white'
                              }`}
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>{canApproveStage1 ? 'Duyệt C1' : 'Duyệt C2'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(req)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 gap-3">
          <span>
            Trang {page} / {totalPages || 1} · Tổng số <strong className="text-white">{totalCount}</strong> đơn
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateLeaveModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}

      {approvalModalOpen && selectedRequest && (
        <LeaveApprovalModal
          isOpen={approvalModalOpen}
          onClose={() => setApprovalModalOpen(false)}
          request={selectedRequest}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}

      {detailModalOpen && selectedRequest && (
        <LeaveDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          request={selectedRequest}
          onSuccess={() => {
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default LeaveRequestsPage;
