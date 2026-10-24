import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, AUDIT_ACTIONS } from '../../src/config/constants.js';
import { Company, User, Payroll, AuditLog, Notification } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Phân hệ Tính Lương Tự Động (Payroll Engine 2026) — Workflow, Khóa Kỳ & IDOR Guard', () => {
  let app;
  let company;
  let ceoUser, hrUser, managerUser, employeeUser1, employeeUser2;
  let ceoToken, hrToken, managerToken, employeeToken1, employeeToken2;

  const TS = Date.now();

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        fullName: user.fullName,
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

    // 1. Tạo Company test với đầy đủ 2 mốc chính sách năm 2026
    company = await Company.create({
      name: `Công Ty Test Payroll Workflow ${TS}`,
      code: `COMP_PAYROLL_${TS}`,
      settings: {
        region: 'I',
        // 2 bản ghi chính sách trước và sau 01/07/2026
        taxPolicies: [
          {
            effectiveFrom: '2026-01-01',
            effectiveTo: '2026-06-30',
            personalDeduction: 15500000,
            dependentDeduction: 6200000,
            mealAllowanceExemptCap: 730000,
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
            mealAllowanceExemptCap: 1200000,
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
            capBhxhBhyt: 46800000,
            capBhtn: 'LOOKUP_MIN_WAGE',
          },
          {
            effectiveFrom: '2026-07-01',
            effectiveTo: null,
            employeeRate: 0.105,
            employerRate: 0.215,
            capBhxhBhyt: 50600000,
            capBhtn: 'LOOKUP_MIN_WAGE',
          },
        ],
        minWageByRegion: [
          {
            effectiveFrom: '2026-01-01',
            effectiveTo: null,
            wages: { I: 5310000, II: 4710000, III: 4120000, IV: 3670000 },
          },
        ],
      },
    });

    // 2. Tạo các Users với salaryConfig riêng biệt
    await tenantStore.run({ companyId: company._id.toString() }, async () => {
      ceoUser = await User.create({
        companyId: company._id,
        employeeCode: `CEO_${TS}`,
        fullName: 'Nguyễn Văn Tổng Giám Đốc',
        email: `ceo_${TS}@payrolltest.vn`,
        passwordHash: 'secret_hash',
        role: ROLES.CEO,
        salaryConfig: { baseSalary: 80000000, mealAllowance: 730000, dependentsCount: 2 },
      });

      hrUser = await User.create({
        companyId: company._id,
        employeeCode: `HR_${TS}`,
        fullName: 'Trần Thị Trưởng Phòng HR',
        email: `hr_${TS}@payrolltest.vn`,
        passwordHash: 'secret_hash',
        role: ROLES.HR_MANAGER,
        salaryConfig: { baseSalary: 35000000, mealAllowance: 730000, dependentsCount: 1 },
      });

      managerUser = await User.create({
        companyId: company._id,
        employeeCode: `MGR_${TS}`,
        fullName: 'Lê Hoàng Trưởng Phòng Kỹ Thuật',
        email: `mgr_${TS}@payrolltest.vn`,
        passwordHash: 'secret_hash',
        role: ROLES.MANAGER,
        salaryConfig: { baseSalary: 45000000, mealAllowance: 730000, dependentsCount: 0 },
      });

      employeeUser1 = await User.create({
        companyId: company._id,
        employeeCode: `EMP1_${TS}`,
        fullName: 'Phạm Minh Kỹ Sư Phần Mềm',
        email: `emp1_${TS}@payrolltest.vn`,
        passwordHash: 'secret_hash',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 25000000, mealAllowance: 730000, dependentsCount: 0 },
      });

      employeeUser2 = await User.create({
        companyId: company._id,
        employeeCode: `EMP2_${TS}`,
        fullName: 'Vũ Thị Kế Toán Viên',
        email: `emp2_${TS}@payrolltest.vn`,
        passwordHash: 'secret_hash',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 18000000, mealAllowance: 730000, dependentsCount: 1 },
      });
    });

    ceoToken = generateToken(ceoUser);
    hrToken = generateToken(hrUser);
    managerToken = generateToken(managerUser);
    employeeToken1 = generateToken(employeeUser1);
    employeeToken2 = generateToken(employeeUser2);
  });

  afterAll(async () => {
    await tenantStore.run({ companyId: company._id.toString() }, async () => {
      await Payroll.deleteMany({ companyId: company._id });
      await User.deleteMany({ companyId: company._id });
      await AuditLog.deleteMany({ companyId: company._id });
      await Notification.deleteMany({ companyId: company._id });
    });
    await Company.deleteOne({ _id: company._id });
  });

  describe('1. Chạy Tính Lương Toàn Doanh Nghiệp (POST /api/payrolls/calculate)', () => {
    it('1.1 Từ chối Employee hoặc Manager không có quyền tính lương (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/payrolls/calculate')
        .set('Authorization', `Bearer ${employeeToken1}`)
        .send({ period: '2026-05' });

      expect(res.status).toBe(403);

      const resMgr = await request(app)
        .post('/api/payrolls/calculate')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ period: '2026-05' });

      expect(resMgr.status).toBe(403);
    });

    it('1.2 HR Manager chạy tính lương thành công cho kỳ Giai đoạn 1 (2026-05: trần BHXH 46.8M, ăn ca 730k)', async () => {
      const res = await request(app)
        .post('/api/payrolls/calculate')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ period: '2026-05' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEmployees).toBe(5);
      expect(res.body.data.totalGross).toBeGreaterThan(0);
      expect(res.body.data.totalNet).toBeGreaterThan(0);

      // Kiểm tra CEO có lương 80M vượt trần BHXH 46.8M
      const ceoPayroll = res.body.data.payrolls.find((p) => p.userId.toString() === ceoUser._id.toString());
      expect(ceoPayroll).toBeDefined();
      expect(ceoPayroll.policySnapshot.capBhxhBhyt).toBe(46800000);
      expect(ceoPayroll.policySnapshot.mealAllowanceCap).toBe(730000);
      // BHXH tối đa: 46.8M * 8% = 3.744.000đ
      expect(ceoPayroll.bhxhEmployee).toBe(3744000);
    });

    it('1.3 CEO chạy tính lương thành công cho kỳ Giai đoạn 2 (2026-07: trần BHXH 50.6M, ăn ca 1.2M)', async () => {
      const res = await request(app)
        .post('/api/payrolls/calculate')
        .set('Authorization', `Bearer ${ceoToken}`)
        .send({ period: '2026-07' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const ceoPayroll = res.body.data.payrolls.find((p) => p.userId.toString() === ceoUser._id.toString());
      expect(ceoPayroll.policySnapshot.capBhxhBhyt).toBe(50600000);
      expect(ceoPayroll.policySnapshot.mealAllowanceCap).toBe(1200000);
      // BHXH tối đa kỳ mới: 50.6M * 8% = 4.048.000đ
      expect(ceoPayroll.bhxhEmployee).toBe(4048000);
    });
  });

  describe('2. Khóa Kỳ Lương Nguyên Tử (POST /api/payrolls/lock)', () => {
    it('2.1 HR Manager khóa kỳ lương 2026-05 thành công, đặt periodLockedAt và gửi thông báo', async () => {
      const res = await request(app)
        .post('/api/payrolls/lock')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ period: '2026-05' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedPayrollsCount).toBe(5);
      expect(res.body.data.lockedAt).toBeDefined();

      // Kiểm tra trong DB toàn bộ bảng lương kỳ 2026-05 đã có periodLockedAt
      await tenantStore.run({ companyId: company._id.toString() }, async () => {
        const unlocked = await Payroll.countDocuments({
          companyId: company._id,
          period: '2026-05',
          periodLockedAt: null,
        });
        expect(unlocked).toBe(0);

        // Kiểm tra AuditLog được ghi lại
        const audit = await AuditLog.findOne({
          companyId: company._id,
          action: AUDIT_ACTIONS.LOCK_PAYROLL,
          'details.period': '2026-05',
        });
        expect(audit).toBeDefined();
      });
    });

    it('2.2 Chặn tính lại kỳ lương đã khóa (HTTP 409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/payrolls/calculate')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ period: '2026-05' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('đã được khóa');
    });

    it('2.3 Chặn khóa lại kỳ lương đã được khóa (HTTP 409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/payrolls/lock')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ period: '2026-05' });

      expect(res.status).toBe(409);
    });
  });

  describe('3. Phân Quyền Tra Cứu Phiếu Lương & Bảo Vệ IDOR', () => {
    it('3.1 Nhân viên xem phiếu lương của chính mình thành công (/api/payrolls/me/:period)', async () => {
      const res = await request(app)
        .get('/api/payrolls/me/2026-05')
        .set('Authorization', `Bearer ${employeeToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId._id.toString()).toBe(employeeUser1._id.toString());
      expect(res.body.data.netSalary).toBeGreaterThan(0);
    });

    it('3.2 Nhân viên cố tình xem phiếu lương người khác qua IDOR bị chặn đứng (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/payrolls/user/${employeeUser2._id}/2026-05`)
        .set('Authorization', `Bearer ${employeeToken1}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('FORBIDDEN_IDOR');
    });

    it('3.3 QUY TẮC BẤT BIẾN: Quản lý (Manager) TUYỆT ĐỐI KHÔNG ĐƯỢC xem lương của nhân viên (HTTP 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/payrolls/user/${employeeUser1._id}/2026-05`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('FORBIDDEN_POLICY');
    });

    it('3.4 HR Manager xem phiếu lương nhân viên thành công và hệ thống bắt buộc ghi AuditLog', async () => {
      const res = await request(app)
        .get(`/api/payrolls/user/${employeeUser1._id}/2026-05`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId._id.toString()).toBe(employeeUser1._id.toString());

      // Xác minh AuditLog VIEW_SALARY_OTHER đã được tạo
      await tenantStore.run({ companyId: company._id.toString() }, async () => {
        const audit = await AuditLog.findOne({
          companyId: company._id,
          action: AUDIT_ACTIONS.VIEW_SALARY_OTHER,
          userId: hrUser._id,
          targetUserId: employeeUser1._id,
        });
        expect(audit).toBeDefined();
        expect(audit.details.period).toBe('2026-05');
      });
    });

    it('3.5 HR Manager truy cập bảng lương tổng hợp toàn công ty (/api/payrolls/period/:period)', async () => {
      const res = await request(app)
        .get('/api/payrolls/period/2026-05')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(5);
      expect(res.body.summary.totalGross).toBeGreaterThan(0);
      expect(res.body.summary.isLocked).toBe(true);
    });

    it('3.6 Quản lý và Nhân viên bị cấm truy cập bảng lương tổng hợp toàn công ty (HTTP 403)', async () => {
      const resMgr = await request(app)
        .get('/api/payrolls/period/2026-05')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(resMgr.status).toBe(403);

      const resEmp = await request(app)
        .get('/api/payrolls/period/2026-05')
        .set('Authorization', `Bearer ${employeeToken1}`);
      expect(resEmp.status).toBe(403);
    });
  });
});
