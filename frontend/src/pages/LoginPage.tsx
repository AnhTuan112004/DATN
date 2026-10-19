import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

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
    setPassword('Password123@');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-slate-100">
      {/* Background Decorative Mesh Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-blue-600/15 to-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/25 mb-4 border border-indigo-400/30">
            <span className="font-extrabold text-2xl text-white tracking-wider">PI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            PeopleInsight AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Hệ thống Quản lý Nhân sự Doanh nghiệp Tích hợp Trí tuệ Nhân tạo
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-semibold text-indigo-300 mt-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> v6.1 FINAL FREEZE • Multi-tenant Fail-Closed
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-200">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs text-slate-400 mt-0.5">Nhập tài khoản được cấp bởi Quản trị viên để tiếp tục</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <span className="font-bold text-red-400">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Doanh Nghiệp</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ceo@peopleinsight.vn"
                  className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật Khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tài khoản Demo nhanh (1 Click)
              </span>
              <span className="text-[10px] text-slate-500">Mật khẩu: Password123@</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('ceo@peopleinsight.vn')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-left transition flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                  C
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-white truncate">CEO</div>
                  <div className="text-[10px] text-slate-400 truncate">Toàn quyền hệ thống</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hr@peopleinsight.vn')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                  HR
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-white truncate">HR Manager</div>
                  <div className="text-[10px] text-slate-400 truncate">Nhân sự & Lương</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('manager@peopleinsight.vn')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-left transition flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  M
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-white truncate">Manager</div>
                  <div className="text-[10px] text-slate-400 truncate">Duyệt đơn cấp 1</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('employee@peopleinsight.vn')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition flex items-center gap-2 group"
              >
                <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  E
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 group-hover:text-white truncate">Employee</div>
                  <div className="text-[10px] text-slate-400 truncate">Chấm công, Xem lương</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Đề tài ĐATN: PeopleInsight AI • ĐH Nguyễn Trãi (K23CNT1) • v6.1 FINAL FREEZE
        </div>
      </div>
    </div>
  );
};
