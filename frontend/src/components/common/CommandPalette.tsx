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
  MapPin,
  ChevronRight,
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
    { label: 'Bảng điều khiển', path: '/', icon: LayoutDashboard, category: 'Tổng quan', roles: undefined as Role[] | undefined },
    { label: 'Hồ sơ nhân sự', path: '/users', icon: Users, category: 'Nhân sự', roles: ['CEO', 'HR_MANAGER', 'MANAGER'] as Role[] },
    { label: 'Cơ cấu phòng ban', path: '/departments', icon: Building2, category: 'Tổ chức', roles: undefined as Role[] | undefined },
    { label: 'Địa điểm chấm công', path: '/locations', icon: MapPin, category: 'Cấu hình', roles: ['CEO', 'HR_MANAGER'] as Role[] },
    { label: 'Chấm công GPS & Kiosk', path: '/attendance', icon: Clock, category: 'Chấm công', roles: undefined as Role[] | undefined },
    { label: 'FaceID Kiosk điểm danh', path: '/kiosk', icon: ScanFace, category: 'Thiết bị', roles: ['CEO', 'HR_MANAGER'] as Role[] },
    { label: 'Quản lý đơn từ & Phép', path: '/leave-requests', icon: FileText, category: 'Đơn từ', roles: undefined as Role[] | undefined },
    { label: 'Bảng lương 2026', path: '/payrolls', icon: Calculator, category: 'Lương & Thuế', roles: undefined as Role[] | undefined },
    { label: 'Dự báo thôi việc AI', path: '/retention', icon: TrendingDown, category: 'AI & Analytics', roles: ['CEO', 'HR_MANAGER'] as Role[] },
    { label: 'Tuyển dụng & Sàng lọc CV', path: '/recruitment', icon: BriefcaseBusiness, category: 'Tuyển dụng', roles: ['CEO', 'HR_MANAGER'] as Role[] },
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
        setMatchingUsers([]);
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
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-ink/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border-2 border-line rounded-2xl shadow-hard overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b-2 border-line bg-surface-2">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhân viên, điều hướng trang hoặc gõ lệnh..."
            className="flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted hover:text-fg rounded transition"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] text-muted bg-surface border border-line px-1.5 py-0.5 rounded font-mono shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs scrollbar-thin">
          {/* Section 1: Nhân viên tìm thấy */}
          {matchingUsers.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-2 block mb-1">
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
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-2 text-left transition group cursor-pointer border border-transparent hover:border-line"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-lime text-ink border border-line flex items-center justify-center font-bold text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-fg group-hover:text-primary transition">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          {u.employeeCode} · {u.departmentId?.name || 'Chưa phân phòng'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-primary transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Lệnh & Thao tác nhanh */}
          {!query && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-2 block mb-1">
                Thao tác nhanh
              </span>
              <div className="space-y-1">
                {actionItems.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={act.action}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-2 text-left transition group cursor-pointer border border-transparent hover:border-line"
                  >
                    <div className="flex items-center gap-2.5 text-fg font-medium">
                      <div className="w-6 h-6 rounded-md bg-surface-2 border border-line flex items-center justify-center">
                        <act.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>{act.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Điều hướng trang */}
          {filteredNav.length > 0 && (
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted px-2 block mb-1">
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
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-2 text-left transition group cursor-pointer border border-transparent hover:border-line"
                  >
                    <div className="flex items-center gap-2.5 text-fg font-medium">
                      <div className="w-6 h-6 rounded-md bg-surface-2 border border-line flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-muted group-hover:text-primary transition" />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-2 border border-line text-muted">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {query && matchingUsers.length === 0 && filteredNav.length === 0 && !loadingUsers && (
            <div className="py-8 text-center text-muted space-y-1">
              <Search className="w-6 h-6 mx-auto text-muted mb-1 opacity-50" />
              <p className="font-semibold text-fg">Không tìm thấy kết quả phù hợp</p>
              <p className="text-[11px] text-muted">
                Thử tìm với tên nhân sự, mã số NV (NV0001) hoặc tên trang chức năng.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
