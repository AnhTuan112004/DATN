import {
  processGpsCheckIn,
  getTodayAttendance,
  getMyAttendanceHistory,
} from '../services/gpsAttendanceService.js';
import {
  generateDynamicQrToken,
  verifyAndProcessQrScan,
  qrScanSchema,
} from '../services/qrAttendanceService.js';

export const gpsCheckInHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.userId || req.user.id;

    const result = await processGpsCheckIn(companyId, userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Dữ liệu GPS không hợp lệ',
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const getTodayAttendanceHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.userId || req.user.id;

    const result = await getTodayAttendance(companyId, userId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceHistoryHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.userId || req.user.id;
    const limit = Number(req.query.limit) || 30;

    const result = await getMyAttendanceHistory(companyId, userId, limit);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy mã QR động phục vụ điểm danh (chu kỳ 30s)
 */
export const getDynamicQrPassHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.userId || req.user.id;

    const result = await generateDynamicQrToken(companyId, userId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Quét mã QR điểm danh (quét tại quầy lễ tân hoặc máy quét)
 */
export const qrScanAttendanceHandler = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const scannedByUserId = req.user.userId || req.user.id;

    const validated = qrScanSchema.parse(req.body);

    const result = await verifyAndProcessQrScan({
      scannerCompanyId: companyId,
      qrData: validated.qrData,
      deviceId: validated.deviceId,
      scannedByUserId,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Dữ liệu quét mã không hợp lệ',
        errors: error.errors,
      });
    }
    next(error);
  }
};
