import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveApi } from '../../api/leave';
import { LeaveRequest } from '../../types/leave';
import { LeaveStatusBadge } from './LeaveStatusBadge';
import { LeaveTypeBadge } from './LeaveTypeBadge';
import {
  X,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  Ban,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  onSuccess: () => void;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const currentUserId = user?._id || '';
  const applicantId = request.userId?._id || '';
  const isOwner = currentUserId.toString() === applicantId.toString();
  const isHRorCEO = user?.role === 'HR_MANAGER' || user?.role === 'CEO';
  const canCancel =
    (isOwner || isHRorCEO) &&
    request.status !== 'CANCELLED' &&
    request.status !== 'REJECTED';

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationReason || cancellationReason.trim().length < 3) {
      setError('Vui lòng nhập lý do hủy đơn (tối thiểu 3 ký tự).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await leaveApi.cancelLeaveRequest(request._id, {
        cancellationReason: cancellationReason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
      setError(
        axiosError.response?.data?.error ||
        axiosError.message ||
        'Không thể hủy đơn. Vui lòng thử lại.'
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
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Chi Tiết Đơn Nghỉ Phép & Đề Xuất
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {request._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {/* Card Người nộp & Trạng thái */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
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
                <p className="text-xs font-bold text-white">{request.userId?.fullName}</p>
                <p className="text-[11px] text-slate-400">
                  Mã: <span className="font-mono text-slate-300">{request.userId?.employeeCode}</span> •{' '}
                  {request.userId?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <LeaveStatusBadge status={request.status} showStepInfo={true} />
              <LeaveTypeBadge type={request.type} />
            </div>
          </div>

          {/* Chi tiết nội dung */}
          <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Thời gian:</span>
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
                <span className="text-slate-400 block mb-0.5">Thời lượng:</span>
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
              <span className="text-slate-400 text-xs block mb-1">Lý do nộp đơn:</span>
              <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                {request.reason}
              </p>
            </div>

            {request.cancellationReason && (
              <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
                <span className="text-slate-400 font-medium block mb-0.5">Lý do hủy đơn:</span>
                <p className="text-slate-300 italic">"{request.cancellationReason}"</p>
              </div>
            )}

            {request.attachmentUrl && (
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
                <span className="text-slate-400">Tài liệu đính kèm:</span>
                <a
                  href={request.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  <span>Xem tài liệu đính kèm</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Lịch sử phê duyệt 2 Cấp */}
          <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lịch Sử Phê Duyệt 2 Cấp
            </h4>
            <div className="space-y-3 text-xs">
              {/* Cấp 1 */}
              <div className="flex items-start gap-3">
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
                  {request.managerApproval?.approverId && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Người duyệt: {request.managerApproval.approverId.fullName} ({request.managerApproval.approverId.employeeCode})
                    </p>
                  )}
                  {request.managerApproval?.comment && (
                    <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/50 p-2 rounded">
                      "{request.managerApproval.comment}"
                    </p>
                  )}
                  {request.managerApproval?.decidedAt && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Thời gian: {new Date(request.managerApproval.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Cấp 2 */}
              <div className="flex items-start gap-3 pt-2 border-t border-slate-800/60">
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
                  {request.hrApproval?.approverId && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Người quyết toán: {request.hrApproval.approverId.fullName} ({request.hrApproval.approverId.employeeCode})
                    </p>
                  )}
                  {request.hrApproval?.comment && (
                    <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/50 p-2 rounded">
                      "{request.hrApproval.comment}"
                    </p>
                  )}
                  {request.hrApproval?.decidedAt && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Thời gian: {new Date(request.hrApproval.decidedAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form xác nhận hủy đơn */}
          {showCancelConfirm ? (
            <form onSubmit={handleCancelSubmit} className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <Ban className="w-4 h-4 text-rose-400" />
                Xác nhận hủy đơn từ
              </div>
              {request.status === 'HR_APPROVED' && (
                <p className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  Lưu ý: Đơn này đã được duyệt. Khi hủy, hệ thống sẽ tự động hoàn trả lại {request.durationDays} ngày phép vào số dư của bạn.
                </p>
              )}
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Lý do hủy đơn <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={2}
                  placeholder="Ghi rõ lý do bạn muốn hủy đơn này..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                >
                  Quay Lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Xác Nhận Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {canCancel ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:underline"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Hủy đơn này</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
