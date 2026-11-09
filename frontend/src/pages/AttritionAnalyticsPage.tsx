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
import { getAttritionOverview, AttritionOverviewData, AnalyzedEmployee, DepartmentBreakdown } from '../api/analytics';
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
  const [cachedBreakdown, setCachedBreakdown] = useState<DepartmentBreakdown[]>([]);
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
      if (selectedDeptId === 'ALL' && res.departmentBreakdown && res.departmentBreakdown.length > 0) {
        setCachedBreakdown(res.departmentBreakdown);
      }
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
    const employeesToExport = data?.allEmployees || [];
    if (employeesToExport.length === 0) {
      alert('Không có dữ liệu nhân sự để xuất file CSV.');
      return;
    }

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

    const rows = employeesToExport.map((emp) => {
      const rec = emp.prediction?.recommendedAction || emp.prediction?.recommendation || 'Duy trì chính sách đãi ngộ và khen thưởng định kỳ.';
      return [
        `"${emp.employeeCode || ''}"`,
        `"${emp.fullName || ''}"`,
        `"${emp.email || ''}"`,
        `"${emp.department?.name || 'Chưa phân bổ'}"`,
        `"${emp.role || ''}"`,
        emp.features?.otHoursMonth ?? 0,
        emp.features?.overTime ?? 0,
        emp.features?.yearsAtCompany ?? 0,
        emp.features?.totalWorkingYears ?? 0,
        emp.features?.monthlyIncome ?? 0,
        emp.features?.numCompaniesWorked ?? 0,
        emp.features?.distanceFromHome ?? 0,
        emp.prediction?.probability ? (emp.prediction.probability * 100).toFixed(1) : '0.0',
        emp.prediction?.riskScore ?? 0,
        `"${emp.prediction?.riskLevel || 'LOW'}"`,
        `"${rec.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const deptName = departments.find((d) => d._id === selectedDeptId)?.name?.replace(/[\s/]/g, '_') || 'toan_cong_ty';
    link.download = `bao_cao_nguy_co_thoi_viec_${new Date().toISOString().split('T')[0]}_${deptName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header - Asymmetric Text Dominant */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">
              AI Retention · Chuẩn IBM HR
            </span>
            <button
              onClick={() => setShowModelDrawer(true)}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-800 transition cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
              <span>Cách mô hình đánh giá</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-rose-500" />
            <span>Dự báo thôi việc &amp; Giữ chân nhân sự</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Phân tích 6 yếu tố định lượng từ dữ liệu chấm công và hợp đồng theo mô hình Logistic Regression để nhận diện sớm nguy cơ thôi việc.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bộ lọc phòng ban */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs shadow-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
              className="bg-slate-900 text-slate-100 font-semibold focus:outline-none cursor-pointer border-0 py-0.5 text-xs"
            >
              <option value="ALL" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                🏢 Tất cả phòng ban
              </option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nút xuất CSV */}
          <button
            type="button"
            onClick={exportCsv}
            disabled={!data || loading || !data.allEmployees || data.allEmployees.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Xuất file CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-200" />
            <span>Xuất CSV</span>
          </button>

          {/* Nút làm mới */}
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Thanh Lọc Phòng Ban Nhanh Dạng Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedDeptId('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
            selectedDeptId === 'ALL'
              ? 'bg-teal-700 text-white border-teal-600 shadow-teal-700/25 ring-2 ring-teal-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tất cả phòng ban</span>
          {data && <span className="text-[10px] opacity-75">({data.summary.totalEmployees})</span>}
        </button>

        {departments.map((dept) => {
          const isSelected = selectedDeptId === dept._id;
          const activeBreakdown = selectedDeptId === 'ALL' ? data?.departmentBreakdown : (cachedBreakdown.length > 0 ? cachedBreakdown : data?.departmentBreakdown);
          const deptStat = activeBreakdown?.find((d) => d.departmentId === dept._id || d.departmentName === dept.name);

          return (
            <button
              key={dept._id}
              type="button"
              onClick={() => setSelectedDeptId(dept._id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border shadow-sm ${
                isSelected
                  ? 'bg-teal-700 text-white border-teal-600 shadow-teal-700/25 ring-2 ring-teal-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
            >
              <span>{dept.name}</span>
              {deptStat && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    deptStat.highRiskCount > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {deptStat.totalEmployees} NV {deptStat.highRiskCount > 0 && `• ${deptStat.highRiskCount} rủi ro`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Banner thông báo khi đang xem riêng 1 phòng ban */}
      {selectedDeptId !== 'ALL' && (
        <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-between flex-wrap gap-2 text-xs shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5 text-teal-200">
            <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              Đang xem phân tích rủi ro riêng của: <strong className="text-white text-sm">{departments.find((d) => d._id === selectedDeptId)?.name || 'Phòng ban'}</strong> ({data?.summary.totalEmployees} nhân sự)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDeptId('ALL')}
            className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold transition cursor-pointer shadow-sm text-xs"
          >
            ← Quay lại xem Toàn công ty
          </button>
        </div>
      )}

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

          {/* 3.1. Lưới Thẻ Phân Tích Rủi Ro Chi Tiết Từng Phòng Ban */}
          {selectedDeptId === 'ALL' && data.departmentBreakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Chỉ số rủi ro chi tiết theo từng phòng ban</span>
                </div>
                <span className="text-xs text-slate-400">Bấm vào phòng ban để xem phân tích riêng</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.departmentBreakdown.map((dept) => {
                  const matchingDept = departments.find((d) => d.name === dept.departmentName);
                  const targetDeptId = dept.departmentId || matchingDept?._id;

                  return (
                    <div
                      key={dept.departmentName}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition-all shadow-md flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                            {dept.departmentName}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              dept.averageRiskScore >= 50
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : dept.averageRiskScore >= 35
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {dept.averageRiskScore}/100
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Tổng số: <strong className="text-slate-200">{dept.totalEmployees}</strong> nhân sự
                        </div>

                        {/* Thanh phân bổ rủi ro */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-rose-400">Nguy cơ cao: {dept.highRiskCount}</span>
                            <span className="text-amber-400">Trung bình: {dept.mediumRiskCount}</span>
                            <span className="text-emerald-400">Ổn định: {dept.lowRiskCount}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                            <div
                              style={{ width: `${(dept.highRiskCount / dept.totalEmployees) * 100}%` }}
                              className="bg-rose-500 h-full"
                              title={`Nguy cơ cao: ${dept.highRiskCount}`}
                            />
                            <div
                              style={{ width: `${(dept.mediumRiskCount / dept.totalEmployees) * 100}%` }}
                              className="bg-amber-500 h-full"
                              title={`Trung bình: ${dept.mediumRiskCount}`}
                            />
                            <div
                              style={{ width: `${(dept.lowRiskCount / dept.totalEmployees) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Ổn định: ${dept.lowRiskCount}`}
                            />
                          </div>
                        </div>
                      </div>

                      {targetDeptId && (
                        <button
                          type="button"
                          onClick={() => setSelectedDeptId(targetDeptId)}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-teal-700 hover:text-white text-teal-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-1"
                        >
                          <span>Xem riêng phòng này</span>
                          <span className="text-sm">➔</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
