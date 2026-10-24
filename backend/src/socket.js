import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env.js';
import { tenantStore } from './plugins/tenantPlugin.js';

let io = null;

/**
 * Khởi tạo Socket.IO Server với xác thực JWT và phân lập Multi-Tenant Fail-Closed
 * @param {import('http').Server} httpServer
 */
export const initSocketServer = (httpServer) => {
  const allowedOrigins = [
    config.clientUrl,
    `https://${config.apexDomain}`,
    `https://app.${config.apexDomain}`,
    'http://localhost:5173',
  ].filter(Boolean);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Middleware xác thực JWT cho từng kết nối Socket
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token = socket.handshake.auth?.token || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

      if (!token) {
        return next(new Error('AUTHENTICATION_ERROR: Missing JWT token in handshake'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      if (!decoded || !decoded.userId || !decoded.companyId) {
        return next(new Error('AUTHENTICATION_ERROR: Invalid token payload (missing userId/companyId)'));
      }

      socket.user = {
        userId: decoded.userId.toString(),
        companyId: decoded.companyId.toString(),
        role: decoded.role || 'EMPLOYEE',
        fullName: decoded.fullName || '',
      };

      next();
    } catch (err) {
      console.warn(`[Socket.io Auth Failed] ${err.message}`);
      return next(new Error(`AUTHENTICATION_ERROR: ${err.message}`));
    }
  });

  // Xử lý sự kiện kết nối
  io.on('connection', (socket) => {
    const { userId, companyId, role } = socket.user;

    // Đưa socket vào các room phân quyền theo tenant
    const userRoom = `user_${userId}`;
    const tenantRoom = `tenant_${companyId}`;
    const roleRoom = `role_${companyId}_${role}`;

    socket.join(userRoom);
    socket.join(tenantRoom);
    socket.join(roleRoom);

    if (['MANAGER', 'HR_MANAGER', 'ADMIN'].includes(role)) {
      socket.join(`managers_${companyId}`);
    }

    // Wrap toàn bộ event handler trong tenantStore.run (Fail-Closed Multi-tenancy)
    socket.on('client_ping', (data, callback) => {
      tenantStore.run({ companyId }, () => {
        if (typeof callback === 'function') {
          callback({ status: 'ok', time: new Date().toISOString() });
        }
      });
    });

    socket.on('disconnect', (reason) => {
      // Clean disconnect
    });
  });

  return io;
};

/**
 * Lấy thể hiện Socket.IO hiện tại
 */
export const getIO = () => io;

/**
 * Gán thể hiện Socket.IO (hữu ích cho testing)
 */
export const setIO = (newIO) => {
  io = newIO;
};

/**
 * Phát sự kiện tới 1 người dùng cụ thể
 */
export const emitToUser = (companyId, userId, event, payload) => {
  if (!io) return false;
  io.to(`user_${userId.toString()}`).emit(event, payload);
  return true;
};

/**
 * Phát sự kiện tới toàn bộ người dùng trong 1 tenant
 */
export const emitToTenant = (companyId, event, payload) => {
  if (!io) return false;
  io.to(`tenant_${companyId.toString()}`).emit(event, payload);
  return true;
};

/**
 * Phát sự kiện tới nhóm vai trò cụ thể trong 1 tenant
 */
export const emitToRole = (companyId, role, event, payload) => {
  if (!io) return false;
  io.to(`role_${companyId.toString()}_${role}`).emit(event, payload);
  return true;
};

/**
 * Phát sự kiện tới toàn bộ Quản lý và HR trong 1 tenant
 */
export const emitToManagers = (companyId, event, payload) => {
  if (!io) return false;
  io.to(`managers_${companyId.toString()}`).emit(event, payload);
  return true;
};
