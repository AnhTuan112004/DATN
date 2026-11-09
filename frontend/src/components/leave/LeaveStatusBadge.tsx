import React from 'react';
import { ApprovalStatus } from '../../types/leave';
import { Clock, ShieldCheck, CheckCircle2, XCircle, Ban } from 'lucide-react';

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
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300"
          title="Đơn đang chờ Trưởng phòng / Quản lý trực tiếp xem xét và phê duyệt (Cấp 1)"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Chờ TP duyệt</span>
          {showStepInfo && <span className="text-[10px] text-slate-400 font-mono">(Cấp 1/2)</span>}
        </span>
      );

    case 'MANAGER_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-300"
          title="Trưởng phòng đã duyệt Cấp 1. Đang chờ HR Manager / CEO phê duyệt chính thức (Cấp 2)"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Chờ HR/CEO</span>
          {showStepInfo && <span className="text-[10px] text-slate-400 font-mono">(Cấp 2/2)</span>}
        </span>
      );

    case 'HR_APPROVED':
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300"
          title="Đơn đã được HR/CEO phê duyệt chính thức và đã quyết toán trừ phép"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Đã phê duyệt</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400"
          title="Đơn đã bị từ chối"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Bị từ chối</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400"
          title="Đơn đã được người lao động chủ động rút lại hoặc hủy bỏ"
        >
          <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Đã rút đơn</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>{status}</span>
        </span>
      );
  }
};
