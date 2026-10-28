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
  UserCheck,
  Calendar,
  Eye,
  CheckSquare,
  AlertCircle,
  User as UserIcon,
  Search,
} from 'lucide-react';

export const LeaveRequestsPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [scope, setScope] = useState<'all' | 'my' | 'team'>('all');
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

  const isManagerOrAbove = hasRole(['MANAGER', 'HR_MANAGER', 'CEO']);

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
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--text)]">
            Quản lý đơn từ & phê duyệt
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tổng cộng {totalCount} đơn từ ({pendingCount} chờ quản lý duyệt, {managerApprovedCount} chờ HR duyệt, {hrApprovedCount} đã phê duyệt)
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="app-button"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn mới</span>
        </button>
      </div>

      {/* Main Filter & Data Section */}
      <div className="app-surface rounded-[var(--radius)] overflow-hidden">
        {/* Navigation Tabs (Scopes) */}
        <div className="p-3 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-0.5 bg-[var(--surface-muted)] rounded-[var(--radius)] border border-[var(--border)]">
            <button
              onClick={() => { setScope('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all ${
                scope === 'all'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Tất cả đơn
            </button>
            <button
              onClick={() => { setScope('my'); setPage(1); }}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all ${
                scope === 'my'
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Đơn của tôi
            </button>
            {isManagerOrAbove && (
              <button
                onClick={() => { setScope('team'); setPage(1); }}
                className={`px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium transition-all ${
                  scope === 'team'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Đơn cấp dưới
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => fetchRequests()}
            disabled={loading}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-muted)] flex flex-wrap items-center gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã NV hoặc lý do..."
              className="w-full app-input text-xs !pl-9 pr-3 py-2"
            />
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="app-input text-xs px-3 py-2"
            >
              <option value="">Tất cả loại đơn</option>
              <option value="ANNUAL">Nghỉ phép năm (ANNUAL)</option>
              <option value="SICK">Nghỉ ốm (SICK)</option>
              <option value="OT">Làm thêm giờ (OT)</option>
              <option value="WFH">Làm từ xa (WFH)</option>
              <option value="FORGOT_CHECKIN">Giải trình quên công</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="app-input text-xs px-3 py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ Quản lý duyệt (Cấp 1)</option>
              <option value="MANAGER_APPROVED">Chờ HR duyệt (Cấp 2)</option>
              <option value="HR_APPROVED">Đã phê duyệt (Xong)</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {(selectedType || selectedStatus || searchQuery) && (
            <button
              onClick={() => {
                setSelectedType('');
                setSelectedStatus('');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] underline transition-colors"
            >
              Đặt lại lọc
            </button>
          )}
        </div>

        {/* Data Table */}
        {error && (
          <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-medium text-xs">
                <th className="py-2.5 px-4 font-medium">Nhân viên</th>
                <th className="py-2.5 px-4 font-medium">Loại đơn</th>
                <th className="py-2.5 px-4 font-medium">Thời gian</th>
                <th className="py-2.5 px-4 font-medium">Thời lượng</th>
                <th className="py-2.5 px-4 font-medium">Lý do</th>
                <th className="py-2.5 px-4 font-medium">Trạng thái</th>
                <th className="py-2.5 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
                      <span>Đang tải danh sách đơn từ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    <FileText className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-2 opacity-50" />
                    <p className="text-xs font-medium text-[var(--text)]">Không có đơn từ nào phù hợp</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Bấm "Tạo đơn mới" để gửi đề xuất nghỉ phép hoặc giải trình chấm công.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const currentUserId = user?._id || '';
                  const applicantId = req.userId?._id || '';
                  const isSelf = currentUserId.toString() === applicantId.toString();

                  // Có thể duyệt nếu đang ở cấp người này có thẩm quyền và không phải tự duyệt
                  const canApprove =
                    ((req.status === 'PENDING' && isManagerOrAbove) ||
                      (req.status === 'MANAGER_APPROVED' && (user?.role === 'HR_MANAGER' || user?.role === 'CEO'))) &&
                    !isSelf;

                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors group"
                    >
                      {/* Nhân viên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] overflow-hidden flex items-center justify-center flex-shrink-0">
                            {req.userId?.avatarUrl ? (
                              <img
                                src={req.userId.avatarUrl}
                                alt={req.userId.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4 text-[var(--text-muted)]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                              {req.userId?.fullName || 'Nhân viên'}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">
                              {req.userId?.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Loại đơn */}
                      <td className="py-3 px-4">
                        <LeaveTypeBadge type={req.type} />
                      </td>

                      {/* Khoảng thời gian */}
                      <td className="py-3 px-4 text-[var(--text)] whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="text-[var(--text)]">{new Date(req.startDate).toLocaleDateString('vi-VN')}</span>
                          {req.startDate !== req.endDate && (
                            <>
                              <span>→</span>
                              <span className="text-[var(--text)]">{new Date(req.endDate).toLocaleDateString('vi-VN')}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Thời lượng */}
                      <td className="py-3 px-4">
                        {req.type === 'OT' ? (
                          <span className="font-semibold text-[var(--warning-text)]">{req.otHoursRequested}h OT</span>
                        ) : (
                          <span className="font-semibold text-[var(--accent)]">{req.durationDays} ngày</span>
                        )}
                      </td>

                      {/* Lý do */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="truncate text-[var(--text-muted)]" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>

                      {/* Trạng thái 2 cấp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <LeaveStatusBadge status={req.status} showStepInfo={true} />
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(req)}
                            className="p-1.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canApprove && (
                            <button
                              onClick={() => handleOpenApproval(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border)] rounded-[var(--radius)] transition-all"
                              title="Xét duyệt đơn này"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Xét duyệt</span>
                            </button>
                          )}
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
        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Trang {page} / {totalPages} (Tổng {totalCount} đơn)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius)] disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius)] disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLeaveModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => fetchRequests()}
      />

      <LeaveApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        request={selectedRequest}
        onSuccess={() => fetchRequests()}
      />

      <LeaveDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        request={selectedRequest}
        onSuccess={() => fetchRequests()}
      />
    </div>
  );
};
