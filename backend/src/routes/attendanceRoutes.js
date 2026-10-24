import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  gpsCheckInHandler,
  getTodayAttendanceHandler,
  getMyAttendanceHistoryHandler,
  getDynamicQrPassHandler,
  qrScanAttendanceHandler,
} from '../controllers/attendanceController.js';

const router = express.Router();

// Yêu cầu xác thực tài khoản và inject Tenant fail-closed
router.use(authenticate);

// 1. Điểm danh di động qua GPS Geofencing (áp dụng cho tất cả nhân viên)
router.post('/gps', gpsCheckInHandler);

// 2. Thẻ điểm danh QR Động chu kỳ 30s
router.get('/qr-pass', getDynamicQrPassHandler);

// 3. Quét mã QR điểm danh (quầy lễ tân / máy quét)
router.post('/qr-scan', qrScanAttendanceHandler);

// 4. Lấy thông tin điểm danh hôm nay của cá nhân
router.get('/today', getTodayAttendanceHandler);

// 5. Lịch sử điểm danh của cá nhân
router.get('/my-history', getMyAttendanceHistoryHandler);

export default router;
