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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"
          title="Đơn đang chờ Trưởng phòng / Quản lý trực tiếp xem xét và phê duyệt (Cấp 1)"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Chờ Trưởng phòng duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 1/2)</span>}
        </span>
      );

    case 'MANAGER_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
          title="Trưởng phòng đã duyệt Cấp 1. Đang chờ HR Manager / CEO phê duyệt chính thức (Cấp 2)"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chờ HR/CEO duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 2/2)</span>}
        </span>
      );

    case 'HR_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          title="Đơn đã được HR/CEO phê duyệt chính thức và đã quyết toán trừ phép"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đã duyệt chính thức</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)]"
          title="Đơn đã bị từ chối"
        >
          <XCircle className="w-3.5 h-3.5 text-[var(--danger-text)]" />
          <span>Bị từ chối</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]"
          title="Đơn đã được hủy bỏ và hoàn trả số dư phép (nếu có)"
        >
          <Ban className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Đã hủy</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-xs text-[var(--text-muted)] bg-[var(--surface-muted)] border border-[var(--border)]">
          {status}
        </span>
      );
  }
};
