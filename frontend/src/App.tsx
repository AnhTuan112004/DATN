import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Code-split route-level pages with React.lazy
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })));
const LocationsPage = lazy(() => import('./pages/LocationsPage').then((m) => ({ default: m.LocationsPage })));
const KioskPage = lazy(() => import('./pages/KioskPage').then((m) => ({ default: m.KioskPage })));
const SpikeFaceBench = lazy(() => import('./features/face/SpikeFaceBench').then((m) => ({ default: m.SpikeFaceBench })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const LeaveRequestsPage = lazy(() => import('./pages/LeaveRequestsPage').then((m) => ({ default: m.LeaveRequestsPage })));
const PayrollPage = lazy(() => import('./pages/PayrollPage').then((m) => ({ default: m.PayrollPage })));
const AttritionAnalyticsPage = lazy(() => import('./pages/AttritionAnalyticsPage').then((m) => ({ default: m.AttritionAnalyticsPage })));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage').then((m) => ({ default: m.RecruitmentPage })));

const RouteLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full" role="status" aria-label="Đang tải trang">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      <span className="text-xs text-[var(--text-muted)] font-medium">Đang tải dữ liệu…</span>
    </div>
  </div>
);

/**
 * Điều hướng thông minh tại trang chủ:
 * - Nếu chưa đăng nhập: Hiển thị Landing Page giới thiệu công ty & cổng tuyển dụng nộp CV.
 * - Nếu đã đăng nhập: Hiển thị AppLayout và Bảng điều khiển nội bộ.
 */
const HomeOrLanding: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingFallback />;
  if (!isAuthenticated) return <LandingPage />;
  return <AppLayout />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* 1. Public Routes: Bất kỳ ai cũng có thể xem & nộp CV */}
              <Route path="/careers" element={<LandingPage />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Kiosk chấm công FaceID */}
              <Route
                path="/kiosk"
                element={
                  <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                    <KioskPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* 2. Root Route: Landing Page cho khách / AppLayout cho nhân viên */}
              <Route path="/" element={<HomeOrLanding />}>
                <Route index element={<DashboardPage />} />

                {/* Spike FaceID Benchmark */}
                <Route path="face-bench" element={<SpikeFaceBench />} />

                {/* Quản lý Nhân sự */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER', 'MANAGER']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Cây phòng ban */}
                <Route path="departments" element={<DepartmentsPage />} />

                {/* Cấu hình GPS Geofencing */}
                <Route
                  path="locations"
                  element={
                    <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                      <LocationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Chấm công GPS Geofencing di động */}
                <Route path="attendance" element={<AttendancePage />} />

                {/* Đơn từ & Phê duyệt 2 cấp */}
                <Route path="leave-requests" element={<LeaveRequestsPage />} />
                <Route path="leave" element={<Navigate to="/leave-requests" replace />} />

                {/* Bảng lương 2026 */}
                <Route path="payrolls" element={<PayrollPage />} />
                <Route path="payroll" element={<Navigate to="/payrolls" replace />} />

                {/* Dự báo thôi việc ML (Tuần 7) */}
                <Route
                  path="retention"
                  element={
                    <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                      <AttritionAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="analytics/attrition" element={<Navigate to="/retention" replace />} />

                {/* Tuyển dụng & Quản lý hồ sơ ứng viên (CEO & HR Manager) */}
                <Route
                  path="recruitment"
                  element={
                    <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                      <RecruitmentPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="jobs" element={<Navigate to="/recruitment" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
