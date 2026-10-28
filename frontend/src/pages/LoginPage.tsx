import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-center items-center px-4 py-8">
      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius)] bg-[var(--accent)] text-white mb-3 text-lg font-bold">
            PI
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
            PeopleInsight
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Hệ thống quản lý nhân sự doanh nghiệp
          </p>

        </div>

        {/* Card Form */}
        <div className="app-surface p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[var(--text)]">Đăng nhập hệ thống</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Nhập tài khoản để tiếp tục</p>
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
              <label className="block text-xs font-medium text-[var(--text)] mb-1.5">Email doanh nghiệp</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ceo@peopleinsight.vn"
                  className="w-full app-input !pl-10 pr-4 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-[var(--text)] mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full app-input !pl-10 pr-10 py-2 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition"
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
              className="app-button w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection - Only in DEV */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" /> Tài khoản thử nghiệm (môi trường phát triển)
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Mật khẩu: Admin@123456</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ceo@peopleinsight.vn')}
                  className="p-2 rounded-[var(--radius)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] border border-[var(--border)] text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px]">
                    C
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-[var(--text)] group-hover:text-[var(--accent)] truncate">CEO</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">ceo@peopleinsight.vn</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('hr.huong@peopleinsight.vn')}
                  className="p-2 rounded-[var(--radius)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] border border-[var(--border)] text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px]">
                    HR
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-[var(--text)] group-hover:text-[var(--accent)] truncate">Quản lý nhân sự</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">hr.huong@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('mgr.it@peopleinsight.vn')}
                  className="p-2 rounded-[var(--radius)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] border border-[var(--border)] text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px]">
                    M
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-[var(--text)] group-hover:text-[var(--accent)] truncate">Trưởng phòng IT</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">mgr.it@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('huy.do@peopleinsight.vn')}
                  className="p-2 rounded-[var(--radius)] bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)] border border-[var(--border)] text-left transition flex items-center gap-2 group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center font-bold text-[10px]">
                    E
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-[var(--text)] group-hover:text-[var(--accent)] truncate">Nhân viên</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">huy.do@...</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} PeopleInsight. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </div>
  );
};
