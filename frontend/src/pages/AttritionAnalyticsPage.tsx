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
  const [showModelDrawer, setShowModelDrawer] = useState(false);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 app-surface p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight flex items-center gap-2.5">
              <TrendingDown className="w-6 h-6 text-rose-500" />
              Dự báo thôi việc & Giữ chân nhân sự
            </h1>
            <button
              onClick={() => setShowModelDrawer(true)}
              className="text-xs text-[var(--accent)] hover:underline ml-2 font-medium"
            >
              Cách mô hình đánh giá
            </button>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl">
            Phân tích 6 yếu tố từ dữ liệu chấm công và hợp đồng để nhận diện sớm nguy cơ thôi việc và đề xuất hành động hỗ trợ kịp thời.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc phòng ban */}
          <div className="flex items-center gap-1.5 bg-[var(--surface-muted)] border border-[var(--border)] px-3 py-2 rounded-xl text-xs">
            <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-transparent text-[var(--text)] font-medium focus:outline-none cursor-pointer"
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
            className="app-button-secondary text-xs h-9 min-h-0 py-1.5 px-3"
            title="Xuất file CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất CSV
          </button>

          {/* Nút làm mới */}
          <button
            onClick={loadData}
            disabled={loading}
            className="app-button text-xs h-9 min-h-0 py-1.5 px-3.5"
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
              <div key={i} className="h-28 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 lg:col-span-2 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
            <div className="h-80 rounded-xl bg-[var(--surface-muted)] animate-pulse" />
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      {data && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* 1. KPI Cards */}
          <AttritionKpiCards summary={data.summary} />

          {/* 2. Biểu Đồ Recharts */}
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

          {/* 5. Ghi chú */}
          <div className="p-4 app-surface flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[var(--accent)]" />
              <span>{data.disclaimer}</span>
            </div>
            <button
              onClick={() => setShowModelDrawer(true)}
              className="text-xs text-[var(--accent)] hover:underline font-medium"
            >
              Xem chi tiết cơ chế đánh giá
            </button>
          </div>
        </div>
      )}

      {/* Drawer Giải Thích Cách Mô Hình Đánh Giá */}
      {showModelDrawer && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-drawer-title"
        >
          <div className="h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h2 id="model-drawer-title" className="text-base font-semibold text-[var(--text)]">
                  Cách mô hình đánh giá nguy cơ
                </h2>
                <button
                  onClick={() => setShowModelDrawer(false)}
                  aria-label="Đóng"
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs leading-5 text-[var(--text-muted)]">
                <p>
                  Mô hình phân tích dựa trên <strong className="text-[var(--text)]">6 yếu tố định lượng khách quan</strong> được tổng hợp từ dữ liệu chấm công và hợp đồng lao động:
                </p>

                <ul className="list-disc pl-4 space-y-1.5 text-[var(--text)]">
                  <li><strong>Tần suất làm thêm giờ (OT):</strong> Tổng số giờ OT trong 30 ngày gần nhất (ngưỡng từ 4 giờ trở lên bắt đầu tác động tới nguy cơ kiệt sức).</li>
                  <li><strong>Thâm niên tại công ty:</strong> Thời gian gắn bó liên tục với doanh nghiệp.</li>
                  <li><strong>Tổng số năm làm việc:</strong> Tổng kinh nghiệm tích lũy trong sự nghiệp.</li>
                  <li><strong>Mức thu nhập:</strong> Mức lương cơ bản quy đổi theo phân vị nội bộ.</li>
                  <li><strong>Số công ty từng làm:</strong> Số lượng đơn vị công tác trước đây.</li>
                  <li><strong>Khoảng cách đi làm:</strong> Quãng đường từ nơi cư trú đến văn phòng làm việc.</li>
                </ul>

                <div className="p-3 rounded-[var(--radius)] bg-[var(--surface-muted)] border border-[var(--border)] space-y-1 mt-4">
                  <p className="font-semibold text-[var(--text)]">Ngưỡng phân loại nguy cơ:</p>
                  <p>• <span className="text-emerald-600 font-medium">Ổn định:</span> Xác suất dưới 30%</p>
                  <p>• <span className="text-amber-600 font-medium">Trung bình:</span> Xác suất từ 30% đến 49%</p>
                  <p>• <span className="text-rose-600 font-medium">Nguy cơ cao:</span> Xác suất từ 50% trở lên</p>
                </div>

                <div className="p-3 rounded-[var(--radius)] bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] leading-4 mt-3">
                  <strong>Tuân thủ pháp luật:</strong> Hệ thống tuyệt đối không thu thập và không sử dụng các yếu tố độ tuổi, giới tính hoặc tình trạng hôn nhân để tránh định kiến và tuân thủ Điều 8 Bộ luật Lao động.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setShowModelDrawer(false)}
                className="w-full app-button-secondary text-xs py-2"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Đánh Giá của từng nhân sự */}
      {selectedEmployee && (
        <EmployeeRiskDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};
