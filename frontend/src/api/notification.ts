import { apiClient } from './client';
import {
  NotificationItem,
  NotificationListResponse,
  NotificationParams,
} from '../types/notification';

/**
 * Lấy danh sách thông báo của người dùng hiện tại
 */
export const getNotificationsApi = async (
  params?: NotificationParams
): Promise<NotificationListResponse> => {
  const response = await apiClient.get<NotificationListResponse>('/notifications', {
    params,
  });
  return response.data;
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCountApi = async (): Promise<number> => {
  const response = await apiClient.get<{ success: boolean; count: number }>(
    '/notifications/unread-count'
  );
  return response.data.count;
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export const markNotificationAsReadApi = async (
  id: string
): Promise<{ success: boolean; data: NotificationItem; unreadCount: number }> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: NotificationItem;
    unreadCount: number;
  }>(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllNotificationsAsReadApi = async (): Promise<{
  success: boolean;
  unreadCount: number;
}> => {
  const response = await apiClient.patch<{
    success: boolean;
    unreadCount: number;
  }>('/notifications/read-all');
  return response.data;
};

/**
 * Xóa một thông báo
 */
export const deleteNotificationApi = async (
  id: string
): Promise<{ success: boolean; unreadCount: number }> => {
  const response = await apiClient.delete<{
    success: boolean;
    unreadCount: number;
  }>(`/notifications/${id}`);
  return response.data;
};
