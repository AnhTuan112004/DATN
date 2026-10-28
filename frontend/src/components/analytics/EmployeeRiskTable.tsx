import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, AlertTriangle, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AnalyzedEmployee } from '../../api/analytics';

interface EmployeeRiskTableProps {
  employees: AnalyzedEmployee[];
  onSelectEmployee: (employee: AnalyzedEmployee) => void;
}

export const EmployeeRiskTable: React.FC<EmployeeRiskTableProps> = ({
  employees,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Lọc theo search
      const matchSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Lọc theo risk level
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[var(--danger-bg)] text-[var(--danger-text)]">
            <AlertTriangle className="w-3 h-3" /> Nguy cơ cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[var(--warning-bg)] text-[var(--warning-text)]">
            <AlertCircle className="w-3 h-3" /> Trung bình
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-[var(--success-bg)] text-[var(--success-text)]">
            <CheckCircle2 className="w-3 h-3" /> Ổn định
          </span>
        );
    }
  };

  return (
    <div className="app-surface overflow-hidden">
      {/* Header & Bộ Lọc */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)] flex items-center gap-2">
            Danh sách đánh giá nguy cơ thôi việc
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-muted)]">
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="app-input text-xs pl-9 pr-3 py-1.5"
            />
          </div>

          {/* Lọc theo mức rủi ro */}
          <div className="flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-[var(--radius)] text-xs w-full sm:w-auto border border-[var(--border)]">
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                riskFilter === 'ALL'
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setRiskFilter('HIGH');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                riskFilter === 'HIGH'
                  ? 'bg-[var(--danger-bg)] text-[var(--danger-text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--danger-text)]'
              }`}
            >
              Nguy cơ cao
            </button>
            <button
              onClick={() => {
                setRiskFilter('MEDIUM');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                riskFilter === 'MEDIUM'
                  ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--warning-text)]'
              }`}
            >
              Trung bình
            </button>
            <button
              onClick={() => {
                setRiskFilter('LOW');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                riskFilter === 'LOW'
                  ? 'bg-[var(--success-bg)] text-[var(--success-text)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--success-text)]'
              }`}
            >
              Ổn định
            </button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs font-medium">
            <tr>
              <th className="py-2.5 px-3">Nhân sự</th>
              <th className="py-2.5 px-3">Phòng ban / Vị trí</th>
              <th className="py-2.5 px-3 text-center">Tần suất OT (30 ngày)</th>
              <th className="py-2.5 px-3 text-center">Thâm niên</th>
              <th className="py-2.5 px-3 text-center">Điểm rủi ro</th>
              <th className="py-2.5 px-3">Mức độ</th>
              <th className="py-2.5 px-3">Nhân tố chính</th>
              <th className="py-2.5 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                  Không tìm thấy nhân sự phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => {
                const colors = [
                  'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
                  'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
                  'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
                  'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
                ];
                let hash = 0;
                for (let i = 0; i < emp.fullName.length; i++) hash += emp.fullName.charCodeAt(i);
                const avatarClass = colors[hash % colors.length];

                return (
                  <tr
                    key={emp.userId}
                    className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    {/* Nhân sự */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${avatarClass} flex items-center justify-center font-medium text-xs shrink-0`}>
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text)]">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {emp.employeeCode} · {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phòng ban */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-[var(--text)]">
                        {emp.department.name}
                      </span>
                      <span className="block text-[11px] text-[var(--text-muted)]">
                        {emp.role}
                      </span>
                    </td>

                    {/* Giờ OT 30 ngày */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span
                          className={`font-semibold tabular-nums ${
                            emp.features.otHoursMonth >= 4
                              ? 'text-rose-500'
                              : 'text-[var(--text)]'
                          }`}
                        >
                          {emp.features.otHoursMonth}h
                        </span>
                      </div>
                      {emp.features.overTime === 1 && (
                        <span className="block text-[10px] text-rose-500 font-medium">
                          OT thường xuyên
                        </span>
                      )}
                    </td>

                    {/* Thâm niên */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium text-[var(--text)] tabular-nums">
                        {emp.features.yearsAtCompany} năm
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)] tabular-nums">
                        Tổng nghề: {emp.features.totalWorkingYears}n
                      </span>
                    </td>

                    {/* Điểm rủi ro */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-sm font-semibold text-[var(--text)] tabular-nums">
                          {emp.prediction.riskScore}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">/100</span>
                      </div>
                      {/* Progress bar mini */}
                      <div className="w-16 h-1 bg-[var(--surface-muted)] rounded-full mx-auto mt-1 overflow-hidden">
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
                    <td className="py-3 px-4">
                      {getRiskBadge(emp.prediction.riskLevel)}
                    </td>

                    {/* Nhân tố chính thúc đẩy */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.prediction.primaryRiskFactors.slice(0, 2).map((factor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)] font-normal"
                          >
                            {factor.label}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectEmployee(emp)}
                        className="app-button-secondary text-xs h-8 min-h-0 py-1 px-2.5"
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
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div>
            Trang <span className="font-medium text-[var(--text)]">{currentPage}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="app-button-secondary text-xs h-8 min-h-0 py-1 px-3 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="app-button-secondary text-xs h-8 min-h-0 py-1 px-3 disabled:opacity-40"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
