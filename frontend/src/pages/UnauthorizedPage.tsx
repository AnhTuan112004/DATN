import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold mb-3">
          403 FORBIDDEN
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">Truy Cập Bị Từ Chối</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Tài khoản của bạn ({user?.role || 'Chưa xác định'}) không có quyền hạn truy cập tài nguyên này theo chính sách bảo mật RBAC của hệ thống.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Bảng Điều Khiển
          </button>
        </div>
      </div>
    </div>
  );
};
