export type NotificationType =
  | 'SYSTEM'
  | 'LEAVE_REQUEST'
  | 'ATTENDANCE_ALERT'
  | 'CONTRACT_EXPIRY'
  | 'PAYROLL_READY';

export interface NotificationItem {
  _id: string;
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: {
    leaveRequestId?: string;
    status?: string;
    type?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationParams {
  page?: number;
  limit?: number;
  isRead?: boolean | string;
  type?: NotificationType | string;
}
