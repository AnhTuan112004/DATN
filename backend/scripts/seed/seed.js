/**
 * PeopleInsight AI (v6.1 FINAL FREEZE)
 * Database Seeder: Chuẩn 11 Collections (9 P0 + 2 P1)
 *
 * Nội dung nạp:
 * 1. Company: Cấu hình công ty, ca làm việc, GPS geofencing, Kiosk tokens,
 *    chính sách thuế TNCN 2 mốc 2026 (biểu 5 bậc mới, trần ăn ca 730k/1.2M),
 *    chính sách bảo hiểm (trần BHXH 46.8M/50.6M, trần BHTN 20x minWage).
 * 2. Departments: Cây phòng ban (BOD, IT, HR, FIN, SALES, OPS) kèm managerId.
 * 3. Users: Đủ 50 nhân viên giả lập (1 CEO, 2 HR Managers, 5 Dept Managers, 42 Employees)
 *    nhúng contracts[], leaveBalance (tính thâm niên Điều 114 BLLĐ), salaryConfig.
 * 4. AttendanceLogs: Dữ liệu chấm công thực tế nửa đầu tháng 10/2026 (đúng giờ, muộn, OT, ca đêm, FACE/GPS/QR).
 * 5. LeaveRequests: Đơn nghỉ phép đủ trạng thái (PENDING, MANAGER_APPROVED, HR_APPROVED, REJECTED)
 *    chuẩn luồng duyệt 2 cấp.
 * 6. Notifications & AuditLogs: Nhật ký kiểm toán và thông báo mẫu.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {
  Company,
  User,
  Department,
  AttendanceLog,
  LeaveRequest,
  Notification,
  AuditLog,
} from '../../src/models/index.js';
import {
  ROLES,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
  LEAVE_REQUEST_TYPES,
  APPROVAL_STATUS,
  AUDIT_ACTIONS,
} from '../../src/config/constants.js';
import { config } from '../../src/config/env.js';
import { departmentsData, employeesData } from './data/employeesData.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Đang kết nối tới MongoDB Atlas/Local...');
    await mongoose.connect(config.mongodb.uri);
    console.log('[Seed] Kết nối MongoDB thành công!');

    // =========================================================================
    // 1. CÔNG TY & CẤU HÌNH TOÀN HỆ THỐNG (COMPANY)
    // =========================================================================
    console.log('[Seed 1/6] Khởi tạo / cập nhật cấu hình Công ty chuẩn 2026...');
    const companyData = {
      name: 'Công ty Cổ phần Công nghệ PeopleInsight',
      code: 'PEOPLE_AI',
      settings: {
        region: 'I',
        shifts: [
          { shiftCode: 'HC', startTime: '08:30', endTime: '17:30', gracePeriodMinutes: 15 },
          { shiftCode: 'CA_CHIEU', startTime: '14:00', endTime: '22:00', gracePeriodMinutes: 15 },
          { shiftCode: 'CA_DEM', startTime: '22:00', endTime: '06:00', gracePeriodMinutes: 15 },
        ],
        locations: [
          { locationId: 'loc_hq', name: 'Trụ sở chính Keangnam Landmark 72', latitude: 21.0169, longitude: 105.7839, radiusMeters: 100 },
          { locationId: 'loc_demo', name: 'Phòng Bảo vệ ĐATN - Hội đồng K23', latitude: 21.0362, longitude: 105.7829, radiusMeters: 50 },
        ],
        devices: [
          { deviceId: 'kiosk_01', kioskSecretTokenHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', description: 'Kiosk FaceID Sảnh chính Tầng 1' },
          { deviceId: 'kiosk_demo', kioskSecretTokenHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', description: 'Kiosk FaceID Demo Hội đồng chấm thi' },
        ],
        minWageByRegion: [
          {
            effectiveFrom: '2026-01-01',
            effectiveTo: null,
            wages: { I: 5310000, II: 4730000, III: 4140000, IV: 3700000 },
          },
        ],
        taxPolicies: [
          {
            effectiveFrom: '2026-01-01',
            effectiveTo: '2026-06-30',
            personalDeduction: 15500000,
            dependentDeduction: 6200000,
            otExemption: true,
            nightShiftExemption: true,
            unusedLeaveExemption: true,
            mealAllowanceExemptCap: 730000, // Trần ăn ca 730k giai đoạn đầu năm 2026
            brackets: [
              { bracket: 1, maxIncome: 10000000, rate: 0.05 },
              { bracket: 2, maxIncome: 30000000, rate: 0.10 },
              { bracket: 3, maxIncome: 60000000, rate: 0.20 },
              { bracket: 4, maxIncome: 100000000, rate: 0.30 },
              { bracket: 5, maxIncome: 999999999, rate: 0.35 },
            ],
          },
          {
            effectiveFrom: '2026-07-01',
            effectiveTo: null,
            personalDeduction: 15500000,
            dependentDeduction: 6200000,
            otExemption: true,
            nightShiftExemption: true,
            unusedLeaveExemption: true,
            mealAllowanceExemptCap: 1200000, // Nâng trần ăn ca lên 1.2M từ 01/07/2026
            brackets: [
              { bracket: 1, maxIncome: 10000000, rate: 0.05 },
              { bracket: 2, maxIncome: 30000000, rate: 0.10 },
              { bracket: 3, maxIncome: 60000000, rate: 0.20 },
              { bracket: 4, maxIncome: 100000000, rate: 0.30 },
              { bracket: 5, maxIncome: 999999999, rate: 0.35 },
            ],
          },
        ],
        insuranceRates: [
          {
            effectiveFrom: '2026-01-01',
            effectiveTo: '2026-06-30',
            employeeRate: 0.105,
            employerRate: 0.215,
            capBhxhBhyt: 46800000, // 20 * 2.34M
            capBhtn: 'LOOKUP_MIN_WAGE',
          },
          {
            effectiveFrom: '2026-07-01',
            effectiveTo: null,
            employeeRate: 0.105,
            employerRate: 0.215,
            capBhxhBhyt: 50600000, // 20 * 2.53M (từ 01/07/2026)
            capBhtn: 'LOOKUP_MIN_WAGE',
          },
        ],
        otRates: { weekday: 1.5, weekend: 2.0, holiday: 3.0 },
        otNightAdditionalRate: 0.2,
        nightShiftRate: 0.3,
        otMaxHoursPerYear: 200,
        otDailyMaxHours: 4,
        holidays: [
          { date: '2026-01-01', name: 'Tết Dương lịch 2026' },
          { date: '2026-02-16', name: 'Tết Nguyên đán Bính Ngọ (29 Tết)' },
          { date: '2026-02-17', name: 'Tết Nguyên đán Bính Ngọ (Mùng 1)' },
          { date: '2026-02-18', name: 'Tết Nguyên đán Bính Ngọ (Mùng 2)' },
          { date: '2026-02-19', name: 'Tết Nguyên đán Bính Ngọ (Mùng 3)' },
          { date: '2026-02-20', name: 'Tết Nguyên đán Bính Ngọ (Mùng 4)' },
          { date: '2026-04-26', name: 'Giỗ Tổ Hùng Vương (10/3 ÂL)' },
          { date: '2026-04-30', name: 'Ngày Giải phóng Miền Nam' },
          { date: '2026-05-01', name: 'Ngày Quốc tế Lao động' },
          { date: '2026-09-02', name: 'Ngày Quốc khánh Việt Nam' },
          { date: '2026-09-03', name: 'Nghỉ liền kề Ngày Quốc khánh' },
        ],
      },
    };

    const company = await Company.findOneAndUpdate(
      { code: companyData.code },
      { $set: companyData },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Đã thiết lập công ty: ${company.name} (ID: ${company._id})`);

    // =========================================================================
    // 2. PHÒNG BAN (DEPARTMENTS)
    // =========================================================================
    console.log('[Seed 2/6] Tạo cây phòng ban 2 cấp...');
    const departmentMap = new Map();
    for (const d of departmentsData) {
      const dept = await Department.findOneAndUpdate(
        { companyId: company._id, code: d.code },
        { $set: { name: d.name, code: d.code, description: d.description } },
        { upsert: true, new: true }
      );
      departmentMap.set(d.code, dept);
    }
    console.log(`[Seed] Đã thiết lập ${departmentMap.size} phòng ban.`);

    // =========================================================================
    // 3. 50 NHÂN SỰ GIẢ LẬP (USERS)
    // =========================================================================
    console.log('[Seed 3/6] Mã hóa mật khẩu và tạo 50 nhân viên chuẩn v6.1...');
    // Mật khẩu mặc định cho toàn bộ tài khoản thử nghiệm: "Admin@123456"
    const commonPasswordHash = await bcrypt.hash('Admin@123456', 10);

    const userDocs = [];
    const currentYear = 2026;

    for (const emp of employeesData) {
      const dept = departmentMap.get(emp.deptCode);
      const hireDateObj = new Date(emp.hireDate);
      const hireYear = hireDateObj.getFullYear();
      const seniorityYears = Math.max(0, currentYear - hireYear);
      // Quy tắc Điều 114 Bộ luật Lao động: Cứ đủ 05 năm làm việc thì số ngày nghỉ phép năm tăng thêm tương ứng 01 ngày
      const seniorityBonusDays = Math.floor(seniorityYears / 5);
      const annualTotal = 12 + seniorityBonusDays;

      // Giả lập số ngày nghỉ hợp lý
      const annualUsed = seniorityYears > 3 ? Math.min(6, (emp.employeeCode.charCodeAt(5) % 5)) : 1;
      const sickUsed = emp.employeeCode.charCodeAt(5) % 3 === 0 ? 1 : 0;

      // Tạo hợp đồng lao động subdocument
      const contractNumber = `HDLD-${hireYear}-${emp.employeeCode}`;
      let effectiveTo = null;
      if (emp.contractType === 'PROBATION') {
        const d = new Date(hireDateObj);
        d.setMonth(d.getMonth() + 2);
        effectiveTo = d;
      } else if (emp.contractType === 'DEFINITE') {
        const d = new Date(hireDateObj);
        d.setFullYear(d.getFullYear() + 3);
        effectiveTo = d;
      }

      const contractSubdoc = {
        contractNumber,
        contractType: emp.contractType,
        effectiveFrom: hireDateObj,
        effectiveTo,
        baseSalary: emp.salaryConfig.baseSalary,
        allowance: emp.salaryConfig.positionAllowance,
        status: 'ACTIVE',
        signedDate: hireDateObj,
      };

      userDocs.push({
        companyId: company._id,
        departmentId: dept ? dept._id : null,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        passwordHash: commonPasswordHash,
        role: emp.role,
        phone: emp.phone,
        hireDate: hireDateObj,
        isActive: true,
        contracts: [contractSubdoc],
        leaveBalance: {
          annualTotal,
          annualUsed,
          seniorityBonusDays,
          sickUsed,
        },
        salaryConfig: {
          baseSalary: emp.salaryConfig.baseSalary,
          positionAllowance: emp.salaryConfig.positionAllowance,
          mealAllowance: emp.salaryConfig.mealAllowance,
          dependentsCount: emp.salaryConfig.dependentsCount,
          isResident: true,
          contractDurationMonths: emp.contractType === 'PROBATION' ? 2 : (emp.contractType === 'DEFINITE' ? 36 : 999),
        },
        refreshTokens: [],
        totalWorkingYears: emp.totalWorkingYears,
        numCompaniesWorked: emp.numCompaniesWorked,
      });
    }

    // Upsert từng nhân viên để tránh trùng lặp
    const createdUserMap = new Map();
    for (const u of userDocs) {
      const savedUser = await User.findOneAndUpdate(
        { companyId: u.companyId, employeeCode: u.employeeCode },
        { $set: u },
        { upsert: true, new: true }
      );
      createdUserMap.set(savedUser.employeeCode, savedUser);
    }
    console.log(`[Seed] Đã tạo thành công ${createdUserMap.size} nhân sự.`);

    // Cập nhật managerId theo cây phân cấp
    console.log('[Seed] Liên kết cây quản lý (managerId)...');
    for (const emp of employeesData) {
      if (emp.managerCode) {
        const mgr = createdUserMap.get(emp.managerCode);
        if (mgr) {
          await User.updateOne(
            { companyId: company._id, employeeCode: emp.employeeCode },
            { $set: { managerId: mgr._id } }
          );
        }
      }
    }

    // Cập nhật managerId cho các Phòng ban
    const itMgr = createdUserMap.get('EMP004');
    const hrMgr = createdUserMap.get('EMP002');
    const finMgr = createdUserMap.get('EMP005');
    const salesMgr = createdUserMap.get('EMP006');
    const opsMgr = createdUserMap.get('EMP007');
    const ceo = createdUserMap.get('EMP001');

    if (itMgr) await Department.updateOne({ _id: departmentMap.get('IT')._id }, { $set: { managerId: itMgr._id } });
    if (hrMgr) await Department.updateOne({ _id: departmentMap.get('HR')._id }, { $set: { managerId: hrMgr._id } });
    if (finMgr) await Department.updateOne({ _id: departmentMap.get('FIN')._id }, { $set: { managerId: finMgr._id } });
    if (salesMgr) await Department.updateOne({ _id: departmentMap.get('SALES')._id }, { $set: { managerId: salesMgr._id } });
    if (opsMgr) await Department.updateOne({ _id: departmentMap.get('OPS')._id }, { $set: { managerId: opsMgr._id } });
    if (ceo) await Department.updateOne({ _id: departmentMap.get('BOD')._id }, { $set: { managerId: ceo._id } });

    // =========================================================================
    // 4. DỮ LIỆU CHẤM CÔNG MẪU (ATTENDANCE LOGS)
    // =========================================================================
    console.log('[Seed 4/6] Khởi tạo nhật ký chấm công mẫu nửa đầu tháng 10/2026...');
    // Tạo chấm công cho 15 nhân viên mẫu trong 5 ngày làm việc gần nhất (08/10 -> 14/10/2026)
    const sampleDates = ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14'];
    const sampleUsers = [
      'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005',
      'EMP006', 'EMP007', 'EMP008', 'EMP009', 'EMP010',
      'EMP011', 'EMP012', 'EMP013', 'EMP014', 'EMP015',
    ];

    let attendanceLogsCount = 0;
    for (const code of sampleUsers) {
      const user = createdUserMap.get(code);
      if (!user) continue;

      for (let i = 0; i < sampleDates.length; i++) {
        const dateStr = sampleDates[i];
        let checkInH = 8;
        let checkInM = 20 + (user.employeeCode.charCodeAt(5) % 15); // 08:20 -> 08:34
        let checkOutH = 17;
        let checkOutM = 30 + (user.employeeCode.charCodeAt(5) % 15);
        let isLate = false;
        let isEarlyLeave = false;
        let overtimeMinutes = 0;
        let nightShiftMinutes = 0;
        let method = ATTENDANCE_METHODS.FACE;

        // Giả lập một số tình huống đặc biệt để test
        if (code === 'EMP004' && dateStr === '2026-10-09') {
          // Đi muộn
          checkInM = 52;
          isLate = true;
        } else if (code === 'EMP009' && dateStr === '2026-10-12') {
          // Làm thêm giờ (OT 2 tiếng)
          checkOutH = 19;
          checkOutM = 30;
          overtimeMinutes = 120;
        } else if (code === 'EMP010' && dateStr === '2026-10-13') {
          // Làm thêm giờ ban đêm (OT đêm 1.5 tiếng)
          checkOutH = 22;
          checkOutM = 30;
          overtimeMinutes = 90;
          nightShiftMinutes = 30;
        } else if (code === 'EMP011' && dateStr === '2026-10-14') {
          // Chấm công bằng GPS trên điện thoại
          method = ATTENDANCE_METHODS.GPS;
        } else if (code === 'EMP012' && dateStr === '2026-10-14') {
          // Chấm công bằng Dynamic QR Kiosk
          method = ATTENDANCE_METHODS.QR;
        }

        const checkInTime = new Date(`${dateStr}T${String(checkInH).padStart(2, '0')}:${String(checkInM).padStart(2, '0')}:00+07:00`);
        const checkOutTime = new Date(`${dateStr}T${String(checkOutH).padStart(2, '0')}:${String(checkOutM).padStart(2, '0')}:00+07:00`);
        const workDurationMinutes = Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000);

        await AttendanceLog.findOneAndUpdate(
          { companyId: company._id, userId: user._id, date: dateStr },
          {
            $set: {
              checkInTime,
              checkOutTime,
              method,
              status: ATTENDANCE_STATUS.VALID,
              deviceId: method === ATTENDANCE_METHODS.FACE ? 'kiosk_01' : null,
              location: method === ATTENDANCE_METHODS.GPS ? { latitude: 21.0169, longitude: 105.7839, accuracy: 12, distanceMeters: 15 } : null,
              workDurationMinutes,
              overtimeMinutes,
              nightShiftMinutes,
              isLate,
              isEarlyLeave,
            },
          },
          { upsert: true }
        );
        attendanceLogsCount++;
      }
    }
    console.log(`[Seed] Đã nạp ${attendanceLogsCount} bản ghi chấm công mẫu.`);

    // =========================================================================
    // 5. ĐƠN TỪ DUYỆT 2 CẤP (LEAVE REQUESTS)
    // =========================================================================
    console.log('[Seed 5/6] Khởi tạo đơn từ mẫu chuẩn luồng duyệt 2 cấp (Manager -> HR)...');
    const uEmp9 = createdUserMap.get('EMP009'); // Dev IT
    const uEmp10 = createdUserMap.get('EMP010'); // Dev IT
    const uEmp11 = createdUserMap.get('EMP011'); // Dev IT
    const uEmp21 = createdUserMap.get('EMP021'); // Sales
    const uEmp22 = createdUserMap.get('EMP022'); // Sales
    const uEmp32 = createdUserMap.get('EMP032'); // Ops
    const uEmp41 = createdUserMap.get('EMP041'); // Fin

    const sampleRequests = [
      {
        companyId: company._id,
        userId: uEmp9._id,
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: new Date('2026-10-20'),
        endDate: new Date('2026-10-21'),
        durationDays: 2,
        reason: 'Nghỉ giải quyết việc gia đình cá nhân',
        status: APPROVAL_STATUS.HR_APPROVED,
        managerApproval: {
          approverId: itMgr._id,
          decision: APPROVAL_STATUS.MANAGER_APPROVED,
          comment: 'Đồng ý phân công lại task trong sprint',
          decidedAt: new Date('2026-10-14T09:30:00+07:00'),
        },
        hrApproval: {
          approverId: hrMgr._id,
          decision: APPROVAL_STATUS.HR_APPROVED,
          comment: 'Đủ điều kiện phép năm, duyệt',
          decidedAt: new Date('2026-10-14T11:00:00+07:00'),
        },
      },
      {
        companyId: company._id,
        userId: uEmp10._id,
        type: LEAVE_REQUEST_TYPES.SICK,
        startDate: new Date('2026-10-12'),
        endDate: new Date('2026-10-12'),
        durationDays: 1,
        reason: 'Sốt xuất huyết khám tại Bệnh viện Bạch Mai',
        status: APPROVAL_STATUS.HR_APPROVED,
        managerApproval: {
          approverId: itMgr._id,
          decision: APPROVAL_STATUS.MANAGER_APPROVED,
          comment: 'Nhất trí, chúc bạn mau khỏe',
          decidedAt: new Date('2026-10-12T08:00:00+07:00'),
        },
        hrApproval: {
          approverId: hrMgr._id,
          decision: APPROVAL_STATUS.HR_APPROVED,
          comment: 'Đã nhận giấy tờ hưởng BHXH nghỉ ốm',
          decidedAt: new Date('2026-10-12T10:15:00+07:00'),
        },
      },
      {
        companyId: company._id,
        userId: uEmp11._id,
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: new Date('2026-10-26'),
        endDate: new Date('2026-10-28'),
        durationDays: 3,
        reason: 'Về quê đám cưới em trai',
        status: APPROVAL_STATUS.MANAGER_APPROVED, // Chờ HR duyệt
        managerApproval: {
          approverId: itMgr._id,
          decision: APPROVAL_STATUS.MANAGER_APPROVED,
          comment: 'Đã bàn giao tài liệu kỹ thuật',
          decidedAt: new Date('2026-10-14T15:00:00+07:00'),
        },
      },
      {
        companyId: company._id,
        userId: uEmp21._id,
        type: LEAVE_REQUEST_TYPES.OT,
        startDate: new Date('2026-10-16'),
        endDate: new Date('2026-10-16'),
        durationDays: 0,
        otHoursRequested: 3,
        reason: 'Tăng ca chốt hợp đồng dự án với đối tác lớn',
        status: APPROVAL_STATUS.PENDING, // Chờ Manager duyệt
      },
      {
        companyId: company._id,
        userId: uEmp22._id,
        type: LEAVE_REQUEST_TYPES.WFH,
        startDate: new Date('2026-10-19'),
        endDate: new Date('2026-10-19'),
        durationDays: 1,
        reason: 'Làm việc từ xa để tiếp thợ sửa điện tại nhà',
        status: APPROVAL_STATUS.PENDING,
      },
      {
        companyId: company._id,
        userId: uEmp32._id,
        type: LEAVE_REQUEST_TYPES.FORGOT_CHECKIN,
        startDate: new Date('2026-10-09'),
        endDate: new Date('2026-10-09'),
        durationDays: 0,
        reason: 'Quên chấm công lúc về do vội hỗ trợ sự cố khách hàng',
        status: APPROVAL_STATUS.HR_APPROVED,
        managerApproval: {
          approverId: opsMgr._id,
          decision: APPROVAL_STATUS.MANAGER_APPROVED,
          comment: 'Xác nhận nhân viên có làm việc đến 18h30',
          decidedAt: new Date('2026-10-10T08:30:00+07:00'),
        },
        hrApproval: {
          approverId: hrMgr._id,
          decision: APPROVAL_STATUS.HR_APPROVED,
          comment: 'Đã ghi nhận điều chỉnh công hợp lệ',
          decidedAt: new Date('2026-10-10T09:00:00+07:00'),
        },
      },
      {
        companyId: company._id,
        userId: uEmp41._id,
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: new Date('2026-10-15'),
        endDate: new Date('2026-10-15'),
        durationDays: 1,
        reason: 'Việc đột xuất không báo trước',
        status: APPROVAL_STATUS.REJECTED,
        managerApproval: {
          approverId: finMgr._id,
          decision: APPROVAL_STATUS.REJECTED,
          comment: 'Trùng lịch kiểm toán quý 3, không giải quyết nghỉ',
          decidedAt: new Date('2026-10-14T16:00:00+07:00'),
        },
      },
    ];

    for (const req of sampleRequests) {
      await LeaveRequest.findOneAndUpdate(
        { companyId: req.companyId, userId: req.userId, startDate: req.startDate, type: req.type },
        { $set: req },
        { upsert: true }
      );
    }
    console.log(`[Seed] Đã nạp ${sampleRequests.length} đơn từ mẫu đa dạng trạng thái.`);

    // =========================================================================
    // 6. THÔNG BÁO VÀ AUDIT LOGS (NOTIFICATIONS & AUDIT LOGS)
    // =========================================================================
    console.log('[Seed 6/6] Khởi tạo thông báo và nhật ký kiểm toán hệ thống...');
    await Notification.create([
      {
        companyId: company._id,
        userId: uEmp9._id,
        title: 'Đơn xin nghỉ phép đã được phê duyệt',
        message: 'Đơn nghỉ phép ngày 20/10 - 21/10/2026 của bạn đã được HR phê duyệt thành công.',
        type: 'LEAVE_REQUEST',
        isRead: false,
      },
      {
        companyId: company._id,
        userId: hrMgr._id,
        title: 'Yêu cầu duyệt đơn nghỉ phép mới',
        message: 'Nhân viên Trịnh Quốc Bảo (EMP011) vừa được Quản lý IT duyệt đơn nghỉ phép 3 ngày, đang chờ HR xử lý.',
        type: 'LEAVE_REQUEST',
        isRead: false,
      },
    ]);

    await AuditLog.create([
      {
        companyId: company._id,
        userId: ceo._id,
        action: AUDIT_ACTIONS.LOGIN,
        targetResource: 'AUTH',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PeopleInsight-Seed',
        details: { description: 'Hệ thống khởi tạo dữ liệu mẫu thành công.' },
      },
      {
        companyId: company._id,
        userId: hrMgr._id,
        action: AUDIT_ACTIONS.UPDATE_SALARY_CONFIG,
        targetResource: 'COMPANY_SETTINGS',
        ipAddress: '127.0.0.1',
        details: { description: 'Cập nhật chính sách thuế TNCN mới và trần bảo hiểm năm 2026.' },
      },
    ]);

    console.log('\n=============================================================');
    console.log('🎉 [SEED HOÀN TẤT THÀNH CÔNG]');
    console.log('-------------------------------------------------------------');
    console.log(`- Công ty:        ${company.name} (${company.code})`);
    console.log(`- Phòng ban:      ${departmentMap.size} phòng ban (BOD, IT, HR, FIN, SALES, OPS)`);
    console.log(`- Nhân sự:        ${createdUserMap.size}/50 nhân viên đã tạo`);
    console.log('  * 1 CEO:         ceo@peopleinsight.vn');
    console.log('  * 2 HR Managers: hr.huong@peopleinsight.vn, hr.nam@peopleinsight.vn');
    console.log('  * 5 Managers:    mgr.it, mgr.fin, mgr.sales, mgr.ops, mgr.ta');
    console.log('  * 42 Employees:  EMP009 -> EMP050');
    console.log('- Mật khẩu chung: Admin@123456');
    console.log(`- Chấm công mẫu:  ${attendanceLogsCount} bản ghi (có OT, đi muộn, ca đêm)`);
    console.log(`- Đơn từ mẫu:     ${sampleRequests.length} đơn luồng duyệt 2 cấp`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ [Seed Thất bại] Lỗi: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
