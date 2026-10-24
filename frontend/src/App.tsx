import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { LocationsPage } from './pages/LocationsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { KioskPage } from './pages/KioskPage';
import { SpikeFaceBench } from './features/face/SpikeFaceBench';
import { AttendancePage } from './pages/AttendancePage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { PayrollPage } from './pages/PayrollPage';
import { ModulePlaceholder } from './components/common/ModulePlaceholder';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/kiosk"
            element={
              <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                <KioskPage />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes (Yêu cầu Đăng nhập & Xác thực Tenant) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / Trang chủ */}
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

            {/* Dự báo thôi việc ML */}
            <Route
              path="retention"
              element={
                <ProtectedRoute allowedRoles={['CEO', 'HR_MANAGER']}>
                  <ModulePlaceholder
                    title="Dự Báo Thôi Việc Bằng Học Máy (ML Retention Predictor)"
                    moduleCode="AI-RETENTION"
                    weekSchedule="Tuần 7 (27/11–03/12/2026)"
                    description="Mô hình Machine Learning dự báo nguy cơ nghỉ việc dựa trên 6 đặc trưng định lượng từ tập dữ liệu IBM HR Attrition, minh bạch Feature Importance."
                    pillars={[
                      'Đúng 6 đặc trưng định lượng: OverTime, YearsAtCompany, TotalWorkingYears, MonthlyIncome, NumCompaniesWorked, DistanceFromHome.',
                      'Loại bỏ Gender, Age, MaritalStatus chống thiên kiến Điều 8 BLLĐ.',
                      'Chạy mô hình Logistic Regression / Random Forest qua onnxruntime.',
                      'Gợi ý giải pháp giữ chân nhân tài cho cấp quản trị.',
                    ]}
                  />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
  );
};

export default App;
