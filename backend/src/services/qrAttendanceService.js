import crypto from 'crypto';
import { z } from 'zod';
import { Company, User, AttendanceLog, AuditLog, Department } from '../models/index.js';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUS, AUDIT_ACTIONS } from '../config/constants.js';
import { tenantStore } from '../plugins/tenantPlugin.js';

/**
 * Service Quản lý Chấm công QR Động (Dynamic QR Attendance)
 * - Token HMAC-SHA256(companyId + userId + timestamp + nonce)
 * - Chu kỳ 30s (Client refresh mỗi 30s, Server TTL 35s bù trễ mạng)
 * - Nonce dùng 1 lần lưu trong RAM (không tạo collection mới)
 * - Chống Replay Attack 100%: Quét lần 2 bị từ chối ngay lập tức
 */

// Bộ nhớ RAM lưu trữ nonces QR đang có hiệu lực: Map<nonce, { companyId, userId, timestamp, expiresAt, used: boolean }>
const activeQrNonceMap = new Map();

// Tự động dọn dẹp các nonce hết hạn mỗi 30 giây
setInterval(() => {
  const now = Date.now();
  for (const [nonce, data] of activeQrNonceMap.entries()) {
    if (data.expiresAt <= now) {
      activeQrNonceMap.delete(nonce);
    }
  }
}, 30000).unref();

/**
 * Lấy khóa bí mật HMAC từ môi trường
 */
const getHmacSecret = () => {
  return process.env.JWT_SECRET || 'datn_secret_qr_hmac_2026';
};

/**
 * Tính toán chữ ký HMAC-SHA256 cho chuỗi payload
 */
export const computeQrSignature = (companyId, userId, timestamp, nonce) => {
  const payload = `${companyId}:${userId}:${timestamp}:${nonce}`;
  return crypto.createHmac('sha256', getHmacSecret()).update(payload).digest('hex');
};

/**
 * Tiện ích bọc tenantStore nếu chưa có ngữ cảnh
 */
const runWithTenant = async (companyId, fn) => {
  const current = tenantStore.getStore()?.companyId;
  if (current) {
    return fn();
  }
  return tenantStore.run({ companyId: companyId.toString() }, fn);
};

/**
 * Sinh mã QR Động cho nhân viên (Dynamic QR Token)
 * @param {string} companyId ID doanh nghiệp
 * @param {string} userId ID nhân viên
 * @returns {Promise<object>} Thông tin mã QR và thời gian hết hạn
 */
export const generateDynamicQrToken = async (companyId, userId) => {
  return runWithTenant(companyId, async () => {
    const user = await User.findOne({ _id: userId, companyId }).select('_id fullName employeeCode avatarUrl isActive');
    if (!user || !user.isActive) {
      const error = new Error('Tài khoản nhân sự không tồn tại hoặc đã bị vô hiệu hóa');
      error.statusCode = 403;
      throw error;
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const signature = computeQrSignature(companyId.toString(), userId.toString(), timestamp, nonce);

    // TTL: 35 giây (30s chu kỳ hiển thị + 5s dung sai trễ mạng)
    const ttlMs = 35000;
    const expiresAt = timestamp + ttlMs;

    activeQrNonceMap.set(nonce, {
      companyId: companyId.toString(),
      userId: userId.toString(),
      timestamp,
      expiresAt,
      used: false,
    });

    // Payload định dạng chuẩn gọn gàng
    const qrPayload = JSON.stringify({
      c: companyId.toString(),
      u: userId.toString(),
      t: timestamp,
      n: nonce,
      s: signature,
    });

    return {
      qrCode: qrPayload,
      payload: {
        companyId: companyId.toString(),
        userId: userId.toString(),
        timestamp,
        nonce,
        signature,
      },
      cycleSeconds: 30,
      expiresInSeconds: 30,
      expiresAt: timestamp + 30000,
      user: {
        id: user._id,
        fullName: user.fullName,
        employeeCode: user.employeeCode,
        avatarUrl: user.avatarUrl,
      },
    };
  });
};


// Schema xác thực request quét mã QR
export const qrScanSchema = z.object({
  qrData: z.string().min(1, 'Dữ liệu mã QR không được để trống'),
  deviceId: z.string().optional().default('qr_scanner_web'),
  note: z.string().optional(),
}).strict();

/**
 * Xử lý xác thực mã QR và điểm danh nhân viên
 * @param {object} params
 * @param {string} params.scannerCompanyId ID công ty của máy quét / thiết bị Kiosk
 * @param {string} params.qrData Chuỗi mã QR quét được
 * @param {string} [params.deviceId] ID thiết bị quét
 * @param {string} [params.scannedByUserId] (Tùy chọn) ID người thực hiện quét
 * @param {Date} [params.referenceDate] (Tùy chọn) Dùng cho test mock thời gian
 */
export const verifyAndProcessQrScan = async ({
  scannerCompanyId,
  qrData,
  deviceId = 'qr_scanner_web',
  scannedByUserId = null,
  referenceDate = new Date(),
}) => {
  const checkTime = new Date(referenceDate);

  // 1. Phân tích dữ liệu mã QR
  let payloadObj;
  try {
    if (qrData.startsWith('{')) {
      payloadObj = JSON.parse(qrData);
    } else {
      // Hỗ trợ định dạng c:u:t:n:s
      const parts = qrData.split(':');
      if (parts.length === 5) {
        payloadObj = {
          c: parts[0],
          u: parts[1],
          t: Number(parts[2]),
          n: parts[3],
          s: parts[4],
        };
      } else {
        throw new Error('Định dạng token không đúng');
      }
    }
  } catch {
    const error = new Error('Dữ liệu mã QR bị lỗi cấu trúc hoặc không thể giải mã');
    error.statusCode = 400;
    error.code = 'QR_MALFORMED';
    throw error;
  }

  const { c: tokenCompanyId, u: tokenUserId, t: tokenTimestamp, n: tokenNonce, s: tokenSignature } = payloadObj;

  if (!tokenCompanyId || !tokenUserId || !tokenTimestamp || !tokenNonce || !tokenSignature) {
    const error = new Error('Dữ liệu mã QR thiếu các tham số bảo mật cần thiết');
    error.statusCode = 400;
    error.code = 'QR_INVALID_FIELDS';
    throw error;
  }

  // 2. Kiểm tra tính toàn vẹn chữ ký HMAC-SHA256
  const expectedSignature = computeQrSignature(tokenCompanyId, tokenUserId, tokenTimestamp, tokenNonce);
  const signatureBuf = Buffer.from(tokenSignature, 'utf8');
  const expectedBuf = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    const error = new Error('Chữ ký mã QR không hợp lệ hoặc đã bị chỉnh sửa bất hợp pháp');
    error.statusCode = 400;
    error.code = 'QR_INVALID_SIGNATURE';
    throw error;
  }

  // 3. Kiểm tra thời hạn hiệu lực (30s chu kỳ + 5s bù trễ mạng = tối đa 35s)
  const now = checkTime.getTime();
  const tokenAge = now - tokenTimestamp;

  if (tokenAge > 35000) {
    const error = new Error('Mã QR đã hết hạn sử dụng (chu kỳ 30s). Vui lòng yêu cầu nhân viên làm mới mã QR');
    error.statusCode = 400;
    error.code = 'QR_EXPIRED';
    error.ageMs = tokenAge;
    throw error;
  }

  if (tokenAge < -5000) {
    const error = new Error('Thời gian trên mã QR lệch quá nhiều so với đồng hồ hệ thống');
    error.statusCode = 400;
    error.code = 'QR_FUTURE_TIMESTAMP';
    throw error;
  }

  // 4. Cơ chế chống Replay Attack: Tiêu hủy Nonce dùng 1 lần trong RAM
  const nonceRecord = activeQrNonceMap.get(tokenNonce);
  if (!nonceRecord || nonceRecord.used === true) {
    const error = new Error(
      'Mã QR này đã được sử dụng hoặc không hợp lệ. Hệ thống từ chối quét lặp lại (Chống Replay Attack)!'
    );
    error.statusCode = 409;
    error.code = 'QR_REPLAY_ATTACK_DETECTED';
    throw error;
  }

  // Đánh dấu đã sử dụng ngay lập tức
  nonceRecord.used = true;
  activeQrNonceMap.delete(tokenNonce);

  // 5. Kiểm tra Multi-tenant: Mã QR phải thuộc doanh nghiệp của máy quét
  if (scannerCompanyId && scannerCompanyId.toString() !== tokenCompanyId.toString()) {
    const error = new Error('Mã QR này thuộc về doanh nghiệp khác, không thể điểm danh tại đây');
    error.statusCode = 403;
    error.code = 'CROSS_TENANT_QR_DENIED';
    throw error;
  }

  return runWithTenant(tokenCompanyId, async () => {
    // 6. Kiểm tra tài khoản nhân viên
    const user = await User.findOne({
      _id: tokenUserId,
      companyId: tokenCompanyId,
    }).select('_id fullName employeeCode departmentId avatarUrl isActive');

    if (!user || !user.isActive) {
      const error = new Error('Tài khoản nhân sự không tồn tại hoặc đã bị vô hiệu hóa');
      error.statusCode = 403;
      error.code = 'USER_DEACTIVATED';
      throw error;
    }

    let departmentName = 'Văn phòng chung';
    if (user.departmentId) {
      const dept = await Department.findById(user.departmentId).select('name');
      if (dept) departmentName = dept.name;
    }

  // 7. Kiểm tra ca làm việc & tính trạng thái đi muộn (isLate)
  const company = await Company.findById(tokenCompanyId).select('name settings.shifts');
  const defaultShift = company?.settings?.shifts?.[0] || {
    startTime: '08:30',
    endTime: '17:30',
    gracePeriodMinutes: 15,
  };

  const todayStr = checkTime.toISOString().slice(0, 10); // YYYY-MM-DD
  const hours = checkTime.getHours();
  const minutes = checkTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [shiftStartH, shiftStartM] = defaultShift.startTime.split(':').map(Number);
  const shiftStartMinutes = shiftStartH * 60 + shiftStartM;
  const graceMinutes = defaultShift.gracePeriodMinutes || 15;

  const isLate = currentMinutes > shiftStartMinutes + graceMinutes;

  // 8. Ghi nhận hoặc cập nhật nhật ký điểm danh trong AttendanceLog
  let attendanceLog = await AttendanceLog.findOne({
    companyId: tokenCompanyId,
    userId: user._id,
    date: todayStr,
  });

  let actionType = 'CHECK_IN';
  let workDurationMinutes = 0;

  if (!attendanceLog) {
    // Lần đầu trong ngày -> CHECK_IN
    actionType = 'CHECK_IN';
    attendanceLog = await AttendanceLog.create({
      companyId: tokenCompanyId,
      userId: user._id,
      date: todayStr,
      checkInTime: checkTime,
      checkOutTime: null,
      method: ATTENDANCE_METHODS.QR,
      status: ATTENDANCE_STATUS.VALID,
      deviceId,
      isLate,
      workDurationMinutes: 0,
    });
  } else {
    // Đã có check-in trước đó -> CHECK_OUT
    actionType = 'CHECK_OUT';
    const firstCheckIn = attendanceLog.checkInTime || checkTime;
    workDurationMinutes = Math.max(0, Math.round((checkTime.getTime() - firstCheckIn.getTime()) / 60000));

    attendanceLog.checkOutTime = checkTime;
    attendanceLog.workDurationMinutes = workDurationMinutes;
    attendanceLog.method = ATTENDANCE_METHODS.QR;
    await attendanceLog.save();
  }

  // 9. Ghi AuditLog bảo mật vết kiểm toán
  await AuditLog.create({
    companyId: tokenCompanyId,
    userId: scannedByUserId || user._id,
    action: AUDIT_ACTIONS.QR_ATTENDANCE_CHECK,
    details: {
      targetUserId: user._id,
      actionType,
      method: ATTENDANCE_METHODS.QR,
      deviceId,
      isLate,
      workDurationMinutes,
      nonce: tokenNonce,
    },
  });

  const formattedTime = checkTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

    return {
      success: true,
      message: `${actionType === 'CHECK_IN' ? 'Check-in' : 'Check-out'} mã QR thành công lúc ${formattedTime}!`,
      data: {
        actionType,
        user: {
          id: user._id,
          fullName: user.fullName,
          employeeCode: user.employeeCode,
          avatarUrl: user.avatarUrl,
          departmentName,
        },
        checkTime: formattedTime,
        date: todayStr,
        isLate,
        workDurationMinutes,
        method: ATTENDANCE_METHODS.QR,
        status: ATTENDANCE_STATUS.VALID,
      },
    };
  });
};

/**
 * Xóa toàn bộ Nonces trong RAM (Dành riêng cho test suite)
 */
export const _clearQrNonceMapForTesting = () => {
  activeQrNonceMap.clear();
};
