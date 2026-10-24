import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing or invalid',
      });
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
      employeeCode: decoded.employeeCode,
    };

    // Tự động kích hoạt context Multi-tenant Fail-Closed cho toàn bộ downstream handlers
    tenantStore.run({ companyId: decoded.companyId }, () => {
      next();
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
    });
  }
};

/**
 * Middleware xác thực tùy chọn (Không chặn nếu thiếu token, nhưng giải mã nếu có)
 */
export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.accessSecret);
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,
          companyId: decoded.companyId,
          role: decoded.role,
          employeeCode: decoded.employeeCode,
        };
        return tenantStore.run({ companyId: decoded.companyId }, () => {
          next();
        });
      } catch {
        // Token lỗi/hết hạn thì bỏ qua ở middleware tùy chọn
      }
    }
    next();
  } catch {
    next();
  }
};

export const authenticateJWT = authenticate;
