import React from 'react';
import { ApprovalStatus } from '../../types/leave';
import { Clock, CheckCircle2, UserCheck, XCircle, Ban } from 'lucide-react';

interface LeaveStatusBadgeProps {
  status: ApprovalStatus;
  showStepInfo?: boolean;
}

export const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({
  status,
  showStepInfo = false,
}) => {
  switch (status) {
    case 'PENDING':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
          title="Đơn đang chờ Quản lý trực tiếp xem xét và phê duyệt (Cấp 1)"
        >
          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          <span>Chờ Quản lý duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 1/2)</span>}
        </span>
      );

    case 'MANAGER_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
          title="Quản lý đã duyệt. Đang chờ HR Manager phê duyệt cấp cuối (Cấp 2)"
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quản lý đã duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 2/2)</span>}
        </span>
      );

    case 'HR_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
          title="Đơn đã được phê duyệt chính thức và đã trừ số dư phép"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã phê duyệt</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm"
          title="Đơn đã bị từ chối"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Bị từ chối</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30 shadow-sm"
          title="Đơn đã được hủy bỏ và hoàn trả số dư phép (nếu có)"
        >
          <Ban className="w-3.5 h-3.5 text-slate-400" />
          <span>Đã hủy</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-800">
          {status}
        </span>
      );
  }
};
