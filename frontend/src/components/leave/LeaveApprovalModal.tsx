import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveApi } from '../../api/leave';
import { LeaveRequest } from '../../types/leave';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { LeaveTypeBadge } from './LeaveTypeBadge';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  onSuccess: () => void;
}

export const LeaveApprovalModal: React.FC<LeaveApprovalModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const currentUserId = user?._id || '';
  const applicantId = request.userId?._id || '';
  const isSelf = currentUserId.toString() === applicantId.toString();

  // Xác định cấp duyệt hiện tại:
  // Nếu status === 'PENDING': Đang ở Cấp 1 (Manager)
  // Nếu status === 'MANAGER_APPROVED': Đang ở Cấp 2 (HR Manager / CEO)
  const isStage1 = request.status === 'PENDING';
  const isStage2 = request.status === 'MANAGER_APPROVED';

  // Kiểm tra quyền hạn theo vai trò:
  const canApproveStage1 =
    isStage1 && (user?.role === 'MANAGER' || user?.role === 'HR_MANAGER' || user?.role === 'CEO') && !isSelf;
  const canApproveStage2 =
    isStage2 && (user?.role === 'HR_MANAGER' || user?.role === 'CEO') && !(isSelf && user?.role !== 'CEO');

  const canAction = canApproveStage1 || canApproveStage2;

  const handleAction = async (decision: 'APPROVE' | 'REJECT') => {
    setError(null);
    setLoading(true);

    try {
      if (isStage1) {
        await leaveApi.approveStage1(request._id, {
          decision,
          comment: comment.trim(),
        });
      } else if (isStage2) {
        await leaveApi.approveStage2(request._id, {
          decision,
          comment: comment.trim(),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      setError(
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Có lỗi xảy ra trong quá trình xử lý phê duyệt.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Xem Xét & Phê Duyệt Đơn Từ</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isStage1 ? 'Phê duyệt Cấp 1 (Quản lý trực tiếp)' : 'Phê duyệt Cấp 2 (HR Manager / CEO cấp cuối)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-Self-Approval Warning */}
        {isSelf && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cảnh Báo An Toàn: Chống Tự Duyệt Đơn (Anti-Self-Approval)</p>
              <p className="mt-0.5 text-slate-400">
                Bạn là người tạo đơn này. Theo quy chế quản trị nhân sự và bảo mật Fail-Closed, bạn không được phép tự phê duyệt đơn của chính mình.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Card Thông tin nhân sự */}
          <div className="p-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600">
                {request.userId?.avatarUrl ? (
                  <img
                    src={request.userId.avatarUrl}
                    alt={request.userId.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{request.userId?.fullName || 'Nhân viên'}</p>
                <p className="text-[11px] text-slate-400">
                  Mã NV: <span className="text-slate-300 font-mono">{request.userId?.employeeCode}</span> •{' '}
                  {request.userId?.email}
                </p>
              </div>
            </div>
            <div>
              <LeaveTypeBadge type={request.type} />
            </div>
          </div>

          {/* Chi tiết nội dung đơn */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Thời gian đề xuất:</span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(request.startDate).toLocaleDateString('vi-VN')}
                  {request.startDate !== request.endDate && (
                    <>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      {new Date(request.endDate).toLocaleDateString('vi-VN')}
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tổng thời lượng:</span>
                <span className="text-indigo-400 font-bold">
                  {request.type === 'OT' ? `${request.otHoursRequested} giờ OT` : `${request.durationDays} ngày`}
                </span>
              </div>
            </div>

            {request.type === 'FORGOT_CHECKIN' && request.forgotDetails && (
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs space-y-1">
                <p className="text-indigo-300 font-medium">Chi tiết giải trình công:</p>
                <p className="text-slate-300">
                  Ngày quên công: <span className="font-mono text-white">{request.forgotDetails.targetDate}</span> •{' '}
                  Trường hợp: <span className="text-white">{request.forgotDetails.checkType}</span> • Giờ đề xuất:{' '}
                  <span className="text-white">{request.forgotDetails.requestedTime}</span>
                </p>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-xs block mb-1">Lý do trình bày:</span>
              <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                {request.reason}
              </p>
            </div>

            {request.attachmentUrl && (
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                <span className="text-slate-400">Tài liệu đính kèm:</span>
                <a
                  href={request.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  <span>Xem tài liệu y tế / xác nhận</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Tiến trình 2 Cấp (Timeline) */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quy Trình Phê Duyệt 2 Cấp
            </h4>
            <div className="space-y-3">
              {/* Cấp 1: Quản lý */}
              <div className="flex items-start gap-3 text-xs">
                <div className="mt-0.5">
                  {request.managerApproval?.decision === 'MANAGER_APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  ) : request.managerApproval?.decision === 'REJECTED' ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-200">Cấp 1: Quản Lý Trực Tiếp</p>
                    <LeaveStatusBadge
                      status={request.managerApproval?.decision || 'PENDING'}
                    />
                  </div>
                  {request.managerApproval?.comment && (
                    <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/50 p-2 rounded">
                      "{request.managerApproval.comment}"
                    </p>
                  )}
                  {request.managerApproval?.decidedAt && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Đã duyệt lúc: {new Date(request.managerApproval.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Cấp 2: HR Manager */}
              <div className="flex items-start gap-3 text-xs pt-2 border-t border-slate-800/60">
                <div className="mt-0.5">
                  {request.hrApproval?.decision === 'HR_APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : request.hrApproval?.decision === 'REJECTED' ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-200">Cấp 2: Phòng Nhân Sự (HR Manager)</p>
                    <LeaveStatusBadge
                      status={request.hrApproval?.decision || (request.status === 'MANAGER_APPROVED' ? 'PENDING' : 'PENDING')}
                    />
                  </div>
                  {request.hrApproval?.comment && (
                    <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/50 p-2 rounded">
                      "{request.hrApproval.comment}"
                    </p>
                  )}
                  {request.hrApproval?.decidedAt && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Quyết toán lúc: {new Date(request.hrApproval.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nhận xét phê duyệt */}
          {canAction && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nhận xét / Ý kiến phê duyệt (tùy chọn)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Ghi chú thêm cho người nộp đơn hoặc lý do từ chối..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Đóng
            </button>

            {canAction && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('REJECT')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Từ Chối Đơn
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('APPROVE')}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {isStage1 ? 'Duyệt Cấp 1 (Chuyển HR)' : 'Phê Duyệt Cấp Cuối'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
