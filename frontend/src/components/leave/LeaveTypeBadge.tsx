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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nghỉ phép năm</span>
        </span>
      );

    case 'SICK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
          <span>Nghỉ ốm hưởng BH</span>
        </span>
      );

    case 'OT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Làm thêm giờ (OT)</span>
        </span>
      );

    case 'WFH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Home className="w-3.5 h-3.5 text-sky-400" />
          <span>Làm việc từ xa (WFH)</span>
        </span>
      );

    case 'FORGOT_CHECKIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <FileQuestion className="w-3.5 h-3.5 text-indigo-400" />
          <span>Giải trình quên công</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-300 bg-slate-800">
          {type}
        </span>
      );
  }
};
