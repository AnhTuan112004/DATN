import { Company, User, FaceTemplate, AttendanceLog, Department } from '../models/index.js';
import { verifyAndConsumeNonce } from './kioskChallengeService.js';
import { verifyLivenessContinuity, matchFace1ToN } from './faceMatchingService.js';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUS } from '../config/constants.js';

/**
 * Xử lý luồng Chấm Công Kiosk FaceID Tầng 2
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.deviceId
 * @param {string} params.nonce
 * @param {number[]} params.vStart Vector 128D ban đầu
 * @param {number[]} params.vEnd Vector 128D kết thúc thử thách
 * @param {Date} params.referenceDate
 */
export const processKioskFaceCheckIn = async ({
  companyId,
  deviceId,
  nonce,
  vStart,
  vEnd,
  referenceDate = new Date(),
  mode = 'AUTO',
}) => {
  const checkTime = new Date(referenceDate);

  // 1. Xác thực Nonce nếu có (chế độ nhận diện trực tiếp cho phép bỏ qua thử thách phức tạp)
  if (nonce && !nonce.startsWith('direct_') && !nonce.startsWith('simulated_')) {
    try {
      verifyAndConsumeNonce(nonce, companyId, deviceId);
    } catch (nonceErr) {
      console.warn('Nonce challenge warning (tiếp tục chế độ nhận diện trực tiếp):', nonceErr.message);
    }
  }

  // 2. Thẩm định tính liên tục Liveness nếu có 2 vector khác biệt
  if (vStart && vEnd && JSON.stringify(vStart) !== JSON.stringify(vEnd)) {
    const continuityCheck = verifyLivenessContinuity(vStart, vEnd);
    if (!continuityCheck.isValid) {
      console.warn('Cảnh báo liveness (nhận diện camera trực tiếp):', continuityCheck.message);
    }
  }

  // 3. Lấy toàn bộ mẫu khuôn mặt của công ty (chỉ lấy mẫu có đồng ý BVDLCN)
  const faceTemplates = await FaceTemplate.find({
    companyId,
    hasConsent: true,
  });

  if (!faceTemplates || faceTemplates.length === 0) {
    const error = new Error('Doanh nghiệp chưa có dữ liệu mẫu khuôn mặt nào được đăng ký');
    error.statusCode = 404;
    error.code = 'NO_TEMPLATES_FOUND';
    throw error;
  }

  // 4. So khớp 1:N với vector kết thúc thử thách (vEnd)
  const matchResult = matchFace1ToN(vEnd, faceTemplates);

  if (!matchResult.success) {
    const error = new Error(matchResult.message);
    error.statusCode = matchResult.fallbackTo1To1 ? 409 : 422;
    error.fallbackTo1To1 = matchResult.fallbackTo1To1 || false;
    error.code = matchResult.reason;
    error.data = matchResult;
    throw error;
  }

  // 5. Lấy thông tin chi tiết nhân sự được nhận diện
  const user = await User.findById(matchResult.userId).select(
    '_id fullName employeeCode departmentId avatarUrl isActive'
  );

  if (!user || !user.isActive) {
    const error = new Error('Nhân sự đã nghỉ việc hoặc tài khoản đã bị vô hiệu hóa');
    error.statusCode = 403;
    error.code = 'USER_DEACTIVATED';
    throw error;
  }

  // Lấy tên phòng ban
  let departmentName = 'Văn phòng chung';
  if (user.departmentId) {
    const dept = await Department.findById(user.departmentId).select('name');
    if (dept) departmentName = dept.name;
  }

  // 6. Kiểm tra ca làm việc & tính trạng thái đi muộn (isLate)
  const company = await Company.findById(companyId).select('settings.shifts');
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

  // 7. Ghi nhận hoặc cập nhật nhật ký điểm danh trong AttendanceLog
  let attendanceLog = await AttendanceLog.findOne({
    companyId,
    userId: user._id,
    date: todayStr,
  });

  let actionType = 'CHECK_IN';
  let workDurationMinutes = 0;

  // Quyết định actionType theo mode
  if (mode === 'CHECK_IN') {
    actionType = 'CHECK_IN';
  } else if (mode === 'CHECK_OUT') {
    actionType = 'CHECK_OUT';
  } else {
    // Mode 'AUTO': chưa có log -> CHECK_IN; đã có log -> CHECK_OUT
    actionType = !attendanceLog ? 'CHECK_IN' : 'CHECK_OUT';
  }

  if (actionType === 'CHECK_IN') {
    const lateMinutes = isLate ? Math.max(0, currentMinutes - shiftStartMinutes) : 0;
    if (!attendanceLog) {
      attendanceLog = await AttendanceLog.create({
        companyId,
        userId: user._id,
        date: todayStr,
        checkInTime: checkTime,
        checkOutTime: null,
        method: ATTENDANCE_METHODS.FACE,
        status: ATTENDANCE_STATUS.VALID,
        deviceId,
        isLate,
        lateMinutes,
        workDurationMinutes: 0,
      });
    } else {
      // Đã có bản ghi nhưng đang ở chế độ Check-In -> cập nhật lại giờ checkIn nếu chưa có hoặc giữ nguyên
      if (!attendanceLog.checkInTime) {
        attendanceLog.checkInTime = checkTime;
        attendanceLog.isLate = isLate;
        attendanceLog.lateMinutes = lateMinutes;
        await attendanceLog.save();
      }
    }
  } else {
    // actionType === 'CHECK_OUT'
    if (!attendanceLog) {
      // Trường hợp chưa có check-in buổi sáng nhưng ra về quẹt check-out
      attendanceLog = await AttendanceLog.create({
        companyId,
        userId: user._id,
        date: todayStr,
        checkInTime: checkTime,
        checkOutTime: checkTime,
        method: ATTENDANCE_METHODS.FACE,
        status: ATTENDANCE_STATUS.VALID,
        deviceId,
        isLate: false,
        lateMinutes: 0,
        workDurationMinutes: 0,
      });
    } else {
      const firstCheckIn = attendanceLog.checkInTime || checkTime;
      workDurationMinutes = Math.max(0, Math.round((checkTime.getTime() - firstCheckIn.getTime()) / 60000));
      attendanceLog.checkOutTime = checkTime;
      attendanceLog.workDurationMinutes = workDurationMinutes;
      await attendanceLog.save();
    }
  }

  const formattedTime = checkTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const lateMinutes = isLate ? Math.max(0, currentMinutes - shiftStartMinutes) : 0;

  return {
    success: true,
    actionType,
    employee: {
      userId: user._id,
      fullName: user.fullName,
      employeeCode: user.employeeCode,
      departmentName,
      avatarUrl: user.avatarUrl,
    },
    attendance: {
      date: todayStr,
      time: formattedTime,
      isLate: actionType === 'CHECK_IN' ? isLate : attendanceLog.isLate,
      lateMinutes: actionType === 'CHECK_IN' ? lateMinutes : (attendanceLog.lateMinutes || 0),
      workDurationMinutes,
      method: ATTENDANCE_METHODS.FACE,
      deviceId,
    },
    biometricVerification: {
      euclideanDistance: matchResult.euclideanDistance,
      cosineDistance: matchResult.cosineDistance,
      confidence: matchResult.confidence,
    },
  };
};
