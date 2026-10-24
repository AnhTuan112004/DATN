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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LEAVE_REQUEST':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'ATTENDANCE_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'CONTRACT_EXPIRY':
        return <Clock className="w-4 h-4 text-rose-400" />;
      case 'PAYROLL_READY':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
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
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition relative focus:outline-none"
        title={isConnected ? 'Thông báo thời gian thực' : 'Đang kết nối lại socket...'}
      >
        <Bell className="w-4 h-4" />

        {/* Badge số lượng chưa đọc */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          /* Chấm nhỏ trạng thái kết nối realtime */
          <span
            className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
            }`}
          />
        )}
      </button>

      {/* Floating Toast Alert Khi Có Thông Báo Mới Đến */}
      {latestAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              {getNotificationIcon(latestAlert.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="truncate">{latestAlert.title}</span>
                <span className="text-[10px] text-indigo-400 shrink-0 ml-2">Vừa xong</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {latestAlert.message}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleNotificationClick(latestAlert)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  Xem chi tiết
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={clearLatestAlert}
                  className="text-xs text-slate-500 hover:text-slate-300 p-1"
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
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
          {/* Header Popover */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-slate-400 hover:text-indigo-400 font-medium inline-flex items-center gap-1 transition"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc hết
              </button>
            )}
          </div>

          {/* Body Popover */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Bạn chưa có thông báo nào</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Mọi cập nhật duyệt đơn và chấm công sẽ hiển thị tại đây.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-800/50 transition cursor-pointer flex items-start gap-3 relative ${
                    !item.isRead ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !item.isRead ? 'text-white' : 'text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Popover */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/40 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/leave-requests');
              }}
              className="text-xs text-slate-400 hover:text-indigo-300 font-medium transition"
            >
              Xem tất cả đơn từ & phê duyệt &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
