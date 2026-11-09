import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
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
    <div className="min-h-screen bg-bg text-fg flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-lime selection:text-ink">
      {/* Container Chính Chia Đôi (Split-Screen) Phong cách Giấy & Mực Neobrutalism */}
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-line bg-surface shadow-hard-lg grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* =========================================================================
            CỘT TRÁI: FORM ĐĂNG NHẬP GIẤY & MỰC (7 CỘT)
            ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-surface">
          <div>
            {/* Header: Logo, Nút xem trang ngoài & Nút đổi Theme */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-line">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/landing')}
                title="Quay lại trang giới thiệu"
              >
                <div className="w-10 h-10 rounded-xl bg-lime text-ink border-2 border-line flex items-center justify-center font-black shadow-hard-xs group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition">
                  <Sparkles className="w-5 h-5 fill-ink text-ink" />
                </div>
                <div>
                  <div className="font-extrabold text-base tracking-tight text-fg flex items-center gap-1.5 font-display">
                    PeopleInsight{' '}
                    <span className="bg-lime text-ink px-1.5 py-0.2 rounded border border-line text-xs font-mono font-bold">
                      AI
                    </span>
                  </div>
                  <div className="text-[10px] text-muted font-mono tracking-wider">Enterprise HRM Platform v6.1</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/landing')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-fg hover:bg-surface-2 transition py-2 px-3 rounded-xl border-2 border-line shadow-hard-xs cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                  title="Xem trang giới thiệu"
                >
                  <Globe className="w-3.5 h-3.5 text-ink dark:text-lime" />
                  <span className="hidden sm:inline">Trang giới thiệu</span>
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Tiêu đề Đăng nhập */}
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg font-display">
                Đăng nhập tài khoản
              </h1>
              <p className="text-xs text-muted">
                Nhập thông tin xác thực để truy cập không gian làm việc nội bộ
              </p>
            </div>

            {/* Thông báo lỗi */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border-2 border-rose-500 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5 shadow-hard-xs animate-fadeIn">
                <span className="font-bold text-rose-600 dark:text-rose-400 text-base leading-none">⚠️</span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Form đăng nhập */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5 font-mono">
                  Email doanh nghiệp
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ceo@peopleinsight.vn"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-line bg-surface-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-ink dark:focus:border-lime shadow-hard-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-fg uppercase tracking-wider mb-1.5 font-mono">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-line bg-surface-2 text-sm text-fg placeholder:text-muted focus:outline-none focus:border-ink dark:focus:border-lime shadow-hard-xs transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition p-1"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-lime text-ink border-2 border-line font-black text-sm shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer uppercase tracking-wider font-display"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
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
          <div className="pt-4 border-t-2 border-line">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Tài khoản 1-Click (Hội đồng chấm)</span>
              </span>
              <span className="text-[10px] text-muted font-mono bg-surface-2 px-2 py-0.5 rounded border border-line">
                Pass: Admin@123456
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('ceo@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border-2 border-line hover:border-ink dark:hover:border-lime text-left transition flex items-center gap-2.5 group cursor-pointer shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-sky text-ink border-2 border-line font-bold text-xs flex items-center justify-center shrink-0">
                  👑
                </div>
                <div className="truncate">
                  <div className="font-bold text-fg group-hover:text-primary truncate">Ban Giám Đốc (CEO)</div>
                  <div className="text-[10px] text-muted font-mono truncate">ceo@peopleinsight.vn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hr.huong@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border-2 border-line hover:border-ink dark:hover:border-lime text-left transition flex items-center gap-2.5 group cursor-pointer shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-lime text-ink border-2 border-line font-bold text-xs flex items-center justify-center shrink-0">
                  👩‍💼
                </div>
                <div className="truncate">
                  <div className="font-bold text-fg group-hover:text-primary truncate">Trưởng phòng HR</div>
                  <div className="text-[10px] text-muted font-mono truncate">hr.huong@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('mgr.it@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border-2 border-line hover:border-ink dark:hover:border-lime text-left transition flex items-center gap-2.5 group cursor-pointer shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-lilac text-ink border-2 border-line font-bold text-xs flex items-center justify-center shrink-0">
                  👨‍💻
                </div>
                <div className="truncate">
                  <div className="font-bold text-fg group-hover:text-primary truncate">Trưởng phòng IT</div>
                  <div className="text-[10px] text-muted font-mono truncate">mgr.it@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('huy.do@peopleinsight.vn')}
                className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface border-2 border-line hover:border-ink dark:hover:border-lime text-left transition flex items-center gap-2.5 group cursor-pointer shadow-hard-xs active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-peach text-ink border-2 border-line font-bold text-xs flex items-center justify-center shrink-0">
                  🧑‍💻
                </div>
                <div className="truncate">
                  <div className="font-bold text-fg group-hover:text-primary truncate">Nhân viên (Employee)</div>
                  <div className="text-[10px] text-muted font-mono truncate">huy.do@...</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            CỘT PHẢI: VISUAL SHOWCASE 4 TRỤ CỘT AI (5 CỘT)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-surface-2 border-t-2 lg:border-t-0 lg:border-l-2 border-line p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border-2 border-line text-xs font-bold text-fg shadow-hard-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Multi-tenant Fail-Closed</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-fg tracking-tight font-display">
              Hệ sinh thái Quản trị Nhân sự &amp; AI 2026
            </h2>

            {/* 4 Trụ Cột AI Cốt Lõi */}
            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface border-2 border-line flex items-start gap-3 shadow-hard-xs">
                <div className="w-8 h-8 rounded-xl bg-sky text-ink border-2 border-line flex items-center justify-center shrink-0 mt-0.5 shadow-hard-xs">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-fg">FaceID Kiosk Sinh trắc học 2 tầng</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                    Kiểm tra độ sống (Eye Blink &amp; Head Yaw), Challenge Nonce 60s và mã hóa AES-256 an toàn.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border-2 border-line flex items-start gap-3 shadow-hard-xs">
                <div className="w-8 h-8 rounded-xl bg-lime text-ink border-2 border-line flex items-center justify-center shrink-0 mt-0.5 shadow-hard-xs">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-fg">Payroll Engine chuẩn Pháp lý 2026</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                    Biểu thuế lũy tiến 5 bậc mới, miễn thuế TNCN toàn phần tiền làm thêm giờ (OT) theo Điều 98.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border-2 border-line flex items-start gap-3 shadow-hard-xs">
                <div className="w-8 h-8 rounded-xl bg-lilac text-ink border-2 border-line flex items-center justify-center shrink-0 mt-0.5 shadow-hard-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-fg">Trợ lý HR AI Phương án A</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                    Ép Function Calling Gemini, ngắt luồng ngoài để tự kết xuất phiếu lương và ngày phép an toàn.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border-2 border-line flex items-start gap-3 shadow-hard-xs">
                <div className="w-8 h-8 rounded-xl bg-peach text-ink border-2 border-line flex items-center justify-center shrink-0 mt-0.5 shadow-hard-xs">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-fg">Dự báo thôi việc Machine Learning</div>
                  <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                    Mô hình 6 đặc trưng định lượng chuẩn IBM HR Attrition, hỗ trợ kế hoạch giữ chân nhân tài.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-line text-[11px] text-muted flex items-center justify-between font-mono font-medium">
            <span>Đại học Nguyễn Trãi • Khoa CNTT</span>
            <span className="px-2 py-0.5 rounded border border-line bg-surface font-bold text-fg">
              ISO/IEC 30107-3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
