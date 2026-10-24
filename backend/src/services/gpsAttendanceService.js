import { z } from 'zod';
import { Company, User, AttendanceLog } from '../models/index.js';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUS } from '../config/constants.js';

// Schema xác thực tọa độ GPS di động gửi lên từ Client
export const gpsCheckInSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Vĩ độ không hợp lệ (phải từ -90 đến 90)')
    .max(90, 'Vĩ độ không hợp lệ (phải từ -90 đến 90)'),
  longitude: z
    .number()
    .min(-180, 'Kinh độ không hợp lệ (phải từ -180 đến 180)')
    .max(180, 'Kinh độ không hợp lệ (phải từ -180 đến 180)'),
  accuracy: z
    .number()
    .min(0, 'Sai số GPS không được âm'),
  deviceId: z.string().optional().default('mobile_web'),
  note: z.string().optional(),
}).strict();

/**
 * Công thức Haversine tính khoảng cách giữa 2 tọa độ GPS (mét)
 */
export const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

/**
 * Xử lý điểm danh di động bằng GPS Geofencing
 * Kiểm tra accuracy < 50m, Haversine <= radiusMeters (<= 100m)
 */
export const processGpsCheckIn = async (companyId, userId, payload) => {
  const validated = gpsCheckInSchema.parse(payload);
  const { latitude, longitude, accuracy, deviceId } = validated;

  // 1. Kiểm tra độ chính xác tín hiệu GPS (chống GPS giả mạo / tín hiệu kém)
  if (accuracy >= 50) {
    const error = new Error(
      `Độ chính xác tín hiệu GPS hiện tại là ${accuracy.toFixed(1)}m (vượt quá ngưỡng cho phép < 50m). Vui lòng di chuyển ra nơi thông thoáng hoặc bật chế độ vị trí độ chính xác cao trên thiết bị.`
    );
    error.statusCode = 400;
    error.code = 'GPS_ACCURACY_TOO_POOR';
    error.accuracy = accuracy;
    throw error;
  }

  // 2. Lấy thông tin công ty và cấu hình địa điểm GPS (companies.settings.locations)
  const company = await Company.findById(companyId).select('name settings.locations settings.shifts');
  if (!company) {
    const error = new Error('Không tìm thấy công ty');
    error.statusCode = 404;
    throw error;
  }

  const locations = company.settings?.locations || [];
  if (locations.length === 0) {
    const error = new Error(
      'Công ty chưa thiết lập địa điểm văn phòng cho phép chấm công GPS. Vui lòng liên hệ Quản trị viên để cấu hình tọa độ geofence.'
    );
    error.statusCode = 400;
    error.code = 'NO_COMPANY_LOCATIONS';
    throw error;
  }

  // 3. Tính khoảng cách Haversine tới tất cả các văn phòng của công ty
  let matchedLocation = null;
  let minDistance = Infinity;
  let closestLocation = null;

  for (const loc of locations) {
    const dist = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      loc.latitude,
      loc.longitude
    );

    if (dist < minDistance) {
      minDistance = dist;
      closestLocation = loc;
    }

    const allowedRadius = loc.radiusMeters || 100;
    if (dist <= allowedRadius) {
      matchedLocation = loc;
      minDistance = dist;
      break;
    }
  }

  // 4. Nếu ngoài vùng cho phép (distance > radiusMeters)
  if (!matchedLocation) {
    const allowedRadius = closestLocation?.radiusMeters || 100;
    const error = new Error(
      `Bạn đang ở ngoài vùng chấm công cho phép. Khoảng cách gần nhất đến [${closestLocation.name}] là ${minDistance}m (bán kính hợp lệ: ${allowedRadius}m).`
    );
    error.statusCode = 400;
    error.code = 'OUT_OF_GEOFENCE';
    error.details = {
      closestLocation: closestLocation.name,
      distanceMeters: minDistance,
      allowedRadius,
      clientCoords: { latitude, longitude, accuracy },
    };
    throw error;
  }

  // 5. Kiểm tra tài khoản nhân viên
  const user = await User.findOne({ _id: userId, companyId }).select('_id fullName employeeCode isActive');
  if (!user || !user.isActive) {
    const error = new Error('Tài khoản nhân sự không tồn tại hoặc đã bị vô hiệu hóa');
    error.statusCode = 403;
    throw error;
  }

  // 6. Tính toán ca làm việc và trạng thái đi muộn (isLate)
  const defaultShift = company.settings?.shifts?.[0] || {
    startTime: '08:30',
    endTime: '17:30',
    gracePeriodMinutes: 15,
  };

  const checkTime = new Date();
  const todayStr = checkTime.toISOString().slice(0, 10); // YYYY-MM-DD
  const hours = checkTime.getHours();
  const minutes = checkTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [shiftStartH, shiftStartM] = defaultShift.startTime.split(':').map(Number);
  const shiftStartMinutes = shiftStartH * 60 + shiftStartM;
  const graceMinutes = defaultShift.gracePeriodMinutes || 15;

  const isLate = currentMinutes > shiftStartMinutes + graceMinutes;

  // 7. Cập nhật hoặc tạo mới bản ghi trong attendanceLogs
  let attendanceLog = await AttendanceLog.findOne({
    companyId,
    userId: user._id,
    date: todayStr,
  });

  let actionType = 'CHECK_IN';
  let workDurationMinutes = 0;

  if (!attendanceLog) {
    // Lần đầu trong ngày -> CHECK_IN
    actionType = 'CHECK_IN';
    attendanceLog = await AttendanceLog.create({
      companyId,
      userId: user._id,
      date: todayStr,
      checkInTime: checkTime,
      checkOutTime: null,
      method: ATTENDANCE_METHODS.GPS,
      status: ATTENDANCE_STATUS.VALID,
      deviceId,
      location: {
        latitude,
        longitude,
        accuracy,
        distanceMeters: minDistance,
      },
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
    attendanceLog.location = {
      latitude,
      longitude,
      accuracy,
      distanceMeters: minDistance,
    };
    await attendanceLog.save();
  }

  const formattedTime = checkTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    success: true,
    actionType,
    message:
      actionType === 'CHECK_IN'
        ? `Điểm danh vào ca thành công lúc ${formattedTime} tại [${matchedLocation.name}]`
        : `Điểm danh hết ca thành công lúc ${formattedTime} (Tổng: ${Math.floor(workDurationMinutes / 60)}h ${workDurationMinutes % 60}p)`,
    data: {
      actionType,
      date: todayStr,
      checkTime: checkTime.toISOString(),
      formattedTime,
      matchedLocation: {
        name: matchedLocation.name,
        distanceMeters: minDistance,
        radiusMeters: matchedLocation.radiusMeters || 100,
      },
      isLate,
      workDurationMinutes,
      method: ATTENDANCE_METHODS.GPS,
      attendanceLogId: attendanceLog._id,
    },
  };
};

/**
 * Lấy trạng thái chấm công hôm nay của nhân viên hiện tại
 */
export const getTodayAttendance = async (companyId, userId) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const log = await AttendanceLog.findOne({
    companyId,
    userId,
    date: todayStr,
  });

  return {
    hasCheckIn: !!log?.checkInTime,
    hasCheckOut: !!log?.checkOutTime,
    checkInTime: log?.checkInTime || null,
    checkOutTime: log?.checkOutTime || null,
    workDurationMinutes: log?.workDurationMinutes || 0,
    method: log?.method || null,
    isLate: log?.isLate || false,
    status: log?.status || null,
    location: log?.location || null,
  };
};

/**
 * Lấy lịch sử chấm công của nhân viên
 */
export const getMyAttendanceHistory = async (companyId, userId, limit = 30) => {
  const logs = await AttendanceLog.find({
    companyId,
    userId,
  })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return logs;
};
