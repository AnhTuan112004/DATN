import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { config } from '../config/env.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

// Grace Window chống logout oan đa tab (20 giây)
const REFRESH_GRACE_WINDOW_MS = 20 * 1000;
const MAX_SESSIONS_PER_USER = 5;

/**
 * Sinh JWT Access Token (15 phút)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      companyId: user.companyId,
      role: user.role,
      employeeCode: user.employeeCode,
      email: user.email,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn || '15m' }
  );
};

/**
 * Đăng nhập người dùng (Email + Password)
 * Luồng chưa có JWT: Tra cứu user với { skipTenant: true }, sau đó bọc phiên trong tenantStore.run
 */
export const login = async ({ email, password, deviceId = 'web', userAgent = null, ip = null }) => {
  // 1. Tra cứu user (bỏ qua tenant filter ban đầu để định danh tenant)
  const user = await User.findOne({ email })
    .select('+passwordHash +refreshTokens')
    .setOptions({ skipTenant: true });

  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ phòng Nhân sự.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Xác thực mật khẩu
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  // 3. Khởi tạo phiên trong ngữ cảnh tenant
  return await tenantStore.run({ companyId: user.companyId }, async () => {
    // Dọn dẹp token hết hạn trước khi thêm phiên mới
    await User.updateOne(
      { _id: user._id },
      { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } },
      { skipTenant: true }
    );

    // Sinh cặp token mới
    const familyId = crypto.randomUUID();
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
    const accessToken = generateAccessToken(user);

    const newSession = {
      token: rawRefreshToken,
      family: familyId,
      deviceId,
      userAgent,
      ip,
      createdAt: new Date(),
      expiresAt,
      rotatedAt: null,
    };

    // Cập nhật nguyên tử bằng $push và $slice giới hạn tối đa 5 phiên (CẤM dùng .save())
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            $each: [newSession],
            $slice: -MAX_SESSIONS_PER_USER,
          },
        },
      },
      { skipTenant: true }
    );

    // Ghi AuditLog
    await AuditLog.create({
      companyId: user.companyId,
      userId: user._id,
      action: AUDIT_ACTIONS.LOGIN,
      ipAddress: ip,
      userAgent,
      details: { deviceId, familyId },
    });

    const sanitizedUser = {
      id: user._id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
      avatarUrl: user.avatarUrl,
    };

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: sanitizedUser,
    };
  });
};

/**
 * Xoay vòng Refresh Token (Refresh Rotation + Grace Window 20s + Token Reuse Detection)
 */
export const rotateRefreshToken = async ({ refreshToken, deviceId = 'web', userAgent = null, ip = null }) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 400;
    throw error;
  }

  // 1. Tìm user chứa token
  const user = await User.findOne({ 'refreshTokens.token': refreshToken })
    .select('+refreshTokens')
    .setOptions({ skipTenant: true });

  if (!user) {
    const error = new Error('Refresh token không hợp lệ hoặc đã bị thu hồi');
    error.statusCode = 401;
    throw error;
  }

  return await tenantStore.run({ companyId: user.companyId }, async () => {
    const tokenDoc = user.refreshTokens.find((t) => t.token === refreshToken);

    if (!tokenDoc) {
      const error = new Error('Token document not found');
      error.statusCode = 401;
      throw error;
    }

    // Kiểm tra hết hạn
    if (new Date(tokenDoc.expiresAt) < new Date()) {
      await User.updateOne(
        { _id: user._id },
        { $pull: { refreshTokens: { token: refreshToken } } },
        { skipTenant: true }
      );
      const error = new Error('Refresh token đã hết hạn');
      error.statusCode = 401;
      throw error;
    }

    // 2. Kiểm tra Token Reuse & Grace Window
    if (tokenDoc.rotatedAt) {
      const timeSinceRotation = Date.now() - new Date(tokenDoc.rotatedAt).getTime();

      if (timeSinceRotation <= REFRESH_GRACE_WINDOW_MS) {
        // Trong Grace Window 20s: Nhiều tab refresh cùng lúc -> Cấp lại access token mới mà không thu hồi
        const accessToken = generateAccessToken(user);
        return {
          accessToken,
          refreshToken,
          isGraceWindow: true,
        };
      }

      // Vượt quá Grace Window: PHÁT HIỆN TOKEN REUSE (Attacker cố dùng lại token cũ)
      // Thu hồi toàn bộ token của gia đình (family) này ngay lập tức!
      await User.updateOne(
        { _id: user._id },
        { $pull: { refreshTokens: { family: tokenDoc.family } } },
        { skipTenant: true }
      );

      await AuditLog.create({
        companyId: user.companyId,
        userId: user._id,
        action: AUDIT_ACTIONS.REFRESH_TOKEN,
        ipAddress: ip,
        userAgent,
        details: {
          warning: 'SECURITY_ALERT: Token reuse detected. Family revoked.',
          family: tokenDoc.family,
        },
      });

      const error = new Error('Cảnh báo an ninh: Phát hiện sử dụng lại Refresh Token cũ. Toàn bộ phiên liên quan đã bị thu hồi.');
      error.statusCode = 403;
      throw error;
    }

    // 3. Xoay vòng hợp lệ: Sinh refresh token mới cùng family
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newAccessToken = generateAccessToken(user);

    // Đánh dấu token cũ là đã rotate (kích hoạt Grace Window)
    await User.updateOne(
      { _id: user._id, 'refreshTokens.token': refreshToken },
      { $set: { 'refreshTokens.$.rotatedAt': new Date() } },
      { skipTenant: true }
    );

    // Đẩy token mới vào mảng
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            $each: [{
              token: newRefreshToken,
              family: tokenDoc.family,
              deviceId: deviceId || tokenDoc.deviceId || 'web',
              userAgent,
              ip,
              createdAt: new Date(),
              expiresAt: newExpiresAt,
              rotatedAt: null,
            }],
            $slice: -(MAX_SESSIONS_PER_USER + 2), // Giữ thêm chỗ cho token cũ trong grace window
          },
        },
      },
      { skipTenant: true }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      isGraceWindow: false,
    };
  });
};

/**
 * Đăng xuất: Thu hồi phiên tương ứng
 */
export const logout = async ({ userId, refreshToken, ip = null, userAgent = null }) => {
  if (!userId) return;

  const user = await User.findById(userId).setOptions({ skipTenant: true });
  if (!user) return;

  if (refreshToken) {
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { token: refreshToken } } },
      { skipTenant: true }
    );
  }

  await AuditLog.create({
    companyId: user.companyId,
    userId,
    action: AUDIT_ACTIONS.LOGOUT,
    ipAddress: ip,
    userAgent,
    details: { refreshTokenRevoked: !!refreshToken },
  });
};

/**
 * Lấy thông tin tài khoản hiện tại (Protected)
 */
export const getMe = async (userId, companyId) => {
  return await tenantStore.run({ companyId }, async () => {
    const user = await User.findById(userId)
      .populate('departmentId', 'name code')
      .populate('managerId', 'fullName employeeCode');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  });
};
