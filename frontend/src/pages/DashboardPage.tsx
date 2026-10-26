import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Video,
  Calculator,
  Bot,
  Cpu,
  Users,
  Building2,
  Clock,
  FileText,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  ScanFace,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleGreeting = (role?: string) => {
    switch (role) {
      case 'CEO':
        return 'Tổng Giám Đốc (CEO)';
      case 'HR_MANAGER':
        return 'Trưởng Phòng Nhân Sự (HR Manager)';
      case 'MANAGER':
        return 'Quản Lý Bộ Phận (Department Manager)';
      default:
        return 'Nhân Viên (Employee)';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-purple-900/50 border border-indigo-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Hệ thống Vận hành Trí tuệ Nhân tạo v6.1
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Xin chào, {user?.fullName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 font-medium">
              Bạn đang đăng nhập với tư cách <span className="text-indigo-300 font-bold">{getRoleGreeting(user?.role)}</span>. Chúc bạn một ngày làm việc hiệu quả!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4" /> Chấm Công Ngay
            </button>
            <button
              onClick={() => navigate('/kiosk')}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-2 cursor-pointer"
            >
              <ScanFace className="w-4 h-4 text-emerald-400" /> Mở Kiosk FaceID
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> 4 Trụ Cột Kỹ Thuật Cốt Lõi (v6.1 FINAL FREEZE)
          </h2>
          <span className="text-xs text-slate-400 font-medium">Nghiệm thu ĐATN 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: FaceID Kiosk */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition duration-300 shadow-xl group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                Liveness 2 Tầng
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-200 group-hover:text-emerald-300 transition">
              1. FaceID Kiosk Liveness
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              MediaPipe EAR/Yaw thời gian thực + Face Embedding 128 chiều, chặn 100% gian lận ảnh tĩnh 2D.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Hiệu năng: <b>54.5 FPS</b></span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>

          {/* Card 2: Payroll Engine 2026 */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition duration-300 shadow-xl group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                Luật Mới 2026
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-200 group-hover:text-amber-300 transition">
              2. Payroll Engine Chuẩn
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Biểu thuế 5 bậc, trần BHXH 46.8M/50.6M, giảm trừ 15.5M/6.2M, đối chiếu khớp 22 test case Excel.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Kiểm thử: <b>22/22 Pass</b></span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Pass
              </span>
            </div>
          </div>

          {/* Card 3: Chatbot HR Function Calling */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition duration-300 shadow-xl group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                Phương Án A
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-200 group-hover:text-cyan-300 transition">
              3. Chatbot Trợ Lý HR AI
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Gemini 3.x Function Calling + Render template tĩnh Markdown, triệt tiêu ảo giác và bảo vệ PII lương.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Độ trễ: <b>~1.8s</b></span>
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero-Leak
              </span>
            </div>
          </div>

          {/* Card 4: ML Retention Predictor */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition duration-300 shadow-xl group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                Học Máy
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-200 group-hover:text-purple-300 transition">
              4. Dự Báo Thôi Việc ML
            </h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Đúng 6 đặc trưng định lượng từ IBM Attrition, loại bỏ thiên kiến nhân khẩu học theo Điều 8 BLLĐ.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Mô hình: <b>Logistic/RF</b></span>
              <span className="text-purple-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 6 Features
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng Nhân Sự</p>
            <p className="text-2xl font-bold text-white mt-0.5">50</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Cơ Cấu Phòng Ban</p>
            <p className="text-2xl font-bold text-white mt-0.5">6</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Chấm Công Hôm Nay</p>
            <p className="text-2xl font-bold text-white mt-0.5">48 / 50</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Đơn Chờ Duyệt</p>
            <p className="text-2xl font-bold text-white mt-0.5">3</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/departments')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 group-hover:text-white">
                  Sơ Đồ Cây Phòng Ban (2 Cấp)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Khối chức năng & phòng ban trực thuộc, liên kết trưởng bộ phận.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/users')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200 group-hover:text-white">
                  Quản Lý Hồ Sơ Nhân Sự & Hợp Đồng
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Danh bạ 50 nhân sự, mảng hợp đồng contracts[], số dư phép Điều 114 BLLĐ.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </div>
        </div>
      </div>
    </div>
  );
};
