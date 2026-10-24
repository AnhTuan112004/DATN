import * as notificationService from '../services/notificationService.js';

/**
 * Lấy danh sách thông báo của người dùng đăng nhập
 */
export const listNotifications = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const result = await notificationService.getNotifications({
      companyId,
      userId,
      query: req.query,
    });

    res.status(200).json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Lấy số lượng thông báo chưa đọc
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const count = await notificationService.getUnreadCount({ companyId, userId });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    const result = await notificationService.markAsRead({
      companyId,
      userId,
      notificationId: id,
    });

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc',
      data: result.notification,
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const result = await notificationService.markAllAsRead({ companyId, userId });

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Xóa một thông báo
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    const result = await notificationService.deleteNotification({
      companyId,
      userId,
      notificationId: id,
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa thông báo',
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    next(err);
  }
};
