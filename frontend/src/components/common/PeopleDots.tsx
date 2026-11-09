import React, { useState } from 'react';

export type DotStatus = 'present' | 'late' | 'leave' | 'absent';
export type DotRisk = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PeopleDotItem {
  id: string;
  name: string;
  code: string;
  department?: string;
  departmentCode?: string;
  status?: DotStatus;
  checkinTime?: string;
  riskLevel?: DotRisk;
  riskScore?: number;
  primaryFactor?: string;
}

export interface PeopleDotsProps {
  people: PeopleDotItem[];
  mode?: 'attendance' | 'risk';
  activePersonId?: string | null;
  onSelectPerson?: (person: PeopleDotItem) => void;
  showLegend?: boolean;
  className?: string;
}

export const PeopleDots: React.FC<PeopleDotsProps> = ({
  people,
  mode = 'attendance',
  activePersonId,
  onSelectPerson,
  showLegend = true,
  className = '',
}) => {
  const [hoveredPerson, setHoveredPerson] = useState<PeopleDotItem | null>(null);

  // Counts for accessibility and legend
  const attendanceCounts = {
    present: people.filter((p) => (p.status || 'present') === 'present').length,
    late: people.filter((p) => p.status === 'late').length,
    leave: people.filter((p) => p.status === 'leave').length,
    absent: people.filter((p) => p.status === 'absent').length,
  };

  const riskCounts = {
    high: people.filter((p) => p.riskLevel === 'HIGH').length,
    medium: people.filter((p) => p.riskLevel === 'MEDIUM').length,
    low: people.filter((p) => (p.riskLevel || 'LOW') === 'LOW').length,
  };

  const getDotClass = (p: PeopleDotItem) => {
    const isActive = activePersonId === p.id;

    if (mode === 'risk') {
      const risk = p.riskLevel || 'LOW';
      if (risk === 'HIGH') {
        return `bg-rose-500 shadow-sm shadow-rose-500/40 ring-1 ring-rose-400 ${
          isActive ? 'ring-4 ring-rose-300 scale-150 animate-pulse' : ''
        }`;
      }
      if (risk === 'MEDIUM') {
        return `bg-amber-400 ring-1 ring-amber-500/30 ${
          isActive ? 'ring-4 ring-amber-300 scale-150' : ''
        }`;
      }
      return `bg-teal-500 ring-1 ring-teal-500/30 ${
        isActive ? 'ring-4 ring-teal-300 scale-150' : ''
      }`;
    }

    // mode === 'attendance'
    const status = p.status || 'present';
    if (status === 'present') {
      return `bg-teal-500 hover:ring-2 hover:ring-teal-300 ${
        isActive ? 'ring-4 ring-teal-300 scale-150 animate-pulse' : ''
      }`;
    }
    if (status === 'late') {
      return `bg-amber-400 hover:ring-2 hover:ring-amber-200 ${
        isActive ? 'ring-4 ring-amber-300 scale-150' : ''
      }`;
    }
    if (status === 'leave') {
      return `bg-slate-500 hover:ring-2 hover:ring-slate-300 ${
        isActive ? 'ring-4 ring-slate-300 scale-150' : ''
      }`;
    }
    return `bg-slate-800 ring-1 ring-slate-700 hover:ring-slate-500 ${
      isActive ? 'ring-4 ring-slate-400 scale-150' : ''
    }`;
  };

  const getAriaLabel = () => {
    if (mode === 'risk') {
      return `Lưới phân bổ rủi ro 50 nhân sự: ${riskCounts.high} nguy cơ cao, ${riskCounts.medium} trung bình, ${riskCounts.low} ổn định`;
    }
    return `Lưới chấm công 50 nhân sự: ${attendanceCounts.present} có mặt đúng giờ, ${attendanceCounts.late} đi muộn, ${attendanceCounts.leave} nghỉ phép, ${attendanceCounts.absent} vắng mặt`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 50 People Grid Container */}
      <div className="relative">
        <div
          role="img"
          aria-label={getAriaLabel()}
          className="grid grid-cols-10 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 max-w-fit"
        >
          {people.map((person, i) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelectPerson && onSelectPerson(person)}
              onMouseEnter={() => setHoveredPerson(person)}
              onMouseLeave={() => setHoveredPerson(null)}
              style={{ animationDelay: `${i * 12}ms` }}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 cursor-pointer motion-safe:animate-dot-in hover:scale-130 active:scale-95 focus:outline-none ${getDotClass(
                person
              )}`}
              title={`${person.name} (${person.code})`}
              aria-label={`${person.name} - ${
                mode === 'risk' ? `Rủi ro: ${person.riskLevel || 'LOW'}` : `Trạng thái: ${person.status || 'present'}`
              }`}
            />
          ))}
        </div>

        {/* Live Hover Tooltip */}
        {hoveredPerson && (
          <div className="absolute -top-14 left-0 z-30 pointer-events-none px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs shadow-xl animate-fadeIn whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{hoveredPerson.name}</span>
              <span className="text-[10px] font-mono text-slate-400">({hoveredPerson.code})</span>
              {hoveredPerson.department && (
                <span className="text-[10px] text-teal-300">· {hoveredPerson.department}</span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {mode === 'risk' ? (
                <span>
                  Nguy cơ:{' '}
                  <strong
                    className={
                      hoveredPerson.riskLevel === 'HIGH'
                        ? 'text-rose-400'
                        : hoveredPerson.riskLevel === 'MEDIUM'
                        ? 'text-amber-400'
                        : 'text-teal-400'
                    }
                  >
                    {hoveredPerson.riskLevel === 'HIGH'
                      ? 'Cao (≥50%)'
                      : hoveredPerson.riskLevel === 'MEDIUM'
                      ? 'Trung bình (30-49%)'
                      : 'Ổn định (<30%)'}
                  </strong>
                  {hoveredPerson.riskScore !== undefined && ` (${hoveredPerson.riskScore}/100)`}
                </span>
              ) : (
                <span>
                  Trạng thái:{' '}
                  <strong
                    className={
                      hoveredPerson.status === 'late'
                        ? 'text-amber-400'
                        : hoveredPerson.status === 'leave'
                        ? 'text-slate-400'
                        : hoveredPerson.status === 'absent'
                        ? 'text-rose-400'
                        : 'text-teal-400'
                    }
                  >
                    {hoveredPerson.status === 'late'
                      ? `Đi muộn ${hoveredPerson.checkinTime ? `(${hoveredPerson.checkinTime})` : ''}`
                      : hoveredPerson.status === 'leave'
                      ? 'Nghỉ phép năm'
                      : hoveredPerson.status === 'absent'
                      ? 'Chưa vào ca'
                      : `Có mặt ${hoveredPerson.checkinTime ? `(${hoveredPerson.checkinTime})` : 'đúng giờ'}`}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Legend with Text + Icon for Color-Blind Users */}
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
          {mode === 'risk' ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-1 ring-rose-400" />
                <span>
                  Nguy cơ cao: <strong className="text-rose-300 font-mono">{riskCounts.high}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>
                  Trung bình: <strong className="text-amber-300 font-mono">{riskCounts.medium}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>
                  Ổn định: <strong className="text-teal-300 font-mono">{riskCounts.low}</strong>
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <span>
                  Đúng giờ: <strong className="text-teal-300 font-mono">{attendanceCounts.present}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>
                  Đi muộn: <strong className="text-amber-300 font-mono">{attendanceCounts.late}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>
                  Nghỉ phép: <strong className="text-slate-300 font-mono">{attendanceCounts.leave}</strong>
                </span>
              </span>
              {attendanceCounts.absent > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                  <span>
                    Chưa vào: <strong className="text-slate-400 font-mono">{attendanceCounts.absent}</strong>
                  </span>
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

