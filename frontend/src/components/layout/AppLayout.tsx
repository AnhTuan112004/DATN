import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  FileText,
  Calculator,
  TrendingDown,
  Video,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  MapPin,
  ScanFace,
} from 'lucide-react';
import { Role } from '../../types/auth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  badge?: string;
}

export const AppLayout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Bảng Điều Khiển',
      path: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Hồ Sơ Nhân Sự',
      path: '/users',
      icon: Users,
      roles: ['CEO', 'HR_MANAGER', 'MANAGER'],
    },
    {
      name: 'Cây Phòng Ban',
      path: '/departments',
      icon: Building2,
    },
    {
      name: 'Địa Điểm GPS',
      path: '/locations',
      icon: MapPin,
      roles: ['CEO', 'HR_MANAGER'],
    },
    {
      name: 'Chấm Công FaceID/GPS',
      path: '/attendance',
      icon: Clock,
      badge: 'FaceID',
    },
    {
      name: 'Kiosk FaceID (Live)',
      path: '/kiosk',
      icon: ScanFace,
      roles: ['CEO', 'HR_MANAGER'],
      badge: 'Live',
    },
    {
      name: 'Quản Lý Đơn Từ',
      path: '/leave-requests',
      icon: FileText,
    },
    {
      name: 'Bảng Lương 2026',
      path: '/payrolls',
      icon: Calculator,
      badge: 'Luật mới',
    },
    {
      name: 'Dự Báo Thôi Việc ML',
      path: '/retention',
      icon: TrendingDown,
      roles: ['CEO', 'HR_MANAGER'],
      badge: 'AI ML',
    },
    {
      name: 'Spike ① FaceID Bench',
      path: '/face-bench',
      icon: Video,
      badge: 'Spike',
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  const getRoleBadgeStyle = (role?: Role) => {
    switch (role) {
      case 'CEO':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'HR_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'MANAGER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900/90 border-r border-slate-800 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              PI
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white">PeopleInsight AI</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">v6.1 FINAL FREEZE</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Tenant & System Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300">Multi-tenant Fail-Closed</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            MongoDB 11 Collections • RBAC 4 Cấp • Luật Thuế TNCN 2026
          </p>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-slate-800/90 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Doanh nghiệp:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-indigo-300">
                PeopleInsight AI Corp
              </span>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition relative"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition cursor-pointer"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user?.fullName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.employeeCode}</div>
                </div>
                <span
                  className={`hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeStyle(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-200 truncate">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeStyle(
                            user?.role
                          )}`}
                        >
                          Vai trò: {user?.role}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 font-semibold flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Đăng Xuất Khỏi Hệ Thống
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
