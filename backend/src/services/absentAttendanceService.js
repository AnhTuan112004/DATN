import { Company, User, AttendanceLog, LeaveRequest, AuditLog } from '../models/index.js';
import { tenantStore } from '../plugins/tenantPlugin.js';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUS, APPROVAL_STATUS, AUDIT_ACTIONS } from '../config/constants.js';

/**
 * Service Xử lý Chốt ABSENT Hàng Ngày & Catch-up (Tuần 2)
 * - Tự động chạy lúc 23:59 hoặc theo webhook từ cron-job.org
 * - Tính Idempotent: Chạy lại nhiều lần không tạo bản ghi trùng lặp
 * - Catch-up Ngày Lễ / Cuối Tuần / Đơn Xin Nghỉ Phép được duyệt
 * - Multi-tenant Fail-Closed: Bọc từng công ty trong tenantStore.run
 */

/**
 * Tiện ích kích hoạt tenantStore độc lập cho từng công ty
 */
const runWithTenant = (companyId, fn) => {
  return tenantStore.run({ companyId: companyId.toString() }, fn);
};

/**
 * Chốt trạng thái ABSENT cho một công ty cụ thể vào một ngày xác định
 * @param {string} companyId ID doanh nghiệp
 * @param {Date|string} targetDateInput Ngày cần kiểm tra (mặc định là hôm nay)
 */
export const checkCompanyAbsentForDate = async (companyId, targetDateInput = new Date()) => {
  return runWithTenant(companyId, async () => {
    const targetDate = new Date(targetDateInput);
    if (isNaN(targetDate.getTime())) {
      const error = new Error('Ngày chốt điểm danh không hợp lệ (định dạng mong muốn: YYYY-MM-DD)');
      error.statusCode = 400;
      throw error;
    }

    const dateStr = targetDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayOfWeek = targetDate.getDay(); // 0 = Chủ Nhật, 6 = Thứ Bảy

    // 1. Lấy thông tin cấu hình công ty (ngày nghỉ, ngày lễ)
    const company = await Company.findById(companyId).select('name settings.holidays settings.shifts');
    if (!company) {
      const error = new Error('Không tìm thấy thông tin doanh nghiệp');
      error.statusCode = 404;
      throw error;
    }

    // 2. Kiểm tra ngày nghỉ cuối tuần (Mặc định Chủ Nhật là ngày nghỉ hàng tuần)
    if (dayOfWeek === 0) {
      return {
        companyId,
        companyName: company.name,
        date: dateStr,
        isSkipped: true,
        reason: 'WEEKEND',
        message: `Bỏ qua chốt ABSENT vì ngày ${dateStr} là Chủ Nhật (ngày nghỉ hàng tuần).`,
        totalProcessed: 0,
        absentCount: 0,
      };
    }

    // 3. Kiểm tra ngày lễ của doanh nghiệp (companies.settings.holidays)
    const companyHolidays = company.settings?.holidays || [];
    const matchedHoliday = companyHolidays.find((h) => h.date === dateStr);

    if (matchedHoliday) {
      return {
        companyId,
        companyName: company.name,
        date: dateStr,
        isSkipped: true,
        reason: 'HOLIDAY',
        holidayName: matchedHoliday.name,
        message: `Bỏ qua chốt ABSENT vì ngày ${dateStr} là ngày nghỉ lễ: ${matchedHoliday.name}.`,
        totalProcessed: 0,
        absentCount: 0,
      };
    }

    // 4. Lấy danh sách tất cả nhân viên đang hoạt động của công ty
    const activeEmployees = await User.find({
      companyId,
      isActive: true,
    }).select('_id fullName employeeCode departmentId');

    if (!activeEmployees || activeEmployees.length === 0) {
      return {
        companyId,
        companyName: company.name,
        date: dateStr,
        isSkipped: false,
        message: 'Doanh nghiệp chưa có nhân viên nào đang hoạt động.',
        totalProcessed: 0,
        absentCount: 0,
      };
    }

    // 5. Lấy danh sách đơn nghỉ phép hợp lệ được phê duyệt trong ngày (LeaveRequest)
    // Thời điểm bắt đầu và kết thúc ngày để so khớp khoảng ngày đơn từ
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const approvedLeaves = await LeaveRequest.find({
      companyId,
      status: APPROVAL_STATUS.HR_APPROVED,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
    }).select('userId type startDate endDate');

    // Tạo Set các userId đã có đơn phép được duyệt
    const approvedLeaveUserSet = new Set(approvedLeaves.map((l) => l.userId.toString()));

    // 6. Lấy tất cả các bản ghi chấm công đã phát sinh trong ngày dateStr (AttendanceLog)
    const existingLogs = await AttendanceLog.find({
      companyId,
      date: dateStr,
    }).select('userId status checkInTime');

    // Tạo Map các userId đã có log
    const existingLogMap = new Map();
    for (const log of existingLogs) {
      existingLogMap.set(log.userId.toString(), log);
    }

    let absentCreated = 0;
    let alreadyCheckedInCount = 0;
    let alreadyAbsentCount = 0;
    let skippedLeaveCount = 0;
    const createdAbsentUsers = [];

    // 7. Duyệt từng nhân viên để đối chiếu điều kiện vắng mặt
    for (const employee of activeEmployees) {
      const empIdStr = employee._id.toString();

      // a) Nếu nhân viên có đơn nghỉ phép được duyệt -> Bỏ qua
      if (approvedLeaveUserSet.has(empIdStr)) {
        skippedLeaveCount++;
        continue;
      }

      // b) Nếu nhân viên đã có bản ghi chấm công
      if (existingLogMap.has(empIdStr)) {
        const existing = existingLogMap.get(empIdStr);
        if (existing.status === ATTENDANCE_STATUS.ABSENT) {
          // Tính Idempotent: Đã được chốt ABSENT trước đó, không ghi đè
          alreadyAbsentCount++;
        } else {
          // Đã có Check-in hoặc chấm công hợp lệ
          alreadyCheckedInCount++;
        }
        continue;
      }

      // c) Nhân viên hoàn toàn không có log điểm danh và không có đơn phép -> Tạo bản ghi ABSENT
      await AttendanceLog.create({
        companyId,
        userId: employee._id,
        date: dateStr,
        checkInTime: null,
        checkOutTime: null,
        method: ATTENDANCE_METHODS.MANUAL_ADJUSTMENT,
        status: ATTENDANCE_STATUS.ABSENT,
        isLate: false,
        workDurationMinutes: 0,
        adjustmentReason: `Hệ thống tự động chốt vắng mặt không phép lúc 23:59 (Cron ABSENT)`,
      });

      absentCreated++;
      createdAbsentUsers.push({
        id: employee._id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
      });
    }

    // 8. Ghi nhận vết kiểm toán AuditLog nếu có bản ghi ABSENT được tạo
    if (absentCreated > 0) {
      await AuditLog.create({
        companyId,
        userId: null, // Tiến trình ngầm của hệ thống
        action: AUDIT_ACTIONS.ADJUST_ATTENDANCE,
        details: {
          job: 'CRON_AUTO_ABSENT_CHECK',
          date: dateStr,
          absentCount: absentCreated,
          alreadyCheckedInCount,
          skippedApprovedLeaveCount: skippedLeaveCount,
          totalEmployees: activeEmployees.length,
        },
      });
    }

    return {
      companyId,
      companyName: company.name,
      date: dateStr,
      isSkipped: false,
      totalEmployees: activeEmployees.length,
      absentCount: absentCreated,
      alreadyCheckedInCount,
      alreadyAbsentCount,
      skippedLeaveCount,
      createdAbsentUsers,
      message: `Chốt công ngày ${dateStr}: Đã đánh dấu ${absentCreated} nhân sự vắng mặt không phép.`,
    };
  });
};

/**
 * Chạy quét chốt ABSENT cho toàn bộ các công ty trong hệ thống
 * @param {Date|string} targetDateInput Ngày cần kiểm tra (mặc định hôm nay)
 */
export const runAllCompaniesAbsentCheck = async (targetDateInput = new Date()) => {
  const targetDate = new Date(targetDateInput);
  const dateStr = !isNaN(targetDate.getTime()) ? targetDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  // Lấy toàn bộ các công ty đang hoạt động
  const companies = await Company.find({}).select('_id name');

  let totalAbsentMarked = 0;
  let totalProcessedCompanies = 0;
  const companyResults = [];

  for (const company of companies) {
    try {
      const result = await checkCompanyAbsentForDate(company._id, targetDate);
      totalProcessedCompanies++;
      totalAbsentMarked += result.absentCount || 0;
      companyResults.push(result);
    } catch (err) {
      console.error(`[Cron ABSENT Error] Lỗi khi xử lý công ty ${company.name} (${company._id}):`, err);
      companyResults.push({
        companyId: company._id,
        companyName: company.name,
        date: dateStr,
        isSkipped: true,
        error: err.message,
      });
    }
  }

  return {
    success: true,
    date: dateStr,
    totalCompanies: companies.length,
    totalProcessedCompanies,
    totalAbsentMarked,
    results: companyResults,
  };
};
