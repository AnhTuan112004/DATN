import mongoose from 'mongoose';
import { Company } from '../../models/Company.js';
import { User } from '../../models/User.js';
import { Payroll } from '../../models/Payroll.js';
import { AuditLog } from '../../models/AuditLog.js';
import { tenantStore } from '../../plugins/tenantPlugin.js';
import { calculatePayroll } from './calc.js';
import { resolvePolicy } from './policyResolver.js';
import { aggregateEmployeeAttendance } from './payrollAggregationService.js';
import { createAndSendNotification } from '../notificationService.js';
import { ROLES, AUDIT_ACTIONS } from '../../config/constants.js';

/**
 * Tiện ích bọc tenant context nếu chưa có
 */
const runWithTenant = (companyId, fn) => {
  const current = tenantStore.getStore()?.companyId;
  if (current && current.toString() === companyId.toString()) {
    return fn();
  }
  return tenantStore.run({ companyId: companyId.toString() }, fn);
};

/**
 * 1. Chạy tính lương toàn công ty cho kỳ period (YYYY-MM)
 */
export const runCompanyPayroll = async ({
  companyId,
  period,
  approverId,
  payDate = null,
}) => {
  return runWithTenant(companyId, async () => {
    const cId = new mongoose.Types.ObjectId(companyId);

    // 1.1 Kiểm tra xem kỳ lương đã bị khóa trước đó chưa
    const existingLocked = await Payroll.findOne({
      companyId: cId,
      period,
      periodLockedAt: { $ne: null },
    }).lean();

    if (existingLocked) {
      const error = new Error(`Kỳ lương ${period} đã được khóa chính thức vào ${existingLocked.periodLockedAt}. Không thể tính toán lại!`);
      error.statusCode = 409;
      throw error;
    }

    // 1.2 Lấy thông tin công ty và cấu hình tham số
    const company = await Company.findById(cId).lean();
    if (!company) {
      const error = new Error('Doanh nghiệp không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // 1.3 Lấy danh sách nhân sự đang hoạt động (kèm salaryConfig)
    const employees = await User.find({
      companyId: cId,
      isActive: { $ne: false },
    })
      .select('+salaryConfig')
      .lean();

    if (employees.length === 0) {
      return {
        period,
        totalEmployees: 0,
        totalGross: 0,
        totalNet: 0,
        totalPit: 0,
        totalInsurance: 0,
        payrolls: [],
      };
    }

    const calculatedPayrolls = [];
    let sumGross = 0;
    let sumNet = 0;
    let sumPit = 0;
    let sumInsurance = 0;

    // 1.4 Lấy policy snapshot cho kỳ tính lương
    const { taxPolicy } = resolvePolicy(company.settings || {}, period, payDate);

    for (const emp of employees) {
      const salaryCfg = emp.salaryConfig || {};
      const baseSalary = salaryCfg.baseSalary || 10000000;
      const positionAllowance = salaryCfg.positionAllowance || 0;
      const mealAllowance = salaryCfg.mealAllowance || 730000;
      const otherBonus = salaryCfg.otherBonus || 0;
      const dependentsCount = salaryCfg.dependentsCount || 0;

      // Tổng hợp công thực tế và ngày nghỉ đã duyệt
      const attendanceData = await aggregateEmployeeAttendance({
        companyId: cId,
        userId: emp._id,
        period,
      });

      // Gọi hàm thuần tính toán 3 bước chuẩn 2026
      const calcResult = calculatePayroll({
        companySettings: company.settings || {},
        period,
        payDate,
        baseSalary,
        positionAllowance,
        mealAllowance,
        otherBonus,
        dependentsCount,
        standardWorkingDays: attendanceData.standardWorkingDays,
        actualWorkingDays: attendanceData.actualWorkingDays,
        paidLeaveDays: attendanceData.paidLeaveDays,
        sickLeaveDays: attendanceData.sickLeaveDays,
        otHoursWeekday: attendanceData.otHoursWeekday,
        otHoursWeekend: attendanceData.otHoursWeekend,
        otHoursHoliday: attendanceData.otHoursHoliday,
        otHoursNight: attendanceData.otHoursNight,
        nightWorkHours: attendanceData.nightWorkHours,
        hasDaytimeOtBeforeNight: attendanceData.hasDaytimeOtBeforeNight,
      });

      // Tạo/Cập nhật bản ghi Payroll (Upsert)
      const payrollDoc = await Payroll.findOneAndUpdate(
        {
          companyId: cId,
          userId: emp._id,
          period,
          periodLockedAt: null, // Chỉ cập nhật nếu chưa khóa
        },
        {
          $setOnInsert: {
            companyId: cId,
            userId: emp._id,
            period,
          },
          $set: {
            policySnapshot: {
              personalDeduction: taxPolicy.personalDeduction,
              dependentDeduction: taxPolicy.dependentDeduction,
              capBhxhBhyt: calcResult.cappedBhxh || calcResult.capBhxhBhyt,
              capBhtn: calcResult.cappedBhtn || calcResult.capBhtn,
              mealAllowanceCap: taxPolicy.mealAllowanceExemptCap || taxPolicy.mealAllowanceCap || 730000,
              brackets: taxPolicy.brackets,
            },
            standardWorkingDays: attendanceData.standardWorkingDays,
            actualWorkingDays: attendanceData.actualWorkingDays,
            otHoursWeekday: attendanceData.otHoursWeekday,
            otHoursWeekend: attendanceData.otHoursWeekend,
            otHoursHoliday: attendanceData.otHoursHoliday,
            otHoursNight: attendanceData.otHoursNight,
            nightWorkHours: attendanceData.nightWorkHours,
            paidLeaveDays: attendanceData.paidLeaveDays,

            grossIncome: calcResult.grossIncome,
            baseSalaryProrated: calcResult.baseSalaryProrated,
            otPayTotal: calcResult.otPayTotal,
            nightPayTotal: calcResult.nightPayTotal,
            allowanceTotal: calcResult.allowanceTotal,
            bonusTotal: calcResult.bonusTotal,
            mealAllowanceTotal: calcResult.mealAllowanceTotal,

            taxExemptOt: calcResult.taxExemptOt,
            taxExemptNight: calcResult.taxExemptNight,
            taxExemptMeal: calcResult.taxExemptMeal,
            taxExemptLeave: calcResult.taxExemptLeave,
            taxableIncome: calcResult.taxableIncome,

            insurableSalary: calcResult.insurableSalary,
            bhxhEmployee: calcResult.bhxhEmployee,
            bhytEmployee: calcResult.bhytEmployee,
            bhtnEmployee: calcResult.bhtnEmployee,
            totalInsuranceEmployee: calcResult.totalInsuranceEmployee,
            totalInsuranceEmployer: calcResult.totalInsuranceEmployer,

            personalDeductionAmount: calcResult.personalDeduction,
            dependentDeductionAmount: calcResult.dependentDeduction,
            assessableIncome: calcResult.assessableIncome,

            personalIncomeTax: calcResult.personalIncomeTax,
            netSalary: calcResult.netSalary,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      calculatedPayrolls.push({
        ...payrollDoc,
        user: {
          _id: emp._id,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
          email: emp.email,
        },
      });

      sumGross += calcResult.grossIncome;
      sumNet += calcResult.netSalary;
      sumPit += calcResult.personalIncomeTax;
      sumInsurance += calcResult.totalInsuranceEmployee;
    }

    // Ghi AuditLog
    if (approverId) {
      await AuditLog.create({
        companyId: cId,
        userId: new mongoose.Types.ObjectId(approverId),
        action: 'CALCULATE_PAYROLL',
        details: {
          period,
          totalEmployees: employees.length,
          totalGross: sumGross,
          totalNet: sumNet,
        },
      });
    }

    return {
      period,
      totalEmployees: employees.length,
      totalGross: sumGross,
      totalNet: sumNet,
      totalPit: sumPit,
      totalInsurance: sumInsurance,
      payrolls: calculatedPayrolls,
    };
  });
};

/**
 * 2. Khóa kỳ lương nguyên tử (chống sửa đổi bảng lương và dữ liệu nguồn)
 */
export const lockCompanyPayroll = async ({
  companyId,
  period,
  approverId,
}) => {
  return runWithTenant(companyId, async () => {
    const cId = new mongoose.Types.ObjectId(companyId);
    const uId = new mongoose.Types.ObjectId(approverId);

    // 2.1 Kiểm tra xem có bảng lương nào trong kỳ chưa
    const count = await Payroll.countDocuments({ companyId: cId, period });
    if (count === 0) {
      const error = new Error(`Chưa có dữ liệu bảng lương cho kỳ ${period}. Vui lòng chạy tính lương trước khi khóa!`);
      error.statusCode = 400;
      throw error;
    }

    // 2.2 Kiểm tra xem đã khóa chưa
    const lockedCount = await Payroll.countDocuments({
      companyId: cId,
      period,
      periodLockedAt: { $ne: null },
    });

    if (lockedCount > 0) {
      const error = new Error(`Kỳ lương ${period} đã được khóa trước đó!`);
      error.statusCode = 409;
      throw error;
    }

    const lockedAt = new Date();

    // 2.3 Khóa nguyên tử toàn bộ bảng lương trong kỳ
    await Payroll.updateMany(
      { companyId: cId, period, periodLockedAt: null },
      { $set: { periodLockedAt: lockedAt, lockedBy: uId } }
    );

    // 2.4 Ghi AuditLog bắt buộc
    await AuditLog.create({
      companyId: cId,
      userId: uId,
      action: AUDIT_ACTIONS.LOCK_PAYROLL,
      details: {
        period,
        lockedPayrollsCount: count,
        lockedAt,
      },
    });

    // 2.5 Phát thông báo cho tất cả nhân sự có bảng lương
    const payrolls = await Payroll.find({ companyId: cId, period }).select('userId').lean();
    for (const p of payrolls) {
      try {
        await createAndSendNotification({
          companyId: cId,
          userId: p.userId,
          title: `Phiếu lương kỳ ${period} đã phát hành`,
          message: `Bảng lương kỳ ${period} đã được khóa và chốt số liệu chính thức. Bạn có thể tra cứu phiếu lương chi tiết ngay bây giờ.`,
          type: 'PAYROLL_READY',
          data: { period },
        });
      } catch (err) {
        console.warn(`[Payroll Notification Error] ${err.message}`);
      }
    }

    return {
      success: true,
      period,
      lockedPayrollsCount: count,
      lockedAt,
    };
  });
};

/**
 * 3. Lấy phiếu lương cá nhân (Có kiểm tra bảo mật IDOR & AuditLog)
 */
export const getPayslip = async ({
  companyId,
  requestUser,
  targetUserId,
  period,
}) => {
  return runWithTenant(companyId, async () => {
    const cId = new mongoose.Types.ObjectId(companyId);
    const targetUId = new mongoose.Types.ObjectId(targetUserId);
    const requesterUId = new mongoose.Types.ObjectId(requestUser.userId);

    const isSelf = targetUId.toString() === requesterUId.toString();

    // Kiểm tra phân quyền IDOR chặt chẽ theo Hiến pháp v6.1:
    // - Employee chỉ được xem lương của chính mình.
    // - Quản lý (Manager) TUYỆT ĐỐI KHÔNG ĐƯỢC xem lương của nhân viên cấp dưới.
    if (!isSelf) {
      if (requestUser.role === ROLES.EMPLOYEE) {
        const error = new Error('FORBIDDEN_IDOR: Bạn không có quyền xem phiếu lương của người khác!');
        error.statusCode = 403;
        throw error;
      }

      if (requestUser.role === ROLES.MANAGER) {
        const error = new Error('FORBIDDEN_POLICY: Quản lý phòng ban không được phép xem tiền lương của nhân viên!');
        error.statusCode = 403;
        throw error;
      }

      // HR_MANAGER và CEO được phép xem, nhưng BẮT BUỘC ghi AuditLog
      await AuditLog.create({
        companyId: cId,
        userId: requesterUId,
        action: AUDIT_ACTIONS.VIEW_SALARY_OTHER,
        targetUserId: targetUId,
        details: { period, targetUserId: targetUId.toString() },
      });
    }

    const payslip = await Payroll.findOne({
      companyId: cId,
      userId: targetUId,
      period,
    })
      .populate('userId', 'fullName employeeCode email role')
      .lean();

    if (!payslip) {
      const error = new Error(`Không tìm thấy phiếu lương kỳ ${period} cho nhân sự này`);
      error.statusCode = 404;
      throw error;
    }

    return payslip;
  });
};

/**
 * 4. Lấy danh sách bảng lương toàn công ty (Dành riêng cho HR_MANAGER và CEO)
 */
export const getCompanyPayrolls = async ({
  companyId,
  requestUser,
  period,
  query = {},
}) => {
  return runWithTenant(companyId, async () => {
    // Chỉ CEO và HR_MANAGER được xem bảng lương tổng hợp toàn công ty
    if (![ROLES.CEO, ROLES.HR_MANAGER, ROLES.ADMIN].includes(requestUser.role)) {
      const error = new Error('FORBIDDEN: Chỉ CEO và HR Manager mới có quyền truy cập bảng lương toàn công ty!');
      error.statusCode = 403;
      throw error;
    }

    const cId = new mongoose.Types.ObjectId(companyId);
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { companyId: cId, period };

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('userId', 'fullName employeeCode email departmentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    // Thống kê tổng quan kỳ lương
    const stats = await Payroll.aggregate([
      { $match: { companyId: cId, period } },
      {
        $group: {
          _id: null,
          totalGross: { $sum: '$grossIncome' },
          totalNet: { $sum: '$netSalary' },
          totalPit: { $sum: '$personalIncomeTax' },
          totalInsurance: { $sum: '$totalInsuranceEmployee' },
          isLocked: { $max: { $cond: [{ $ne: ['$periodLockedAt', null] }, true, false] } },
        },
      },
    ]);

    return {
      period,
      summary: stats[0] || {
        totalGross: 0,
        totalNet: 0,
        totalPit: 0,
        totalInsurance: 0,
        isLocked: false,
      },
      payrolls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
};
