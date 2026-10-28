import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full app-surface p-8">
        <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--danger-bg)] text-[var(--danger-text)] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--danger-bg)] text-[var(--danger-text)] text-xs font-medium mb-3">
          403 · Không có quyền truy cập
        </div>

        <h1 className="text-xl font-bold text-[var(--text)] mb-2">Truy cập bị từ chối</h1>
        <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
          Tài khoản của bạn ({user?.role || 'Chưa xác định'}) không có quyền truy cập trang này. Vui lòng liên hệ bộ phận nhân sự hoặc quản trị viên nếu bạn cần cấp quyền.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="app-button-secondary w-full sm:w-auto text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="app-button w-full sm:w-auto text-xs"
          >
            <Home className="w-4 h-4" /> Bảng điều khiển
          </button>
        </div>
      </div>
    </div>
  );
};
