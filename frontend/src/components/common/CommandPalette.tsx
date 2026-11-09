import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  ScanFace,
  FileText,
  Calculator,
  TrendingDown,
  BriefcaseBusiness,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth';
import { usersApi } from '../../api/users';
import { UserItem } from '../../types/user';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserDetail?: (user: UserItem) => void;
  onOpenCreateLeave?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenUserDetail,
  onOpenCreateLeave,
}) => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [query, setQuery] = useState('');
  const [matchingUsers, setMatchingUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick navigation pages
  const navigationItems = [
    { label: 'Bảng điều khiển', path: '/', icon: LayoutDashboard, roles: undefined as Role[] | undefined },
    { label: 'Hồ sơ nhân sự', path: '/users', icon: Users, roles: ['CEO', 'HR_MANAGER', 'MANAGER'] as Role[] },
    { label: 'Cơ cấu phòng ban', path: '/departments', icon: Building2, roles: undefined as Role[] | undefined },
    { label: 'Chấm công GPS & Kiosk', path: '/attendance', icon: Clock, roles: undefined as Role[] | undefined },
    { label: 'FaceID Kiosk điểm danh', path: '/kiosk', icon: ScanFace, roles: ['CEO', 'HR_MANAGER'] as Role[] },
    { label: 'Quản lý đơn từ & Phép', path: '/leave-requests', icon: FileText, roles: undefined as Role[] | undefined },
    { label: 'Bảng lương 2026', path: '/payrolls', icon: Calculator, roles: undefined as Role[] | undefined },
    { label: 'Dự báo thôi việc AI', path: '/retention', icon: TrendingDown, roles: ['CEO', 'HR_MANAGER'] as Role[] },
    { label: 'Tuyển dụng & Sàng lọc CV', path: '/recruitment', icon: BriefcaseBusiness, roles: ['CEO', 'HR_MANAGER'] as Role[] },
  ].filter((item) => !item.roles || hasRole(item.roles));

  // Quick actions
  const actionItems = [
    {
      label: 'Tạo đơn mới (Nghỉ phép / OT / WFH)',
      action: () => {
        onClose();
        if (onOpenCreateLeave) onOpenCreateLeave();
        else navigate('/leave-requests');
      },
      icon: Plus,
    },
    {
      label: 'Chấm công vào ca hôm nay',
      action: () => {
        onClose();
        navigate('/attendance');
      },
      icon: Clock,
    },
  ];

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setMatchingUsers([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search users debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setMatchingUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const res = await usersApi.getUsers({ search: query.trim(), limit: 5 });
        setMatchingUsers(res.users || []);
      } catch (err) {
        console.error('Lỗi tìm kiếm nhân viên trong palette:', err);
      } finally {
        setLoadingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Listen for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] card-top-highlight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhân viên, điều hướng trang hoặc gõ lệnh..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs scrollbar-thin">
          {/* Section 1: Nhân viên tìm thấy */}
          {matchingUsers.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 px-2 block mb-1">
                Hồ sơ nhân sự ({matchingUsers.length})
              </span>
              <div className="space-y-1">
                {matchingUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => {
                      onClose();
                      if (onOpenUserDetail) onOpenUserDetail(u);
                      else navigate('/users');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-950/60 text-teal-300 border border-teal-800/60 flex items-center justify-center font-bold text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white group-hover:text-teal-300 transition">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {u.employeeCode} · {u.departmentId?.name || 'Chưa phân phòng'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Lệnh & Thao tác nhanh */}
          {!query && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Thao tác nhanh
              </span>
              <div className="space-y-1">
                {actionItems.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={act.action}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-slate-200">
                      <act.icon className="w-4 h-4 text-teal-400" />
                      <span>{act.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Điều hướng trang */}
          {filteredNav.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Chuyển trang ({filteredNav.length})
              </span>
              <div className="space-y-1">
                {filteredNav.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onClose();
                      navigate(item.path);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 text-slate-200">
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-300">
                      {item.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query && matchingUsers.length === 0 && filteredNav.length === 0 && !loadingUsers && (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <Search className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p className="font-semibold text-white">Không tìm thấy kết quả phù hợp</p>
              <p className="text-[11px] text-slate-400">
                Thử tìm với tên nhân sự, mã số NV (NV0001) hoặc tên trang.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
