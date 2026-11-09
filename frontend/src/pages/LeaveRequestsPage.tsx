import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../api/leave';
import { LeaveRequest, LeaveRequestFilterParams } from '../types/leave';
import { LeaveStatusBadge } from '../components/leave/LeaveStatusBadge';
import { LeaveTypeBadge } from '../components/leave/LeaveTypeBadge';
import { CreateLeaveModal } from '../components/leave/CreateLeaveModal';
import { LeaveApprovalModal } from '../components/leave/LeaveApprovalModal';
import { LeaveDetailModal } from '../components/leave/LeaveDetailModal';
import { UnderlineTabs, TabItem } from '../components/common/UnderlineTabs';
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

  const isHRorCEO = user?.role === 'HR_MANAGER' || user?.role === 'CEO';
  const isManager = user?.role === 'MANAGER';

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

  const tabItems: TabItem<string>[] = useMemo(() => {
    const items: TabItem<string>[] = [];
    if (isHRorCEO) {
      items.push({
        id: 'stage2',
        label: 'Cần duyệt Cấp 2',
        count: managerApprovedCount > 0 ? managerApprovedCount : undefined,
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
      });
      items.push({
        id: 'all',
        label: 'Toàn bộ đơn',
      });
    }
    if (isManager) {
      items.push({
        id: 'pending_stage1',
        label: 'Cần duyệt Cấp 1',
        count: pendingCount > 0 ? pendingCount : undefined,
        icon: <Clock className="w-3.5 h-3.5" />,
      });
      items.push({
        id: 'team',
        label: 'Đơn phòng ban',
      });
    }
    items.push({
      id: 'my',
      label: 'Đơn của tôi',
    });
    return items;
  }, [isHRorCEO, isManager, managerApprovedCount, pendingCount]);

  const handleOpenApproval = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setApprovalModalOpen(true);
  };

  const handleOpenDetail = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-14 font-sans select-none animate-fadeIn text-fg">
      {/* 1. Header & KPI Bento */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 pb-2 border-b-2 border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-muted bg-surface-2 border border-line px-2 py-0.5 rounded uppercase tracking-wider">
              Luồng Phê Duyệt 2 Cấp (Manager → HR)
            </span>
            <span className="text-muted">·</span>
            <span className="text-xs text-muted font-medium">Tổng số {totalCount} đơn</span>
          </div>
          <h1 className="text-2xl sm:text-[1.75rem] font-bold text-fg leading-tight font-display">
            Quản Lý Đơn Từ & Phê Duyệt
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            Theo dõi, gửi đơn nghỉ phép năm, nghỉ ốm hưởng BHXH, làm thêm giờ (OT) và giải trình quên chấm công theo Luật Lao động.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-lime text-ink border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-ink" strokeWidth={2.5} />
          <span>Tạo Đơn Mới</span>
        </button>
      </div>

      {/* Bento Approval Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Dominant Pending Approval Card */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-surface border-2 border-line shadow-hard flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-fg flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Đơn chờ phê duyệt</span>
            </span>
            <span className="text-[11px] font-mono text-muted">
              Tổng chờ: <strong className="text-fg font-bold">{pendingCount + managerApprovedCount}</strong> đơn
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-line/30">
            <div>
              <span className="text-[11px] text-muted block font-medium">Cần duyệt Cấp 1 (Trưởng phòng)</span>
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                {pendingCount}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted block font-medium">Cần duyệt Cấp 2 (HR / CEO)</span>
              <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5 block">
                {managerApprovedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Completed Card */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-surface border-2 border-line shadow-hard flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-fg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Đã hoàn tất phê duyệt</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 border border-line text-emerald-600 dark:text-emerald-400">Hợp lệ</span>
          </div>
          <div className="mt-3 pt-3 border-t border-line/30 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                {hrApprovedCount}
              </span>
              <span className="text-[11px] text-muted">Đơn đã chốt công/phép</span>
            </div>
            <span className="text-xs text-muted font-mono">
              Hiển thị: {filteredRequests.length}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Filter & Data Section */}
      <div className="rounded-2xl bg-surface border-2 border-line p-4 shadow-hard space-y-3.5">
        {/* Navigation Tabs (Scopes) */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-line pb-1">
          <UnderlineTabs tabs={tabItems} activeTab={scope} onChange={(s) => { setScope(s); setPage(1); }} />

          <button
            onClick={() => fetchRequests()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-fg transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0 shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã NV hoặc lý do..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-line text-fg placeholder:text-muted text-xs focus:outline-none focus:border-primary transition font-medium"
            />
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted shrink-0" />
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-fg text-xs focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-fg text-xs focus:outline-none focus:border-primary cursor-pointer font-medium"
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
              const currentUserId = user?._id?.toString() || (user as any)?.id?.toString();
              const applicantId = req.userId?._id?.toString() || (req.userId as any)?.toString();
              const isApplicant = Boolean(currentUserId && applicantId && currentUserId === applicantId);

              const canApproveStage1 = req.status === 'PENDING' && user?.role === 'MANAGER' && !isApplicant;
              const canApproveStage2 = req.status === 'MANAGER_APPROVED' && (user?.role === 'HR_MANAGER' || user?.role === 'CEO') && !isApplicant;
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
                          className={`px-3 py-1 rounded-lg font-semibold text-[11px] cursor-pointer ${canApproveStage1 ? 'bg-amber-600 text-white' : 'bg-teal-700 text-white'
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
                  const currentUserId = user?._id?.toString() || (user as any)?.id?.toString();
                  const applicantId = req.userId?._id?.toString() || (req.userId as any)?.toString();
                  const isApplicant = Boolean(currentUserId && applicantId && currentUserId === applicantId);

                  const canApproveStage1 =
                    req.status === 'PENDING' &&
                    user?.role === 'MANAGER' &&
                    !isApplicant;

                  const canApproveStage2 =
                    req.status === 'MANAGER_APPROVED' &&
                    (user?.role === 'HR_MANAGER' || user?.role === 'CEO') &&
                    !isApplicant;

                  const canApprove = canApproveStage1 || canApproveStage2;

                  const statusBorderColor =
                    req.status === 'HR_APPROVED'
                      ? 'border-l-emerald-500'
                      : req.status === 'REJECTED'
                        ? 'border-l-rose-500'
                        : req.status === 'MANAGER_APPROVED'
                          ? 'border-l-sky-500'
                          : req.status === 'CANCELLED'
                            ? 'border-l-slate-600'
                            : 'border-l-amber-500';

                  return (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition">
                      <td className={`py-3 px-4 border-l-2 ${statusBorderColor}`}>
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
                              className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition flex items-center gap-1 shadow-xs cursor-pointer ${canApproveStage1
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
                            aria-label="Xem chi tiết đơn từ"
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
