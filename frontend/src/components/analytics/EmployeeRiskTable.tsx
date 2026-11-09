import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Clock } from 'lucide-react';
import { AnalyzedEmployee, RiskLevel } from '../../api/analytics';

interface EmployeeRiskTableProps {
  employees: AnalyzedEmployee[];
  onSelectEmployee: (employee: AnalyzedEmployee) => void;
}

export const EmployeeRiskTable: React.FC<EmployeeRiskTableProps> = ({
  employees,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Lọc và tìm kiếm
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRisk = riskFilter === 'ALL' || emp.prediction.riskLevel === riskFilter;

      return matchSearch && matchRisk;
    });
  }, [employees, searchTerm, riskFilter]);

  // Phân trang
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Nguy cơ cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Trung bình
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Ổn định
          </span>
        );
    }
  };

  const getRiskBorderClass = (level: RiskLevel) => {
    switch (level) {
      case 'HIGH':
        return 'border-l-4 border-l-rose-500 bg-rose-500/5';
      case 'MEDIUM':
        return 'border-l-4 border-l-amber-500 bg-amber-500/5';
      case 'LOW':
        return 'border-l-4 border-l-emerald-500';
    }
  };

  return (
    <div className="bg-surface rounded-2xl border-2 border-line overflow-hidden shadow-hard">
      {/* Header & Bộ Lọc */}
      <div className="p-4 sm:p-5 border-b-2 border-line bg-surface-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-fg flex items-center gap-2 font-display">
            <span>Danh sách đánh giá nguy cơ thôi việc</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-surface text-fg border border-line shadow-xs">
              {filteredEmployees.length} nhân sự
            </span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Sắp xếp theo thứ tự xác suất nghỉ việc từ cao xuống thấp
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-line rounded-xl text-fg placeholder:text-muted focus:outline-none focus:border-primary transition font-medium"
            />
          </div>

          {/* Lọc theo mức rủi ro */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl text-xs w-full sm:w-auto border border-line">
            <button
              type="button"
              onClick={() => {
                setRiskFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                riskFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setRiskFilter('HIGH');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                riskFilter === 'HIGH'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-muted hover:text-rose-600'
              }`}
            >
              Nguy cơ cao
            </button>
            <button
              type="button"
              onClick={() => {
                setRiskFilter('MEDIUM');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                riskFilter === 'MEDIUM'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-muted hover:text-amber-600'
              }`}
            >
              Trung bình
            </button>
            <button
              type="button"
              onClick={() => {
                setRiskFilter('LOW');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted hover:text-emerald-600'
              }`}
            >
              Ổn định
            </button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-line bg-surface-2 text-muted text-[10px] font-mono font-bold uppercase tracking-wider">
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
          <tbody className="divide-y divide-line/30">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  Không tìm thấy nhân sự phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const colors = [
                  'bg-surface-2 text-primary border border-line',
                  'bg-sky/20 text-sky-800 dark:text-sky-300 border border-sky-400',
                  'bg-lilac/20 text-indigo-800 dark:text-indigo-300 border border-indigo-400',
                  'bg-peach/20 text-amber-800 dark:text-amber-300 border border-amber-400',
                  'bg-lime/20 text-ink border border-lime',
                ];
                let hash = 0;
                for (let i = 0; i < emp.fullName.length; i++) hash += emp.fullName.charCodeAt(i);
                const avatarClass = colors[hash % colors.length];

                return (
                  <tr
                    key={emp.userId}
                    className={`hover:bg-surface-2/60 transition-colors ${getRiskBorderClass(emp.prediction.riskLevel)}`}
                  >
                    {/* Nhân sự */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${avatarClass} flex items-center justify-center font-bold text-xs shrink-0 font-mono`}>
                          {emp.fullName.split(' ').pop()?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-fg">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-muted font-mono">
                            {emp.employeeCode} · <span className="font-sans">{emp.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phòng ban */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-fg">
                        {emp.department.name}
                      </span>
                      <span className="block text-[11px] text-muted font-mono">
                        {emp.role}
                      </span>
                    </td>

                    {/* Giờ OT 30 ngày */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-muted" />
                        <span
                          className={`font-bold ${
                            emp.features.otHoursMonth >= 4
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-fg'
                          }`}
                        >
                          {emp.features.otHoursMonth}h
                        </span>
                      </div>
                      {emp.features.overTime === 1 && (
                        <span className="block text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          OT thường xuyên
                        </span>
                      )}
                    </td>

                    {/* Thâm niên */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="font-semibold text-fg">
                        {emp.features.yearsAtCompany} năm
                      </span>
                      <span className="block text-[10px] text-muted">
                        Tổng nghề: {emp.features.totalWorkingYears}n
                      </span>
                    </td>

                    {/* Điểm rủi ro */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono">
                        <span className="text-sm font-extrabold text-fg">
                          {emp.prediction.riskScore}
                        </span>
                        <span className="text-[11px] text-muted">/100</span>
                      </div>
                      {/* Progress bar mini */}
                      <div className="w-16 h-1.5 bg-surface-2 border border-line/40 rounded-full mx-auto mt-1 overflow-hidden">
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
                            className="px-2 py-0.5 rounded text-[10px] bg-surface-2 text-fg border border-line font-medium"
                          >
                            {factor.label}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(emp)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-lime text-ink border border-line shadow-xs hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5 text-ink" strokeWidth={2.5} />
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
        <div className="p-4 border-t-2 border-line bg-surface-2 flex items-center justify-between text-xs text-muted">
          <div>
            Trang <span className="font-mono font-bold text-fg">{currentPage}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-surface text-fg border border-line shadow-xs font-semibold hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-surface text-fg border border-line shadow-xs font-semibold hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
