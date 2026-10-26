import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingDown,
  RefreshCw,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  BrainCircuit,
  SlidersHorizontal,
} from 'lucide-react';
import { getAttritionOverview, AttritionOverviewData, AnalyzedEmployee } from '../api/analytics';
import { departmentsApi } from '../api/departments';
import { DepartmentItem } from '../types/user';
import { AttritionKpiCards } from '../components/analytics/AttritionKpiCards';
import { FeatureImportanceChart } from '../components/analytics/FeatureImportanceChart';
import { DepartmentRiskChart } from '../components/analytics/DepartmentRiskChart';
import { RiskDistributionPieChart } from '../components/analytics/RiskDistributionPieChart';
import { EmployeeRiskTable } from '../components/analytics/EmployeeRiskTable';
import { EmployeeRiskDetailModal } from '../components/analytics/EmployeeRiskDetailModal';

export const AttritionAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AttritionOverviewData | null>(null);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<AnalyzedEmployee | null>(null);

  // 1. Tải danh sách phòng ban để lọc
  useEffect(() => {
    departmentsApi
      .getAllDepartments()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setDepartments(res.data);
        }
      })
      .catch((err: unknown) => {
        console.warn('Không thể tải danh sách phòng ban:', err);
      });
  }, []);

  // 2. Tải dữ liệu phân tích ML
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAttritionOverview(selectedDeptId === 'ALL' ? undefined : selectedDeptId);
      setData(res);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu phân tích ML:', err);
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu phân tích rủi ro nhân sự.');
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. Xuất file CSV danh sách nguy cơ thôi việc
  const exportCsv = () => {
    if (!data || !data.allEmployees || data.allEmployees.length === 0) return;

    const headers = [
      'Mã Nhân Viên',
      'Họ và Tên',
      'Email',
      'Phòng Ban',
      'Vai Trò',
      'OT 30 Ngày (giờ)',
      'OverTime (1=Co, 0=Khong)',
      'Thâm Niên Cty (năm)',
      'Tổng Kinh Nghiệm (năm)',
      'Lương Cơ Bản (VND)',
      'Số Cty Cũ',
      'Khoảng Cách (km)',
      'Xác Suất (%)',
      'Điểm Rủi Ro (0-100)',
      'Mức Rủi Ro',
      'Khuyến Nghị Can Thiệp',
    ];

    const rows = data.allEmployees.map((emp) => [
      `"${emp.employeeCode}"`,
      `"${emp.fullName}"`,
      `"${emp.email}"`,
      `"${emp.department.name}"`,
      `"${emp.role}"`,
      emp.features.otHoursMonth,
      emp.features.overTime,
      emp.features.yearsAtCompany,
      emp.features.totalWorkingYears,
      emp.features.monthlyIncome,
      emp.features.numCompaniesWorked,
      emp.features.distanceFromHome,
      (emp.prediction.probability * 100).toFixed(1),
      emp.prediction.riskScore,
      `"${emp.prediction.riskLevel}"`,
      `"${emp.prediction.recommendedAction.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_nguy_co_thoi_viec_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 mb-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            Phân Hệ Trí Tuệ Nhân Tạo & Học Máy (Tuần 7)
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-red-500" />
            Dự Báo Nguy Cơ Thôi Việc & Giữ Chân Nhân Tài
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl">
            Mô hình Logistic Regression (AUC-ROC 71.60%) phân tích 6 đặc trưng định lượng từ dữ liệu chấm công và hợp đồng, giải trình trực quan theo chuẩn Explainable AI (XAI).
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc phòng ban */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút xuất CSV */}
          <button
            onClick={exportCsv}
            disabled={!data || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Xuất file CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất CSV
          </button>

          {/* Nút làm mới */}
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Đã xảy ra lỗi khi tải dữ liệu phân tích</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 lg:col-span-2 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      {data && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 1. KPI Cards */}
          <AttritionKpiCards summary={data.summary} />

          {/* 2. Biểu Đồ Recharts: Feature Importance (2 cột) & Phân Bổ Tỷ Lệ (1 cột) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FeatureImportanceChart data={data.featureImportance} />
            </div>
            <div>
              <RiskDistributionPieChart summary={data.summary} />
            </div>
          </div>

          {/* 3. Biểu Đồ Phân Bổ Nguy Cơ Theo Phòng Ban */}
          <DepartmentRiskChart data={data.departmentBreakdown} />

          {/* 4. Bảng Danh Sách Nhân Viên & Đánh Giá */}
          <EmployeeRiskTable
            employees={data.allEmployees}
            onSelectEmployee={(emp) => setSelectedEmployee(emp)}
          />

          {/* 5. Disclaimer & Ghi chú pháp lý */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-500" />
              <span>{data.disclaimer}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 hidden sm:inline">
              Model: Logistic Regression (IBM HR Attrition)
            </span>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Phân Tích XAI của từng nhân sự */}
      {selectedEmployee && (
        <EmployeeRiskDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};
