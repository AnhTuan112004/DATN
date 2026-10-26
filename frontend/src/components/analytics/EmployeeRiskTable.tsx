import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, AlertTriangle, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
            <AlertTriangle className="w-3 h-3" /> Nguy Cơ Cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <AlertCircle className="w-3 h-3" /> Trung Bình
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3" /> Ổn Định
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header & Bộ Lọc */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Danh Sách Đánh Giá Nguy Cơ Thôi Việc
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEmployees.length} nhân sự
            </span>
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
            Sắp xếp theo thứ tự xác suất nghỉ việc từ cao xuống thấp
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Lọc theo mức rủi ro */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs w-full sm:w-auto">
            <button
              onClick={() => {
                setRiskFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                riskFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => {
                setRiskFilter('HIGH');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                riskFilter === 'HIGH'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
              }`}
            >
              Nguy cơ cao
            </button>
            <button
              onClick={() => {
                setRiskFilter('MEDIUM');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                riskFilter === 'MEDIUM'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              Trung bình
            </button>
            <button
              onClick={() => {
                setRiskFilter('LOW');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                riskFilter === 'LOW'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
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
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4">Nhân Sự</th>
              <th className="py-3 px-4">Phòng Ban / Vị Trí</th>
              <th className="py-3 px-4 text-center">Tần Suất OT 30 Ngày</th>
              <th className="py-3 px-4 text-center">Thâm Niên Cty</th>
              <th className="py-3 px-4 text-center">Điểm Rủi Ro (0–100)</th>
              <th className="py-3 px-4">Mức Độ & Trạng Thái</th>
              <th className="py-3 px-4">Nhân Tố Chính Thúc Đẩy</th>
              <th className="py-3 px-4 text-right">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-700 dark:text-slate-300">
                  Không tìm thấy nhân sự phù hợp với bộ lọc
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp) => (
                <tr
                  key={emp.userId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Nhân sự */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-slate-700 dark:text-slate-300">
                          {emp.employeeCode} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Phòng ban */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {emp.department.name}
                    </span>
                    <span className="block text-[11px] text-slate-700 dark:text-slate-300">
                      {emp.role}
                    </span>
                  </td>

                  {/* Giờ OT 30 ngày */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={`font-semibold ${
                          emp.features.otHoursMonth >= 4
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {emp.features.otHoursMonth}h
                      </span>
                    </div>
                    {emp.features.overTime === 1 && (
                      <span className="block text-[10px] text-red-700 dark:text-red-400 font-semibold">
                        (OT Thường xuyên)
                      </span>
                    )}
                  </td>

                  {/* Thâm niên */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {emp.features.yearsAtCompany} năm
                    </span>
                    <span className="block text-[10px] text-slate-700 dark:text-slate-300">
                      Tổng kinh nghiệm: {emp.features.totalWorkingYears}n
                    </span>
                  </td>

                  {/* Điểm rủi ro */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {emp.prediction.riskScore}
                      </span>
                      <span className="text-[11px] text-slate-400">/ 100</span>
                    </div>
                    {/* Progress bar mini */}
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          emp.prediction.riskLevel === 'HIGH'
                            ? 'bg-red-500'
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
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-medium"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Chi tiết XAI
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <div>
            Trang <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
