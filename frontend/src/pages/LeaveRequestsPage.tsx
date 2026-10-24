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
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-400" />
            Quản Lý Đơn Từ & Phê Duyệt 2 Cấp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình nộp đơn nghỉ phép, OT, WFH, giải trình công theo luồng duyệt cố định (Manager → HR) và trừ phép nguyên tử.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Mới</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng số đơn</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Toàn bộ hồ sơ trong phạm vi</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Chờ Quản lý duyệt</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Đang ở Cấp 1 (Chờ Manager)</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cyan-400 font-medium">Chờ HR phê duyệt</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{managerApprovedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Đã qua Cấp 1 → Chờ Cấp 2</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Đã phê duyệt</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{hrApprovedCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Đã chốt & trừ số dư phép</p>
        </div>
      </div>

      {/* Main Filter & Data Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Navigation Tabs (Scopes) */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <button
              onClick={() => { setScope('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                scope === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất Cả Đơn
            </button>
            <button
              onClick={() => { setScope('my'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                scope === 'my'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đơn Của Tôi
            </button>
            {isManagerOrAbove && (
              <button
                onClick={() => { setScope('team'); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scope === 'team'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đơn Cấp Dưới (Team)
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => fetchRequests()}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/50 flex flex-wrap items-center gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên nhân viên, mã NV hoặc lý do..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type Select */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
              className="text-slate-400 hover:text-indigo-400 underline transition-colors"
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
              <tr className="border-b border-slate-800 bg-slate-800/30 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nhân Viên Nộp Đơn</th>
                <th className="py-3 px-4">Loại Đơn</th>
                <th className="py-3 px-4">Khoảng Thời Gian</th>
                <th className="py-3 px-4">Thời Lượng</th>
                <th className="py-3 px-4">Lý Do</th>
                <th className="py-3 px-4">Trạng Thái 2 Cấp</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Đang tải danh sách đơn từ...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-medium text-slate-400">Không có đơn từ nào phù hợp</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Bấm "Tạo Đơn Mới" để gửi đề xuất nghỉ phép hoặc giải trình chấm công.
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
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Nhân viên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {req.userId?.avatarUrl ? (
                              <img
                                src={req.userId.avatarUrl}
                                alt={req.userId.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {req.userId?.fullName || 'Nhân viên'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
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
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(req.startDate).toLocaleDateString('vi-VN')}</span>
                          {req.startDate !== req.endDate && (
                            <>
                              <span className="text-slate-600">→</span>
                              <span>{new Date(req.endDate).toLocaleDateString('vi-VN')}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Thời lượng */}
                      <td className="py-3 px-4">
                        {req.type === 'OT' ? (
                          <span className="font-bold text-amber-400">{req.otHoursRequested}h OT</span>
                        ) : (
                          <span className="font-bold text-indigo-400">{req.durationDays} ngày</span>
                        )}
                      </td>

                      {/* Lý do */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="truncate text-slate-400" title={req.reason}>
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canApprove && (
                            <button
                              onClick={() => handleOpenApproval(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-all"
                              title="Xét duyệt đơn này"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Xét Duyệt</span>
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
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Trang {page} / {totalPages} (Tổng {totalCount} đơn)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 transition-colors"
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
