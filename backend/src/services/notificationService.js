import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { emitToUser, emitToManagers } from '../socket.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

/**
 * Tiện ích kích hoạt tenantStore nếu chưa có ngữ cảnh
 */
const runWithTenant = (companyId, fn) => {
  const current = tenantStore.getStore()?.companyId;
  if (current && current.toString() === companyId.toString()) {
    return fn();
  }
  return tenantStore.run({ companyId: companyId.toString() }, fn);
};

/**
 * Tạo bản ghi thông báo và phát sự kiện Socket.io thời gian thực
 */
export const createAndSendNotification = async ({
  companyId,
  userId,
  title,
  message,
  type = 'SYSTEM',
  data = {},
}) => {
  return runWithTenant(companyId, async () => {
    // 1. Tạo bản ghi Notification
    const notification = await Notification.create({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      title,
      message,
      type,
      data,
    });

    // 2. Tính số thông báo chưa đọc hiện tại của user
    const unreadCount = await Notification.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    // 3. Phát socket event real-time tới room user
    emitToUser(companyId, userId, 'notification', notification);
    emitToUser(companyId, userId, 'unread_count_update', { count: unreadCount });

    return notification;
  });
};

/**
 * Lấy danh sách thông báo của người dùng với phân trang và bộ lọc
 */
export const getNotifications = async ({ companyId, userId, query = {} }) => {
  return runWithTenant(companyId, async () => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (query.isRead !== undefined && query.isRead !== '') {
      filter.isRead = query.isRead === 'true' || query.isRead === true;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async ({ companyId, userId }) => {
  return runWithTenant(companyId, async () => {
    const count = await Notification.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
    return count;
  });
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export const markAsRead = async ({ companyId, userId, notificationId }) => {
  return runWithTenant(companyId, async () => {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Thông báo không tồn tại hoặc không thuộc quyền sở hữu');
      error.statusCode = 404;
      throw error;
    }

    const unreadCount = await Notification.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    emitToUser(companyId, userId, 'unread_count_update', { count: unreadCount });

    return { notification, unreadCount };
  });
};

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 */
export const markAllAsRead = async ({ companyId, userId }) => {
  return runWithTenant(companyId, async () => {
    await Notification.updateMany(
      {
        companyId: new mongoose.Types.ObjectId(companyId),
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true }
    );

    emitToUser(companyId, userId, 'unread_count_update', { count: 0 });

    return { success: true, unreadCount: 0 };
  });
};

/**
 * Xóa một thông báo
 */
export const deleteNotification = async ({ companyId, userId, notificationId }) => {
  return runWithTenant(companyId, async () => {
    const result = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(notificationId),
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      const error = new Error('Thông báo không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    const unreadCount = await Notification.countDocuments({
      companyId: new mongoose.Types.ObjectId(companyId),
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    emitToUser(companyId, userId, 'unread_count_update', { count: unreadCount });

    return { success: true, unreadCount };
  });
};
