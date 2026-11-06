import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ScanFace,
  Calculator,
  Bot,
  TrendingDown,
  Globe,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorMsg(error.response?.data?.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Container Chính Chia Đôi (Split-Screen) Đẳng Cấp */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-slate-800 bg-[#0d1322] shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* =========================================================================
            CỘT TRÁI: FORM ĐĂNG NHẬP HIỆN ĐẠI (7 CỘT)
            ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            {/* Logo & Navigation Ngoài */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/landing')}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-600/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                    PeopleInsight <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">AI</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Enterprise HRM Platform v6.1</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/landing')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xem trang ngoài</span>
              </button>
            </div>

            {/* Tiêu đề Đăng nhập */}
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">Đăng nhập tài khoản</h1>
              <p className="text-xs text-slate-400">
                Nhập thông tin xác thực để truy cập không gian làm việc nội bộ
              </p>
            </div>

            {/* Thông báo lỗi */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <span className="font-bold text-rose-400 text-sm">⚠️</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Form đăng nhập */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email doanh nghiệp
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ceo@peopleinsight.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900/90 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực thông tin...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Khối Chọn Nhanh Tài Khoản Thử Nghiệm (Demo Accounts 1-Click) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tài khoản thử nghiệm 1-Click (Dành cho Hội đồng chấm)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mật khẩu: Admin@123456</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('ceo@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  👑
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-blue-400 truncate">Ban Giám Đốc (CEO)</div>
                  <div className="text-[10px] text-slate-500 truncate">ceo@peopleinsight.vn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hr.huong@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-900/30 border border-slate-800 hover:border-indigo-500/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                  👩‍💼
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-400 truncate">Trưởng phòng HR</div>
                  <div className="text-[10px] text-slate-500 truncate">hr.huong@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('mgr.it@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-purple-900/30 border border-slate-800 hover:border-purple-500/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                  👨‍💻
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-purple-400 truncate">Trưởng phòng IT</div>
                  <div className="text-[10px] text-slate-500 truncate">mgr.it@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('huy.do@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-900/30 border border-slate-800 hover:border-emerald-500/50 text-left transition flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                  🧑‍💻
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-400 truncate">Nhân viên (Employee)</div>
                  <div className="text-[10px] text-slate-500 truncate">huy.do@...</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CỘT PHẢI: VISUAL SHOWCASE 4 TRỤ CỘT AI (5 CỘT)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950 via-[#0e162b] to-[#070b14] border-t lg:border-t-0 lg:border-l border-slate-800 p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="space-y-6 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo mật Multi-tenant Fail-Closed</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Hệ sinh thái Quản trị Nhân sự &amp; Trí tuệ Nhân tạo 2026
            </h2>

            {/* 4 Trụ Cột AI Cốt Lõi */}
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">FaceID Kiosk Sinh trắc học 2 tầng</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Kiểm tra độ sống (Eye Blink &amp; Head Yaw), Challenge Nonce 60s và mã hóa AES-256 an toàn.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Payroll Engine chuẩn Pháp lý 2026</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Biểu thuế lũy tiến 5 bậc mới, miễn thuế TNCN toàn phần tiền làm thêm giờ (OT) theo Điều 98.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Trợ lý HR AI Phương án A</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ép Function Calling Gemini, ngắt luồng ngoài để tự kết xuất phiếu lương và ngày phép an toàn.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100">Dự báo thôi việc Machine Learning</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Mô hình 6 đặc trưng định lượng chuẩn IBM HR Attrition, hỗ trợ kế hoạch giữ chân nhân tài.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Đại học Nguyễn Trãi • Khoa CNTT</span>
            <span className="font-mono text-indigo-300">ISO/IEC 30107-3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
