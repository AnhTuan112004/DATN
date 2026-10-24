import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { Company, User, AttendanceLog, LeaveRequest, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import {
  checkCompanyAbsentForDate,
  runAllCompaniesAbsentCheck,
} from '../../src/services/absentAttendanceService.js';
import {
  ROLES,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
  LEAVE_REQUEST_TYPES,
  APPROVAL_STATUS,
} from '../../src/config/constants.js';

describe('Job: Chốt ABSENT Lúc 23:59 & Endpoint /api/jobs/run (Tuần 2)', () => {
  let app;
  let companyA;
  let userNormalA;
  let userOnLeaveA;
  let userCheckedInA;
  let ceoUserA;
  let ceoTokenA;

  // Ngày làm việc bình thường (Thứ Năm, 22/10/2026)
  const WORKDAY_STR = '2026-10-22';
  // Ngày Chủ Nhật (25/10/2026)
  const SUNDAY_STR = '2026-10-25';
  // Ngày Lễ (02/09/2026 - Quốc Khánh)
  const HOLIDAY_STR = '2026-09-02';

  const generateAuthToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        employeeCode: user.employeeCode,
      },
      config.jwt.accessSecret,
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    app = createApp();

    // 1. Tạo Công ty với danh sách ngày lễ
    companyA = await Company.create({
      name: 'Công ty Cron ABSENT Test A',
      code: `COMP_ABSENT_${Date.now()}`,
      taxCode: `TAX_ABSENT_${Date.now()}`,
      settings: {
        holidays: [
          {
            date: HOLIDAY_STR,
            name: 'Quốc Khánh 2/9',
          },
        ],
      },
    });

    const companyId = companyA._id;

    // 2. Tạo users trong tenantStore
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      // CEO
      ceoUserA = await User.create({
        companyId,
        email: `ceo_absent_${Date.now()}@test.com`,
        fullName: 'Nguyễn Văn CEO ABSENT',
        employeeCode: `CEO_ABS_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.CEO,
        isActive: true,
      });

      // Nhân viên 1: Bình thường, không đi làm, không có đơn phép
      userNormalA = await User.create({
        companyId,
        email: `emp_normal_${Date.now()}@test.com`,
        fullName: 'Trần Văn Vắng Mặt',
        employeeCode: `EMP_ABS1_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });

      // Nhân viên 2: Có đơn nghỉ phép đã được duyệt
      userOnLeaveA = await User.create({
        companyId,
        email: `emp_leave_${Date.now()}@test.com`,
        fullName: 'Lê Thị Nghỉ Phép',
        employeeCode: `EMP_ABS2_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });

      // Nhân viên 3: Đã đi làm và check-in trong ngày
      userCheckedInA = await User.create({
        companyId,
        email: `emp_checked_${Date.now()}@test.com`,
        fullName: 'Phạm Văn Chăm Chỉ',
        employeeCode: `EMP_ABS3_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });

      // Tạo đơn nghỉ phép hợp lệ cho userOnLeaveA
      await LeaveRequest.create({
        companyId,
        userId: userOnLeaveA._id,
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: new Date('2026-10-22T00:00:00.000Z'),
        endDate: new Date('2026-10-22T23:59:59.000Z'),
        durationDays: 1,
        reason: 'Nghỉ phép thường niên có việc gia đình',
        status: APPROVAL_STATUS.HR_APPROVED,
      });

      // Tạo log điểm danh đã có cho userCheckedInA
      await AttendanceLog.create({
        companyId,
        userId: userCheckedInA._id,
        date: WORKDAY_STR,
        checkInTime: new Date(`${WORKDAY_STR}T08:20:00.000Z`),
        checkOutTime: new Date(`${WORKDAY_STR}T17:35:00.000Z`),
        method: ATTENDANCE_METHODS.GPS,
        status: ATTENDANCE_STATUS.VALID,
        isLate: false,
        workDurationMinutes: 480,
      });
    });

    ceoTokenA = generateAuthToken(ceoUserA);
  });

  afterAll(async () => {
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      await User.deleteMany({ companyId: companyA._id });
      await AttendanceLog.deleteMany({ companyId: companyA._id });
      await LeaveRequest.deleteMany({ companyId: companyA._id });
      await AuditLog.deleteMany({ companyId: companyA._id });
    });
    await Company.deleteMany({ _id: companyA._id });
  });

  test('1. Chốt ABSENT ngày làm việc thường: Nhân viên không đi làm bị đánh ABSENT, người có phép/check-in được bảo toàn', async () => {
    const result = await checkCompanyAbsentForDate(companyA._id, WORKDAY_STR);

    expect(result.isSkipped).toBe(false);
    expect(result.date).toBe(WORKDAY_STR);
    expect(result.absentCount).toBeGreaterThanOrEqual(1);

    // Kiểm tra trong CSDL
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      // 1. userNormalA phải bị đánh dấu ABSENT
      const normalLog = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: userNormalA._id,
        date: WORKDAY_STR,
      });
      expect(normalLog).not.toBeNull();
      expect(normalLog.status).toBe(ATTENDANCE_STATUS.ABSENT);
      expect(normalLog.checkInTime).toBeNull();

      // 2. userOnLeaveA không bị đánh dấu ABSENT vì có đơn duyệt
      const leaveLog = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: userOnLeaveA._id,
        date: WORKDAY_STR,
      });
      expect(leaveLog).toBeNull(); // Không có log ABSENT

      // 3. userCheckedInA vẫn giữ nguyên status VALID
      const checkedLog = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: userCheckedInA._id,
        date: WORKDAY_STR,
      });
      expect(checkedLog).not.toBeNull();
      expect(checkedLog.status).toBe(ATTENDANCE_STATUS.VALID);
      expect(checkedLog.checkInTime).not.toBeNull();
    });
  });

  test('2. TÍNH IDEMPOTENT: Chạy lại lần 2 cho cùng một ngày thì không tạo thêm log ABSENT mới', async () => {
    const result2 = await checkCompanyAbsentForDate(companyA._id, WORKDAY_STR);

    // Không tạo thêm bản ghi ABSENT mới
    expect(result2.absentCount).toBe(0);
    expect(result2.alreadyAbsentCount).toBeGreaterThanOrEqual(1);
  });

  test('3. CATCH-UP NGÀY CHỦ NHẬT (WEEKEND): Tự động bỏ qua không chốt ABSENT', async () => {
    const result = await checkCompanyAbsentForDate(companyA._id, SUNDAY_STR);

    expect(result.isSkipped).toBe(true);
    expect(result.reason).toBe('WEEKEND');
    expect(result.absentCount).toBe(0);

    // Không có bản ghi AttendanceLog nào phát sinh trong ngày Chủ Nhật
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const logs = await AttendanceLog.find({
        companyId: companyA._id,
        date: SUNDAY_STR,
      });
      expect(logs.length).toBe(0);
    });
  });

  test('4. CATCH-UP NGÀY LỄ (HOLIDAY): Tự động bỏ qua ngày lễ trong cấu hình công ty', async () => {
    const result = await checkCompanyAbsentForDate(companyA._id, HOLIDAY_STR);

    expect(result.isSkipped).toBe(true);
    expect(result.reason).toBe('HOLIDAY');
    expect(result.holidayName).toBe('Quốc Khánh 2/9');
    expect(result.absentCount).toBe(0);
  });

  test('5. ENDPOINT /api/jobs/run - BẢO MẬT: Từ chối 401 nếu thiếu hoặc sai Secret Token', async () => {
    // Không truyền token bí mật
    const res1 = await request(app)
      .post('/api/jobs/run')
      .send({ jobType: 'absent_check' });

    expect(res1.status).toBe(401);
    expect(res1.body.message).toMatch(/Yêu cầu bị từ chối/i);

    // Truyền sai secret
    const res2 = await request(app)
      .post('/api/jobs/run')
      .set('x-cron-secret', 'wrong_secret_12345')
      .send({ jobType: 'absent_check' });

    expect(res2.status).toBe(401);
  });

  test('6. ENDPOINT /api/jobs/run - THÀNH CÔNG: Chạy với Header x-cron-secret của cron-job.org', async () => {
    const validSecret = config.security.cronJobApiKey;

    const res = await request(app)
      .post('/api/jobs/run')
      .set('x-cron-secret', validSecret)
      .send({
        jobType: 'absent_check',
        date: '2026-10-21', // Catch-up ngày hôm qua
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.triggerSource).toBe('CRON_SECRET');
    expect(res.body.data.date).toBe('2026-10-21');
    expect(res.body.data.totalProcessedCompanies).toBeGreaterThanOrEqual(1);
  });

  test('7. ENDPOINT /api/jobs/run - GET REQUEST (cho cron-job.org miễn phí) có query secret', async () => {
    const validSecret = config.security.cronJobApiKey;

    const res = await request(app)
      .get(`/api/jobs/run?secret=${validSecret}&jobType=absent_check&date=2026-10-20`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.date).toBe('2026-10-20');
  });

  test('8. ENDPOINT /api/jobs/run - CEO/HR Manager gọi bằng JWT Token thành công', async () => {
    const res = await request(app)
      .post('/api/jobs/run')
      .set('Authorization', `Bearer ${ceoTokenA}`)
      .send({
        jobType: 'absent_check',
        date: WORKDAY_STR,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.triggerSource).toBe('USER_ROLE');
  });
});
