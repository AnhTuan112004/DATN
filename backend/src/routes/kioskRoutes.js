import express from 'express';
import { z } from 'zod';
import { authenticateKioskDevice } from '../middleware/kioskAuth.js';
import { kioskLimiter } from '../middleware/rateLimiter.js';
import { createKioskChallenge } from '../services/kioskChallengeService.js';
import { processKioskFaceCheckIn } from '../services/kioskAttendanceService.js';
import { verifyAndProcessQrScan } from '../services/qrAttendanceService.js';

const router = express.Router();

/**
 * Schema Zod .strict() xác thực dữ liệu điểm danh Kiosk FaceID Tầng 2
 */
const kioskCheckInSchema = z.object({
  nonce: z.string().min(1, 'Nonce thử thách là bắt buộc'),
  vStart: z.array(z.number()).length(128, 'vStart bắt buộc phải là vector embedding 128 chiều'),
  vEnd: z.array(z.number()).length(128, 'vEnd bắt buộc phải là vector embedding 128 chiều'),
  referenceDate: z.string().optional(),
}).strict();

/**
 * GET /api/kiosk/info
 * Kiểm tra trạng thái kết nối và cấu hình của Kiosk
 */
router.get('/info', authenticateKioskDevice, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      companyId: req.kiosk.companyId,
      companyName: req.kiosk.companyName,
      deviceId: req.kiosk.deviceId,
      description: req.kiosk.description,
      status: 'ONLINE',
      serverTime: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/kiosk/challenge
 * Cấp Nonce ngẫu nhiên kèm thử thách sinh trắc học Tầng 1 (TTL 60s)
 */
router.get('/challenge', kioskLimiter, authenticateKioskDevice, (req, res) => {
  const preferredChallenge = req.query?.challengeType || null;
  const challenge = createKioskChallenge(
    req.kiosk.companyId,
    req.kiosk.deviceId,
    preferredChallenge
  );

  res.status(200).json({
    success: true,
    data: challenge,
  });
});

/**
 * POST /api/kiosk/check-in
 * Điểm danh FaceID Tầng 2: So khớp 1:N & ghi nhận AttendanceLog
 */
router.post('/check-in', kioskLimiter, authenticateKioskDevice, async (req, res, next) => {
  try {
    const validatedData = kioskCheckInSchema.parse(req.body);

    const result = await processKioskFaceCheckIn({
      companyId: req.kiosk.companyId,
      deviceId: req.kiosk.deviceId,
      nonce: validatedData.nonce,
      vStart: validatedData.vStart,
      vEnd: validatedData.vEnd,
      referenceDate: validatedData.referenceDate ? new Date(validatedData.referenceDate) : new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Xác thực sinh trắc học thành công! Ghi nhận ${result.actionType} cho ${result.employee.fullName}`,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu điểm danh không hợp lệ',
        errors: error.errors,
      });
    }
    next(error);
  }
});

/**
 * POST /api/kiosk/qr-check-in
 * Điểm danh Kiosk bằng cách quét mã QR Động của nhân viên
 */
router.post('/qr-check-in', kioskLimiter, authenticateKioskDevice, async (req, res, next) => {
  try {
    const { qrData, referenceDate } = req.body;
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu mã QR (qrData) không được để trống',
      });
    }

    const result = await verifyAndProcessQrScan({
      scannerCompanyId: req.kiosk.companyId,
      qrData,
      deviceId: req.kiosk.deviceId,
      referenceDate: referenceDate ? new Date(referenceDate) : new Date(),
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
