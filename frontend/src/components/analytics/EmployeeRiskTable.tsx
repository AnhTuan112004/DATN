import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Clock } from 'lucide-react';
import { AnalyzedEmployee } from '../../api/analytics';

interface EmployeeRiskTableProps {
  employees: AnalyzedEmployee[];
  onSelectEmployee: (employee: AnalyzedEmployee) => void;
}

export const EmployeeRiskTable: React.FC<EmployeeRiskTableProps> = ({
  employees = [],
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredEmployees = useMemo(() => {
    return (employees || []).filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRisk = riskFilter === 'ALL' || emp.prediction.riskLevel === riskFilter;

      return matchSearch && matchRisk;
    });
  }, [employees, searchTerm, riskFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  const getRiskBadge = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Nguy cơ cao</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Trung bình</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Ổn định</span>
          </span>
        );
    }
  };

  const getRiskBorderClass = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'HIGH':
        return 'border-l-2 border-l-rose-500 hover:bg-rose-950/10';
      case 'MEDIUM':
        return 'border-l-2 border-l-amber-500 hover:bg-amber-950/10';
      case 'LOW':
        return 'border-l-2 border-l-emerald-500 hover:bg-emerald-950/10';
    }
  };

  return (
    <div className="app-surface rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Header & Bộ Lọc */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Danh sách đánh giá nguy cơ thôi việc</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {filteredEmployees.length} nhân sự
            </span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Sắp xếp theo thứ tự xác suất nghỉ việc từ cao xuống thấp
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Lọc theo mức rủi ro */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl text-xs w-full sm:w-auto border border-slate-800">
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                riskFilter === 'ALL'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setRiskFilter('HIGH');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                riskFilter === 'HIGH'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Nguy cơ cao
            </button>
            <button
              onClick={() => {
                setRiskFilter('MEDIUM');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                riskFilter === 'MEDIUM'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Trung bình
            </button>
            <button
              onClick={() => {
                setRiskFilter('LOW');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Ổn định
            </button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Phòng ban / Vị trí</th>
              <th className="py-3 px-4 text-center">Tần suất OT (30 ngày)</th>
              <th className="py-3 px-4 text-center">Thâm niên</th>
              <th className="py-3 px-4 text-center">Điểm rủi ro</th>
              <th className="py-3 px-4">Mức độ</th>
              <th className="py-3 px-4">Nhân tố chính</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Không tìm thấy nhân sự phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const colors = [
                  'bg-slate-800 text-slate-200 border border-slate-700',
                  'bg-sky-950/70 text-sky-300 border border-sky-800/60',
                  'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60',
                  'bg-violet-950/70 text-violet-300 border border-violet-800/60',
                  'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60',
                ];
                let hash = 0;
                for (let i = 0; i < emp.fullName.length; i++) hash += emp.fullName.charCodeAt(i);
                const avatarClass = colors[hash % colors.length];

                return (
                  <tr
                    key={emp.userId}
                    className={`transition-colors ${getRiskBorderClass(emp.prediction.riskLevel)}`}
                  >
                    {/* Nhân sự */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${avatarClass} flex items-center justify-center font-medium text-xs shrink-0`}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {emp.employeeCode} · <span className="font-sans">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phòng ban */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">
                        {emp.department.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {emp.role}
                      </span>
                    </td>

                    {/* Giờ OT 30 ngày */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className={`font-semibold ${
                            emp.features.otHoursMonth >= 4
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {emp.features.otHoursMonth}h
                        </span>
                      </div>
                      {emp.features.overTime === 1 && (
                        <span className="block text-[10px] text-rose-400 font-medium">
                          OT thường xuyên
                        </span>
                      )}
                    </td>

                    {/* Thâm niên */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="font-medium text-slate-200">
                        {emp.features.yearsAtCompany} năm
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Tổng nghề: {emp.features.totalWorkingYears}n
                      </span>
                    </td>

                    {/* Điểm rủi ro */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono">
                        <span className="text-sm font-bold text-white">
                          {emp.prediction.riskScore}
                        </span>
                        <span className="text-[11px] text-slate-400">/100</span>
                      </div>
                      {/* Progress bar mini */}
                      <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            emp.prediction.riskLevel === 'HIGH'
                              ? 'bg-rose-500'
                              : emp.prediction.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${emp.prediction.riskScore}%` }}
                        />
                      </div>
                    </td>

                    {/* Mức độ */}
                    <td className="py-3.5 px-4">
                      {getRiskBadge(emp.prediction.riskLevel)}
                    </td>

                    {/* Nhân tố chính thúc đẩy */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.prediction.primaryRiskFactors.slice(0, 2).map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-normal"
                          >
                            {factor.label}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-teal-300 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-800/60 transition cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Trang <span className="font-mono font-medium text-white">{currentPage}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
