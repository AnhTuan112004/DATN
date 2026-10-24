import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, LEAVE_REQUEST_TYPES, APPROVAL_STATUS, ATTENDANCE_METHODS, ATTENDANCE_STATUS } from '../../src/config/constants.js';
import { Company, User, Department, LeaveRequest, AttendanceLog, AuditLog, Notification } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Phân hệ Quản lý Đơn từ (leaveRequests) & Phê duyệt 2 Cấp Cố định', () => {
  let app;
  let companyId;
  let departmentId;
  let ceoUser, hrUser, managerUser, employeeUser;
  let ceoToken, hrToken, managerToken, employeeToken;

  const TS = Date.now();

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

    // 1. Tạo Company test
    const company = await Company.create({
      name: `Công Ty Test Leave Workflow ${TS}`,
      code: `COMP_LEAVE_${TS}`,
      settings: {
        region: 'I',
        shifts: [
          {
            shiftCode: 'HC',
            startTime: '08:30',
            endTime: '17:30',
            gracePeriodMinutes: 15,
          },
        ],
      },
    });
    companyId = company._id;

    // 2. Tạo Department test & Users trong tenant context
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      const dept = await Department.create({
        companyId,
        name: 'Phòng Kỹ Thuật Phần Mềm',
        code: `IT_DEPT_${TS}`,
        parentDepartmentId: null,
      });
      departmentId = dept._id;

      ceoUser = await User.create({
        companyId,
        employeeCode: `NV_CEO_${TS}`,
        fullName: 'Nguyễn Văn CEO',
        email: `ceo_${TS}@test.com`,
        passwordHash: 'hash_secret',
        role: ROLES.CEO,
      });
      ceoToken = generateAuthToken(ceoUser);

      hrUser = await User.create({
        companyId,
        employeeCode: `NV_HR_${TS}`,
        fullName: 'Trần Thị HR Manager',
        email: `hr_${TS}@test.com`,
        passwordHash: 'hash_secret',
        role: ROLES.HR_MANAGER,
      });
      hrToken = generateAuthToken(hrUser);

      managerUser = await User.create({
        companyId,
        employeeCode: `NV_MGR_${TS}`,
        fullName: 'Lê Văn Trưởng Phòng IT',
        email: `manager_${TS}@test.com`,
        passwordHash: 'hash_secret',
        role: ROLES.MANAGER,
        departmentId,
      });
      managerToken = generateAuthToken(managerUser);

      employeeUser = await User.create({
        companyId,
        employeeCode: `NV_EMP_${TS}`,
        fullName: 'Phạm Văn Lập Trình Viên',
        email: `emp_${TS}@test.com`,
        passwordHash: 'hash_secret',
        role: ROLES.EMPLOYEE,
        departmentId,
        managerId: managerUser._id,
        leaveBalance: {
          annualTotal: 12,
          annualRemaining: 12,
          annualUsed: 0,
          sickRemaining: 30,
          sickUsed: 0,
        },
      });
      employeeToken = generateAuthToken(employeeUser);
    });
  });

  afterAll(async () => {
    if (companyId) {
      await tenantStore.run({ companyId: companyId.toString() }, async () => {
        await LeaveRequest.deleteMany({ companyId });
        await AttendanceLog.deleteMany({ companyId });
        await AuditLog.deleteMany({ companyId });
        await Notification.deleteMany({ companyId });
        await Department.deleteMany({ companyId });
        await User.deleteMany({ companyId });
      });
      await Company.deleteOne({ _id: companyId });
    }
    await mongoose.connection.close();
  });

  let annualRequestId;
  let sickRequestId;
  let forgotRequestId;

  it('1. POST /api/leave-requests - Nộp đơn ANNUAL hợp lệ thành công (status: PENDING)', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: '2026-11-02T00:00:00.000Z',
        endDate: '2026-11-03T00:00:00.000Z',
        durationDays: 2,
        reason: 'Nghỉ giải quyết việc gia đình',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe(LEAVE_REQUEST_TYPES.ANNUAL);
    expect(res.body.data.status).toBe(APPROVAL_STATUS.PENDING);
    expect(res.body.data.durationDays).toBe(2);
    annualRequestId = res.body.data._id;
  });

  it('2. POST /api/leave-requests - Nộp đơn ANNUAL vượt quá số dư phép năm bị từ chối 422', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.ANNUAL,
        startDate: '2026-12-01T00:00:00.000Z',
        endDate: '2026-12-25T00:00:00.000Z',
        durationDays: 20, // Vượt quá 12 ngày phép năm
        reason: 'Xin nghỉ phép dài ngày',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Số dư phép năm không đủ');
  });

  it('3. POST /api/leave-requests - Nộp đơn SICK (Nghỉ ốm) thành công', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.SICK,
        startDate: '2026-11-05T00:00:00.000Z',
        endDate: '2026-11-05T00:00:00.000Z',
        durationDays: 1,
        reason: 'Bị sốt cảm cúm cần đi khám',
        attachmentUrl: 'https://cloudinary.com/docs/medical_cert.pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe(LEAVE_REQUEST_TYPES.SICK);
    expect(res.body.data.status).toBe(APPROVAL_STATUS.PENDING);
    sickRequestId = res.body.data._id;
  });

  it('4. POST /api/leave-requests - Nộp đơn OT (Làm thêm giờ) thành công', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.OT,
        startDate: '2026-11-06T18:00:00.000Z',
        endDate: '2026-11-06T21:00:00.000Z',
        durationDays: 0.5,
        otHoursRequested: 3,
        reason: 'Tăng ca deploy phiên bản mới',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe(LEAVE_REQUEST_TYPES.OT);
    expect(res.body.data.otHoursRequested).toBe(3);
  });

  it('5. POST /api/leave-requests - Nộp đơn WFH (Làm việc từ xa) thành công', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.WFH,
        startDate: '2026-11-09T00:00:00.000Z',
        endDate: '2026-11-09T00:00:00.000Z',
        durationDays: 1,
        reason: 'Nhà có thợ sửa chữa điện nước',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe(LEAVE_REQUEST_TYPES.WFH);
  });

  it('6. POST /api/leave-requests - Nộp đơn FORGOT_CHECKIN (Giải trình quên chấm công) thành công', async () => {
    const res = await request(app)
      .post('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: LEAVE_REQUEST_TYPES.FORGOT_CHECKIN,
        startDate: '2026-10-20T00:00:00.000Z',
        endDate: '2026-10-20T00:00:00.000Z',
        durationDays: 1,
        forgotDetails: {
          targetDate: '2026-10-20',
          checkType: 'CHECK_IN',
          requestedTime: '08:25',
        },
        reason: 'Quên mang thẻ và mạng điện thoại bị chập chờn lúc vào ca',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe(LEAVE_REQUEST_TYPES.FORGOT_CHECKIN);
    expect(res.body.data.forgotDetails.targetDate).toBe('2026-10-20');
    forgotRequestId = res.body.data._id;
  });

  it('7. POST /api/leave-requests/:id/approve-manager - Chống tự duyệt (Anti-Self-Approval) bị chặn 403', async () => {
    const res = await request(app)
      .post(`/api/leave-requests/${annualRequestId}/approve-manager`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        decision: 'APPROVE',
        comment: 'Tự duyệt đơn của chính mình',
      });

    expect(res.status).toBe(403);
  });

  it('8. POST /api/leave-requests/:id/approve-hr - Chặn duyệt Cấp 2 khi đơn chưa qua Cấp 1 (400 Bad Request)', async () => {
    const res = await request(app)
      .post(`/api/leave-requests/${annualRequestId}/approve-hr`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        decision: 'APPROVE',
        comment: 'Duyệt đốt cháy giai đoạn',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Đơn phải được Quản lý duyệt cấp 1');
  });

  it('9. POST /api/leave-requests/:id/approve-manager - Manager phê duyệt Cấp 1 thành công (status -> MANAGER_APPROVED)', async () => {
    const res = await request(app)
      .post(`/api/leave-requests/${annualRequestId}/approve-manager`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        decision: 'APPROVE',
        comment: 'Đồng ý cho nhân viên nghỉ 2 ngày',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(APPROVAL_STATUS.MANAGER_APPROVED);
    expect(res.body.data.managerApproval.decision).toBe(APPROVAL_STATUS.MANAGER_APPROVED);
    expect(res.body.data.managerApproval.comment).toBe('Đồng ý cho nhân viên nghỉ 2 ngày');
  });

  it('10. POST /api/leave-requests/:id/approve-hr - HR duyệt Cấp 2 & Trừ số dư phép năm nguyên tử thành công', async () => {
    let userBefore;
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      userBefore = await User.findById(employeeUser._id);
    });
    expect(userBefore.leaveBalance.annualRemaining).toBe(12);
    expect(userBefore.leaveBalance.annualUsed).toBe(0);

    const res = await request(app)
      .post(`/api/leave-requests/${annualRequestId}/approve-hr`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        decision: 'APPROVE',
        comment: 'HR duyệt quyết toán phép năm',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(APPROVAL_STATUS.HR_APPROVED);
    expect(res.body.data.hrApproval.decision).toBe(APPROVAL_STATUS.HR_APPROVED);

    let userAfter;
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      userAfter = await User.findById(employeeUser._id);
    });
    expect(userAfter.leaveBalance.annualRemaining).toBe(10);
    expect(userAfter.leaveBalance.annualUsed).toBe(2);
  });

  it('11. POST /api/leave-requests/:id/cancel - Hủy đơn đã duyệt HR_APPROVED & Tự động hoàn trả phép năm', async () => {
    const res = await request(app)
      .post(`/api/leave-requests/${annualRequestId}/cancel`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        cancellationReason: 'Gia đình hoãn việc, xin đi làm bình thường',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(APPROVAL_STATUS.CANCELLED);
    expect(res.body.data.cancellationReason).toContain('Gia đình hoãn việc');

    let userRefunded;
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      userRefunded = await User.findById(employeeUser._id);
    });
    expect(userRefunded.leaveBalance.annualRemaining).toBe(12);
    expect(userRefunded.leaveBalance.annualUsed).toBe(0);
  });

  it('12. FORGOT_CHECKIN đi hết luồng 2 cấp và tự động tạo log điểm danh MANUAL_ADJUSTMENT', async () => {
    const stage1 = await request(app)
      .post(`/api/leave-requests/${forgotRequestId}/approve-manager`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ decision: 'APPROVE', comment: 'Xác nhận nhân viên có mặt lúc 08:25' });
    expect(stage1.status).toBe(200);
    expect(stage1.body.data.status).toBe(APPROVAL_STATUS.MANAGER_APPROVED);

    const stage2 = await request(app)
      .post(`/api/leave-requests/${forgotRequestId}/approve-hr`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ decision: 'APPROVE', comment: 'Bổ sung công hợp lệ' });
    expect(stage2.status).toBe(200);
    expect(stage2.body.data.status).toBe(APPROVAL_STATUS.HR_APPROVED);

    let attLog;
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      attLog = await AttendanceLog.findOne({
        companyId,
        userId: employeeUser._id,
        date: '2026-10-20',
      });
    });
    expect(attLog).not.toBeNull();
    expect(attLog.method).toBe(ATTENDANCE_METHODS.MANUAL_ADJUSTMENT);
    expect(attLog.status).toBe(ATTENDANCE_STATUS.VALID);
  });

  it('13. GET /api/leave-requests - Phân quyền xem đơn (Employee chỉ xem của mình, Manager xem của mình + cấp dưới)', async () => {
    const empRes = await request(app)
      .get('/api/leave-requests')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(empRes.status).toBe(200);
    expect(empRes.body.items.length).toBeGreaterThan(0);
    const allEmpMine = empRes.body.items.every(
      (item) => item.userId._id.toString() === employeeUser._id.toString()
    );
    expect(allEmpMine).toBe(true);

    const mgrRes = await request(app)
      .get('/api/leave-requests?scope=team')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrRes.status).toBe(200);
    const hasSubordinate = mgrRes.body.items.some(
      (item) => item.userId._id.toString() === employeeUser._id.toString()
    );
    expect(hasSubordinate).toBe(true);

    const hrRes = await request(app)
      .get('/api/leave-requests')
      .set('Authorization', `Bearer ${hrToken}`);
    expect(hrRes.status).toBe(200);
    expect(hrRes.body.pagination.total).toBeGreaterThanOrEqual(4);
  });
});
