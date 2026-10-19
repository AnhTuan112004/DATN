import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { SpikeFaceBench } from './features/face/SpikeFaceBench';
import { ModulePlaceholder } from './components/common/ModulePlaceholder';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
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
                  <ModulePlaceholder
                    title="Quản Lý Hồ Sơ Nhân Sự & Hợp Đồng"
                    moduleCode="HRM-USERS"
                    weekSchedule="Tuần 1 (Đã hoàn thiện Backend API, đang dựng UI)"
                    description="Quản trị danh bạ 50 nhân viên, mảng hợp đồng lao động contracts[], tính toán số dư phép năm theo Điều 114 BLLĐ và phân cấp quản lý."
                    pillars={[
                      'Tự động sinh mã NVxxxx chuẩn liên tục.',
                      'Projection an toàn: Tuyệt đối ẩn salaryConfig và refreshTokens[].',
                      'Bảo vệ IDOR: Quản lý cấm xem lương nhân viên.',
                      'Upload ảnh đại diện Cloudinary auto-crop 400x400 face.',
                    ]}
                  />
                </ProtectedRoute>
              }
            />

            {/* Cây phòng ban */}
            <Route
              path="departments"
              element={
                <ModulePlaceholder
                  title="Sơ Đồ Tổ Chức Cây Phòng Ban (2 Cấp)"
                  moduleCode="HRM-DEPTS"
                  weekSchedule="Tuần 1 (Đã hoàn thiện Backend API, đang dựng UI)"
                  description="Cơ cấu tổ chức doanh nghiệp chuẩn tối đa 2 cấp (Khối -> Phòng ban), liên kết trưởng bộ phận và đếm nhân sự trực thuộc."
                  pillars={[
                    'Giới hạn nghiêm ngặt tối đa 2 cấp (Khối -> Phòng ban).',
                    'Chặn xóa phòng ban cha khi còn con hoặc nhân sự trực thuộc.',
                    'Tổng hợp số lượng nhân viên qua MongoDB Aggregation.',
                  ]}
                />
              }
            />

            {/* Chấm công Kiosk FaceID, GPS, QR */}
            <Route
              path="attendance"
              element={
                <ModulePlaceholder
                  title="Chấm Công Thông Minh (FaceID Kiosk, GPS, QR)"
                  moduleCode="KIOSK-ATTENDANCE"
                  weekSchedule="Tuần 2 (23–29/10/2026)"
                  description="Hệ thống chấm công sinh trắc học 2 tầng: MediaPipe Liveness tại Client + Face Embedding 128 chiều so khớp phía Server, kết hợp GPS Geofencing và Dynamic QR."
                  pillars={[
                    'Tầng 1 Liveness: Kiểm tra chớp mắt, há miệng và xoay đầu 25 độ.',
                    'Thử thách Nonce dùng 1 lần, hết hạn 60 giây.',
                    'Server so khớp Euclid <= 0.60, Cosine <= 0.35.',
                    'Chống giả mạo 100%, tuân thủ Luật BVDLCN 91/2025/QH15.',
                  ]}
                />
              }
            />

            {/* Đơn từ & Phê duyệt 2 cấp */}
            <Route
              path="leave-requests"
              element={
                <ModulePlaceholder
                  title="Quản Lý Đơn Từ & Phê Duyệt 2 Cấp"
                  moduleCode="LEAVE-WORKFLOW"
                  weekSchedule="Tuần 3 (30/10–05/11/2026)"
                  description="Quy trình nộp và phê duyệt đơn nghỉ phép, làm thêm giờ OT, làm việc từ xa WFH, quên chấm công theo luồng cố định 2 cấp (Manager -> HR)."
                  pillars={[
                    'Loại đơn: ANNUAL, SICK, OT, WFH, FORGOT_CHECKIN.',
                    'Luồng duyệt cố định 2 cấp: Manager -> HR Manager.',
                    'Trừ số dư phép nguyên tử qua MongoDB Transaction.',
                    'Thông báo thời gian thực qua Socket.io.',
                  ]}
                />
              }
            />

            {/* Bảng lương 2026 */}
            <Route
              path="payrolls"
              element={
                <ModulePlaceholder
                  title="Bảng Lương Doanh Nghiệp Chuẩn Pháp Lý 2026"
                  moduleCode="PAYROLL-2026"
                  weekSchedule="Tuần 4–5 (06–19/11/2026)"
                  description="Công cụ tính lương và thuế TNCN chuẩn theo Luật thuế TNCN mới 2026, 2 mốc chính sách trước và sau 01/07/2026, đã kiểm thử khớp 22 test case Excel."
                  pillars={[
                    'Biểu thuế lũy tiến 5 bậc mới (10M, 30M, 60M, 100M).',
                    'Giảm trừ bản thân 15.5M, người phụ thuộc 6.2M/người.',
                    '2 mốc trần BHXH 46.8M / 50.6M và ăn ca 730k / 1.2M.',
                    'Khóa kỳ lương nguyên tử periodLockedAt, chặn sửa dữ liệu nguồn.',
                  ]}
                />
              }
            />

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
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
