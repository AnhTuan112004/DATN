import React from 'react';
import { LeaveRequestType } from '../../types/leave';
import { Calendar, HeartPulse, Timer, Home, FileQuestion, FileText } from 'lucide-react';

interface LeaveTypeBadgeProps {
  type: LeaveRequestType;
}

export const LeaveTypeBadge: React.FC<LeaveTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'ANNUAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
          <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
          <span>Nghỉ phép năm</span>
        </span>
      );

    case 'SICK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
          <HeartPulse className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Nghỉ ốm (BHXH)</span>
        </span>
      );

    case 'OT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-950/40 text-sky-300 border border-sky-800/40">
          <Timer className="w-3 h-3 text-sky-400 shrink-0" />
          <span>Làm thêm giờ (OT)</span>
        </span>
      );

    case 'WFH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-950/40 text-violet-300 border border-violet-800/40">
          <Home className="w-3 h-3 text-violet-400 shrink-0" />
          <span>Làm từ xa (WFH)</span>
        </span>
      );

    case 'FORGOT_CHECKIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
          <FileQuestion className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Giải trình quên công</span>
        </span>
      );

    case 'CUSTOM':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Đơn tự do / Văn bản</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-slate-400 bg-slate-800 border border-slate-700">
          {type}
        </span>
      );
  }
};
