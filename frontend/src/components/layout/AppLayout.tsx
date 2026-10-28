import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Moon,
  ScanFace,
  Search,
  Sun,
  TrendingDown,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth';
import { UserDetailModal } from '../users/UserDetailModal';
import { AvatarUploadModal } from '../users/AvatarUploadModal';
import { NotificationBell } from '../notifications/NotificationBell';
import { ChatWidget } from '../chat/ChatWidget';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { name: 'Bảng điều khiển', path: '/', icon: LayoutDashboard },
  { name: 'Hồ sơ nhân sự', path: '/users', icon: Users, roles: ['CEO', 'HR_MANAGER', 'MANAGER'] },
  { name: 'Phòng ban', path: '/departments', icon: Building2 },
  { name: 'Địa điểm', path: '/locations', icon: MapPin, roles: ['CEO', 'HR_MANAGER'] },
  { name: 'Chấm công', path: '/attendance', icon: Clock },
  { name: 'Kiosk', path: '/kiosk', icon: ScanFace, roles: ['CEO', 'HR_MANAGER'] },
  { name: 'Đơn từ', path: '/leave-requests', icon: FileText },
  { name: 'Bảng lương', path: '/payrolls', icon: Calculator },
  { name: 'Dự báo thôi việc', path: '/retention', icon: TrendingDown, roles: ['CEO', 'HR_MANAGER'] },
  { name: 'Tuyển dụng', path: '/recruitment', icon: BriefcaseBusiness, roles: ['CEO', 'HR_MANAGER'] },
];

const pageTitleMap: Record<string, string> = {
  '/': 'Bảng điều khiển',
  '/users': 'Hồ sơ nhân sự',
  '/departments': 'Cơ cấu phòng ban',
  '/locations': 'Địa điểm chấm công',
  '/attendance': 'Nhật ký chấm công',
  '/kiosk': 'Kiosk khuôn mặt',
  '/leave-requests': 'Quản lý đơn từ',
  '/payrolls': 'Bảng lương 2026',
  '/retention': 'Dự báo thôi việc',
  '/recruitment': 'Tuyển dụng',
};

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selfDetailModalOpen, setSelfDetailModalOpen] = useState(false);
  const [selfAvatarModalOpen, setSelfAvatarModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mặc định giao diện SÁNG (Light Mode).
  // Tự động dọn cờ dark cũ để đưa giao diện về chuẩn sáng thanh lịch
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('pi_theme_dark') !== null) {
        localStorage.removeItem('pi_theme_dark');
        localStorage.setItem('pi_theme_mode', 'light');
        return false;
      }
      return localStorage.getItem('pi_theme_mode') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('pi_theme_mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('pi_theme_mode', 'light');
    }
  }, [darkMode]);

  // Phím tắt Ctrl+K để nhảy nhanh vào ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredItems = navItems.filter((item) => !item.roles || hasRole(item.roles));
  const currentTitle = pageTitleMap[location.pathname] || 'Trang quản trị';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/users?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex">
      {/* Backdrop di động */}
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent)] text-white flex items-center justify-center text-xs font-semibold">
              PI
            </div>
            <span className="text-sm font-semibold">PeopleInsight</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
            className="p-1 md:hidden text-[var(--text-muted)]"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[var(--accent)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-[var(--border)] text-xs leading-5 text-[var(--text-muted)]">
          Quản lý nhân sự trong một nơi.
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
              className="p-2 md:hidden text-[var(--text-muted)]"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Breadcrumb thật theo trang hiện tại */}
            <nav aria-label="Đường dẫn trang" className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>Hệ thống</span>
              <span>/</span>
              <span className="font-medium text-[var(--text)] truncate max-w-[200px]">
                {currentTitle}
              </span>
            </nav>
          </div>

          {/* Ô tìm kiếm nhanh (Ctrl+K) */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh nhân viên, đơn từ..."
              className="w-56 lg:w-72 pl-8 pr-14 py-1.5 text-xs rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono pointer-events-none">
              Ctrl K
            </kbd>
          </form>

          {/* Công cụ bên phải Header */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Chuyển theme Sáng / Tối */}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
              className="p-2 rounded-[var(--radius)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>

            {/* Chuông thông báo */}
            <NotificationBell />

            {/* Menu người dùng */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-[var(--radius)] p-1 hover:bg-[var(--surface-muted)] transition-colors"
              >
                <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-xs font-semibold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block max-w-32 truncate text-sm font-medium">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
              </button>

              {userDropdownOpen && (
                <>
                  <button
                    aria-label="Đóng menu tài khoản"
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-56 app-surface py-1">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium truncate">{user?.fullName}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setSelfDetailModalOpen(true);
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left text-sm hover:bg-[var(--surface-muted)] transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
                      Hồ sơ cá nhân
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2.5 flex items-center gap-2 text-left text-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24">
          <Outlet />
        </main>
      </div>

      {/* Modal chi tiết & đổi avatar cá nhân */}
      {selfDetailModalOpen && user && (
        <UserDetailModal
          user={user as any}
          isOpen
          onClose={() => setSelfDetailModalOpen(false)}
          onUserUpdated={() => {}}
          onOpenAvatarUpload={() => {
            setSelfDetailModalOpen(false);
            setSelfAvatarModalOpen(true);
          }}
        />
      )}
      {selfAvatarModalOpen && user && (
        <AvatarUploadModal
          user={user as any}
          isOpen
          onClose={() => setSelfAvatarModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {/* Trợ lý AI */}
      <ChatWidget />
    </div>
  );
};

export default AppLayout;
