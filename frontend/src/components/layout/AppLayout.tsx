import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  ScanFace,
  Search,
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
import { CommandPalette } from '../common/CommandPalette';
import { ThemeToggle } from '../common/ThemeToggle';
import { ErrorBoundary } from '../common/ErrorBoundary';

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
  const { user, refreshUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selfDetailModalOpen, setSelfDetailModalOpen] = useState(false);
  const [selfAvatarModalOpen, setSelfAvatarModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Phím tắt Ctrl+K để mở Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
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

  return (
    <div className="min-h-screen bg-bg text-fg flex">
      {/* Backdrop di động */}
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-2 border-line bg-surface transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b-2 border-line flex items-center justify-between bg-bg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime text-ink border-2 border-line shadow-hard-sm flex items-center justify-center text-xs font-display font-extrabold">
              PI
            </div>
            <span className="text-sm font-display font-extrabold text-fg tracking-tight">PeopleInsight</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
            className="p-1 md:hidden text-fg"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto bg-surface">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  active
                    ? 'bg-lime text-ink border-2 border-line shadow-hard-sm font-extrabold'
                    : 'text-fg/80 hover:bg-surface-2 hover:text-fg border-2 border-transparent font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-ink' : 'text-fg/70'}`} strokeWidth={active ? 2.4 : 1.8} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t-2 border-line bg-bg">
          <NavLink
            to="/landing"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-fg hover:bg-surface border border-transparent hover:border-line transition-colors"
          >
            <Globe className="w-4 h-4 text-status-emerald" strokeWidth={2} />
            <span>Cổng thông tin ngoài</span>
          </NavLink>
        </div>

        <div className="px-5 py-3 border-t-2 border-line/20 text-xs font-mono text-muted bg-bg">
          PeopleInsight · Neo-Brutalist
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-bg">
        {/* Header */}
        <header className="h-16 px-4 sm:px-6 border-b-2 border-line bg-surface flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
              className="p-2 md:hidden text-fg"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>

            {/* Breadcrumb thật theo trang hiện tại */}
            <nav aria-label="Đường dẫn trang" className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-muted">
              <span>HỆ THỐNG</span>
              <span>/</span>
              <span className="font-extrabold text-fg truncate max-w-[200px] uppercase">
                {currentTitle}
              </span>
            </nav>
          </div>

          {/* Ô tìm kiếm nhanh mở Command Palette (Ctrl+K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="relative hidden md:flex items-center text-left"
          >
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="w-56 lg:w-72 pl-9 pr-14 py-1.5 text-xs rounded-xl border-2 border-line bg-surface-2 text-fg/80 shadow-hard-sm hover:border-primary transition cursor-pointer font-medium">
              Tìm nhân viên, đơn từ...
            </div>
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink font-mono font-bold bg-lime border border-line px-1.5 py-0.5 rounded pointer-events-none">
              Ctrl K
            </kbd>
          </button>

          {/* Công cụ bên phải Header */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Nút chuyển theme Sáng / Tối */}
            <ThemeToggle />

            {/* Chuông thông báo */}
            <NotificationBell />

            {/* Menu người dùng */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((open) => !open)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-2 transition-colors border border-transparent hover:border-line cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-lime text-ink border-2 border-line shadow-hard-sm flex items-center justify-center text-xs font-display font-extrabold overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    user?.fullName?.charAt(0) || 'U'
                  )}
                </div>
                <span className="hidden sm:block max-w-48 truncate text-xs font-bold text-fg">
                  {user?.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted" strokeWidth={2} />
              </button>

              {userDropdownOpen && (
                <>
                  <button
                    aria-label="Đóng menu tài khoản"
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl bg-surface border-2 border-line shadow-hard py-1.5 animate-fadeIn">
                    <div className="px-3.5 py-2.5 border-b-2 border-line/20">
                      <p className="text-sm font-bold text-fg truncate">{user?.fullName}</p>
                      <p className="mt-0.5 text-xs text-muted truncate font-mono">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setSelfDetailModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left text-xs font-bold text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-primary" strokeWidth={2} />
                      Hồ sơ cá nhân
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/landing');
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left text-xs font-bold text-fg hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-status-emerald" strokeWidth={2} />
                      Trang giới thiệu & Tuyển dụng ngoài
                    </button>
                    <div className="my-1 border-t-2 border-line/20" />
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left text-xs font-bold text-status-rose hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2} />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 bg-bg text-fg">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenUserDetail={() => {
          setSelfDetailModalOpen(true);
        }}
        onOpenCreateLeave={() => navigate('/leave-requests')}
      />

      {/* Modal chi tiết & đổi avatar cá nhân */}
      {selfDetailModalOpen && user && (
        <UserDetailModal
          user={user as any}
          isOpen
          onClose={() => setSelfDetailModalOpen(false)}
          onUserUpdated={async () => {
            await refreshUser?.();
          }}
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
          onClose={() => {
            setSelfAvatarModalOpen(false);
            setSelfDetailModalOpen(true);
          }}
          onSuccess={async () => {
            await refreshUser?.();
            setSelfAvatarModalOpen(false);
            setSelfDetailModalOpen(true);
          }}
        />
      )}

      {/* Trợ lý AI */}
      <ChatWidget />
    </div>
  );
};

export default AppLayout;
