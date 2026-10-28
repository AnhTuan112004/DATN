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
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]"
          title="Đơn đang chờ Quản lý trực tiếp xem xét và phê duyệt (Cấp 1)"
        >
          <Clock className="w-3.5 h-3.5 text-[var(--warning-text)]" />
          <span>Chờ Quản lý duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 1/2)</span>}
        </span>
      );

    case 'MANAGER_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]"
          title="Quản lý đã duyệt. Đang chờ HR Manager phê duyệt cấp cuối (Cấp 2)"
        >
          <UserCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Quản lý đã duyệt</span>
          {showStepInfo && <span className="text-[10px] opacity-75">(Cấp 2/2)</span>}
        </span>
      );

    case 'HR_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--success-bg)] text-[var(--success-text)] border border-[var(--success-border)]"
          title="Đơn đã được phê duyệt chính thức và đã trừ số dư phép"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success-text)]" />
          <span>Đã phê duyệt</span>
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
