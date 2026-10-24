import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api/client';
import { useAuth } from './AuthContext';
import { NotificationItem } from '../types/notification';
import {
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from '../api/notification';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  latestAlert: NotificationItem | null;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearLatestAlert: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestAlert, setLatestAlert] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Lấy danh sách thông báo và số lượng chưa đọc ban đầu
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await getNotificationsApi({ page: 1, limit: 15 });
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.warn('[SocketContext] Không thể tải thông báo:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Kết nối Socket.IO khi người dùng đăng nhập
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    const socketUrl = window.location.origin;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      fetchNotifications();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket.io Client Error]', err.message);
      setIsConnected(false);
    });

    // Lắng nghe thông báo real-time
    newSocket.on('notification', (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setLatestAlert(newNotif);

      // Tự động ẩn popup thông báo nổi sau 6 giây
      setTimeout(() => {
        setLatestAlert((curr) => (curr?._id === newNotif._id ? null : curr));
      }, 6000);
    });

    // Cập nhật số lượng chưa đọc từ server
    newSocket.on('unread_count_update', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user, fetchNotifications]);

  // Đánh dấu 1 thông báo đã đọc
  const markAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsReadApi(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('[SocketContext] Lỗi markAsRead:', err);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = async () => {
    try {
      const res = await markAllNotificationsAsReadApi();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('[SocketContext] Lỗi markAllAsRead:', err);
    }
  };

  const clearLatestAlert = () => setLatestAlert(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadCount,
        notifications,
        latestAlert,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearLatestAlert,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
