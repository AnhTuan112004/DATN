import mongoose from 'mongoose';
import { AttendanceLog } from '../../models/AttendanceLog.js';
import { LeaveRequest } from '../../models/LeaveRequest.js';
import { ATTENDANCE_STATUS, APPROVAL_STATUS, LEAVE_REQUEST_TYPES } from '../../config/constants.js';

/**
 * Lấy ngày bắt đầu và kết thúc của một tháng định dạng YYYY-MM
 */
export const getPeriodDateRange = (period) => {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startDate = `${period}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const endDate = `${period}-${String(lastDay).padStart(2, '0')}`;

  return { startDate, endDate, lastDay, year, month };
};

/**
 * Đếm số ngày làm việc chuẩn (thứ 2 đến thứ 6) trong tháng
 */
export const calculateStandardWorkingDays = (year, month) => {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let workingDays = 0;

  for (let d = 1; d <= lastDay; d++) {
    const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    // 0 = Chủ nhật, 6 = Thứ 7
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
};

/**
 * Tổng hợp dữ liệu công và làm thêm giờ thực tế từ attendanceLogs và leaveRequests
 */
export const aggregateEmployeeAttendance = async ({
  companyId,
  userId,
  period,
}) => {
  const { startDate, endDate, year, month } = getPeriodDateRange(period);
  const standardWorkingDays = calculateStandardWorkingDays(year, month);

  const uId = new mongoose.Types.ObjectId(userId);
  const cId = new mongoose.Types.ObjectId(companyId);

  // 1. Tổng hợp AttendanceLog trong tháng (khớp chuỗi ngày YYYY-MM)
  const logs = await AttendanceLog.find({
    companyId: cId,
    userId: uId,
    date: new RegExp(`^${period}`),
    status: ATTENDANCE_STATUS.VALID,
  }).lean();
  // 1b. Đếm xem công ty đã có dữ liệu chấm công trong tháng này chưa
  const totalCompanyLogs = await AttendanceLog.countDocuments({
    companyId: cId,
    date: new RegExp(`^${period}`),
  });

  // Nếu nhân viên có log chấm công thì tính theo logs.length, nếu chưa phát sinh log cá nhân (nhân viên văn phòng/chưa quét kiosk) thì tính đủ công chuẩn
  const actualWorkingDays = logs.length > 0 ? logs.length : standardWorkingDays;

  let totalNightWorkMinutes = 0;
  for (const log of logs) {
    if (log.checkInTime && log.checkOutTime) {
      const inHour = new Date(log.checkInTime).getUTCHours();
      const outHour = new Date(log.checkOutTime).getUTCHours();
      // Ca đêm (22h - 6h)
      if (inHour >= 22 || outHour <= 6 || outHour > 22) {
        totalNightWorkMinutes += Math.min(log.workDurationMinutes || 0, 480);
      }
    }
  }
  const nightWorkHours = parseFloat((totalNightWorkMinutes / 60).toFixed(1));

  // 2. Tổng hợp các đơn LeaveRequest đã duyệt HR_APPROVED trong tháng
  const startPeriod = new Date(`${startDate}T00:00:00.000Z`);
  const endPeriod = new Date(`${endDate}T23:59:59.999Z`);

  const allApprovedLeaves = await LeaveRequest.find({
    companyId: cId,
    status: APPROVAL_STATUS.HR_APPROVED,
  }).lean();

  const approvedRequests = allApprovedLeaves.filter((req) => {
    if (req.userId.toString() !== uId.toString()) return false;
    const reqStart = new Date(req.startDate);
    const reqEnd = new Date(req.endDate);
    return reqStart <= endPeriod && reqEnd >= startPeriod;
  });

  let paidLeaveDays = 0;
  let sickLeaveDays = 0;
  let otHoursWeekday = 0;
  let otHoursWeekend = 0;
  let otHoursHoliday = 0;
  let otHoursNight = 0;
  let hasDaytimeOtBeforeNight = false;

  for (const req of approvedRequests) {
    if (req.type === LEAVE_REQUEST_TYPES.ANNUAL) {
      paidLeaveDays += req.durationDays || 0;
    } else if (req.type === LEAVE_REQUEST_TYPES.SICK) {
      sickLeaveDays += req.durationDays || 0;
    } else if (req.type === LEAVE_REQUEST_TYPES.OT) {
      const otHours = (req.durationDays || 0) * 8; // hoặc tính theo số giờ đăng ký
      // Phân bổ loại OT dựa trên ngày nghỉ hoặc cấu hình
      const reqDate = new Date(req.startDate);
      const dayOfWeek = reqDate.getUTCDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        otHoursWeekend += otHours;
      } else {
        otHoursWeekday += otHours;
      }
    }
  }

  // Giới hạn trần tháng Điều 98 BLLĐ
  const totalOtHours = otHoursWeekday + otHoursWeekend + otHoursHoliday + otHoursNight;
  const monthlyOtCapHours = 40;
  const dailyOverCapHours = 0;
  const yearlyOverCapHours = 0;

  return {
    standardWorkingDays,
    actualWorkingDays,
    paidLeaveDays,
    sickLeaveDays,
    unpaidLeaveDays: 0,
    otHoursWeekday,
    otHoursWeekend,
    otHoursHoliday,
    otHoursNight,
    totalOtHours,
    monthlyOtCapHours,
    dailyOverCapHours,
    yearlyOverCapHours,
    hasDaytimeOtBeforeNight,
    nightWorkHours,
  };
};
