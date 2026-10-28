import React from 'react';
import { LeaveRequestType } from '../../types/leave';
import { Calendar, HeartPulse, Clock, Home, FileQuestion } from 'lucide-react';

interface LeaveTypeBadgeProps {
  type: LeaveRequestType;
}

export const LeaveTypeBadge: React.FC<LeaveTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'ANNUAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border)]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Nghỉ phép năm</span>
        </span>
      );

    case 'SICK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
          <HeartPulse className="w-3.5 h-3.5 text-[var(--danger-text)]" />
          <span>Nghỉ ốm</span>
        </span>
      );

    case 'OT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]">
          <Clock className="w-3.5 h-3.5" />
          <span>Làm thêm giờ</span>
        </span>
      );

    case 'WFH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
          <Home className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Làm từ xa (WFH)</span>
        </span>
      );

    case 'FORGOT_CHECKIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius)] text-xs font-medium bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
          <FileQuestion className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Giải trình quên công</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius)] text-xs text-[var(--text-muted)] bg-[var(--surface-muted)] border border-[var(--border)]">
          {type}
        </span>
      );
  }
};
