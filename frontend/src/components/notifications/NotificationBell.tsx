import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  Info,
  X,
  ExternalLink,
  Shield,
  RotateCw,
  Building,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { NotificationItem, NotificationType } from '../../types/notification';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    unreadCount,
    notifications,
    latestAlert,
    isConnected,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearLatestAlert,
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LEAVE_REQUEST':
        return <FileText className="w-4 h-4 text-accent" />;
      case 'ATTENDANCE_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'CONTRACT_EXPIRY':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'PAYROLL_READY':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'ROLE_PROPOSAL':
        return <Shield className="w-4 h-4 text-accent" />;
      case 'TRANSFER_PROPOSAL':
        return <Building className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-muted" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    setIsOpen(false);

    // Điều hướng theo nghiệp vụ
    if (item.type === 'LEAVE_REQUEST') {
      navigate('/leave-requests');
    } else if (item.type === 'ATTENDANCE_ALERT') {
      navigate('/attendance');
    } else if (item.type === 'CONTRACT_EXPIRY') {
      navigate('/users');
    } else if (item.type === 'PAYROLL_READY') {
      navigate('/payrolls');
    } else if (item.type === 'ROLE_PROPOSAL' || item.data?.type === 'ROLE_PROPOSAL') {
      navigate('/users');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        onClick={toggleDropdown}
        className="p-2 rounded-xl text-fg hover:bg-surface-2 border-2 border-transparent hover:border-line transition relative focus:outline-none cursor-pointer"
        title={isConnected ? 'Thông báo thời gian thực' : 'Đang kết nối lại socket...'}
      >
        <Bell className="w-4 h-4 text-fg" />

        {/* Badge số lượng chưa đọc */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center border-2 border-line shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          /* Chấm nhỏ trạng thái kết nối realtime */
          <span
            className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-line ${
              isConnected ? 'bg-lime' : 'bg-amber-400 animate-ping'
            }`}
          />
        )}
      </button>

      {/* Floating Toast Alert Khi Có Thông Báo Mới Đến */}
      {latestAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-surface border-2 border-line rounded-2xl p-4 shadow-hard-lg backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 text-fg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-surface-2 border-2 border-line shrink-0 shadow-xs">
              {getNotificationIcon(latestAlert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-fg flex items-center justify-between font-display">
                <span className="truncate">{latestAlert.title}</span>
                <span className="text-[10px] text-accent shrink-0 ml-2 font-mono font-bold">Vừa xong</span>
              </div>
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed font-medium">
                {latestAlert.message}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-line">
                <button
                  onClick={() => handleNotificationClick(latestAlert)}
                  className="inline-flex items-center gap-1 text-xs font-black text-accent hover:underline cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={clearLatestAlert}
                  className="text-xs text-muted hover:text-fg p-1 border border-line rounded-lg hover:bg-surface-2 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Popover Danh Sách Thông Báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border-2 border-line rounded-2xl shadow-hard-lg overflow-hidden z-50 text-fg animate-fadeIn">
          {/* Header Popover */}
          <div className="px-4 py-3 border-b-2 border-line flex items-center justify-between bg-surface-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-fg font-display">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-line text-rose-700 font-black text-[10px] shadow-xs">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchNotifications()}
                className="p-1 rounded-lg text-fg hover:bg-surface border border-line transition cursor-pointer shadow-xs"
                title="Làm mới thông báo"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-accent' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-muted hover:text-fg font-bold inline-flex items-center gap-1 cursor-pointer transition"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-accent" />
                  Đọc hết
                </button>
              )}
            </div>
          </div>

          {/* Body Popover */}
          <div className="max-h-96 overflow-y-auto divide-y-2 divide-line bg-surface">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted font-medium">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-4 bg-surface-2">
                <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-fg font-black font-display">Chưa có thông báo nào</p>
                <p className="text-[11px] text-muted mt-1 max-w-xs mx-auto leading-relaxed font-medium">
                  Các thông báo cần CEO/HR phê duyệt đơn từ, đề xuất vai trò nhân sự và nhắc việc sẽ tức thì hiển thị tại đây.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isActionRequired =
                  item.data?.requiresApproval ||
                  item.type === 'ROLE_PROPOSAL' ||
                  item.title?.toLowerCase().includes('cần') ||
                  item.title?.toLowerCase().includes('duyệt');

                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 hover:bg-surface-2/70 transition cursor-pointer flex items-start gap-3 relative ${
                      !item.isRead ? 'bg-lime/15' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-surface-2 border-2 border-line shrink-0 mt-0.5 shadow-xs">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <h4
                            className={`text-xs truncate ${
                              !item.isRead ? 'font-black text-fg font-display' : 'font-bold text-fg'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {isActionRequired && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-ink border border-line shrink-0 shadow-xs">
                              Cần duyệt
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted shrink-0 font-mono font-medium">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-1 line-clamp-2 leading-relaxed font-medium">
                        {item.message}
                      </p>
                    </div>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-lime border border-line shrink-0 mt-1.5 shadow-xs" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Popover */}
          <div className="p-3 border-t-2 border-line bg-surface-2 flex items-center justify-between px-4 text-xs font-bold">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/leave-requests');
              }}
              className="text-fg hover:text-accent hover:underline transition cursor-pointer"
            >
              Xem đơn từ & phê duyệt &rarr;
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/users');
              }}
              className="text-fg hover:text-accent hover:underline transition cursor-pointer"
            >
              Quản lý nhân sự &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
