/**
 * BỘ KIỂM THỬ BẢO MẬT CHUYÊN SÂU (SECURITY AUDIT & PENETRATION TEST)
 * Kiểm thử toàn diện: Chống Rò rỉ Projection API, Chống IDOR, Cách ly Multi-tenant Fail-Closed,
 * Chống NoSQL Injection và Mass Assignment.
 * Tuân thủ Hiến pháp v6.1 FINAL FREEZE
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES } from '../../src/config/constants.js';
import { Company, User, FaceTemplate, Department, LeaveRequest, AttendanceLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('BẢO MẬT HỆ THỐNG: Projection API, IDOR, Multi-tenant Fail-Closed & NoSQL Injection', () => {
  let app;
  let companyA, companyB;
  let ceoA, hrA, managerA, employeeA1, employeeA2;
  let ceoB, employeeB;
  let tokenCeoA, tokenHrA, tokenManagerA, tokenEmpA1, tokenEmpA2, tokenCeoB, tokenEmpB;
  let leaveRequestA1;

  const TS = Date.now();

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        fullName: user.fullName,
        email: user.email,
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

    // 1. Tạo 2 công ty độc lập (Tenant A và Tenant B)
    companyA = await Company.create({
      name: `Tập đoàn An Ninh A ${TS}`,
      code: `SEC_A_${TS}`,
      settings: { region: 'I' },
    });

    companyB = await Company.create({
      name: `Tập đoàn An Ninh B ${TS}`,
      code: `SEC_B_${TS}`,
      settings: { region: 'I' },
    });

    // 2. Tạo người dùng Tenant A
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      ceoA = await User.create({
        companyId: companyA._id,
        employeeCode: `NV${TS.toString().slice(-4)}1`,
        fullName: 'Tổng Giám Đốc A',
        email: `ceo_a_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.CEO,
        salaryConfig: { baseSalary: 80000000 },
      });

      hrA = await User.create({
        companyId: companyA._id,
        employeeCode: `NV${TS.toString().slice(-4)}2`,
        fullName: 'Trưởng Phòng Nhân Sự A',
        email: `hr_a_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.HR_MANAGER,
        salaryConfig: { baseSalary: 35000000 },
      });

      managerA = await User.create({
        companyId: companyA._id,
        employeeCode: `NV${TS.toString().slice(-4)}3`,
        fullName: 'Quản Lý Kỹ Thuật A',
        email: `manager_a_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.MANAGER,
        salaryConfig: { baseSalary: 28000000 },
      });

      employeeA1 = await User.create({
        companyId: companyA._id,
        employeeCode: `NV${TS.toString().slice(-4)}4`,
        fullName: 'Kỹ Sư Phần Mềm A1',
        email: `emp_a1_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 20000000 },
        refreshTokens: [{ token: 'sensitive_refresh_token_a1', family: 'family_123', expiresAt: new Date(Date.now() + 86400000) }],
      });

      employeeA2 = await User.create({
        companyId: companyA._id,
        employeeCode: `NV${TS.toString().slice(-4)}5`,
        fullName: 'Nhân Viên Kiểm Thử A2',
        email: `emp_a2_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 15000000 },
      });

      // Tạo mẫu đơn nghỉ phép cho Employee A1
      leaveRequestA1 = await LeaveRequest.create({
        companyId: companyA._id,
        userId: employeeA1._id,
        type: 'ANNUAL',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-02'),
        daysCount: 2,
        reason: 'Nghỉ cá nhân',
        status: 'PENDING',
      });

      // Tạo mẫu FaceTemplate sinh trắc học đã mã hóa cho Employee A1
      const sampleVector = new Array(128).fill(0.05);
      await FaceTemplate.create({
        companyId: companyA._id,
        userId: employeeA1._id,
        descriptors: [sampleVector],
        modelName: 'face-api-ssd-mobilenetv1',
        modelVersion: '1.0',
        consentPolicyVersion: 'v2026.1',
      });
    });

    // 3. Tạo người dùng Tenant B
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      ceoB = await User.create({
        companyId: companyB._id,
        employeeCode: `NV${TS.toString().slice(-4)}6`,
        fullName: 'Tổng Giám Đốc B',
        email: `ceo_b_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.CEO,
        salaryConfig: { baseSalary: 90000000 },
      });

      employeeB = await User.create({
        companyId: companyB._id,
        employeeCode: `NV${TS.toString().slice(-4)}7`,
        fullName: 'Nhân Viên Công Ty B',
        email: `emp_b_${TS}@sec.vn`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role: ROLES.EMPLOYEE,
        salaryConfig: { baseSalary: 22000000 },
      });
    });

    // Sinh tokens
    tokenCeoA = generateToken(ceoA);
    tokenHrA = generateToken(hrA);
    tokenManagerA = generateToken(managerA);
    tokenEmpA1 = generateToken(employeeA1);
    tokenEmpA2 = generateToken(employeeA2);
    tokenCeoB = generateToken(ceoB);
    tokenEmpB = generateToken(employeeB);
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu thử nghiệm
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      await User.deleteMany({ companyId: companyA._id });
      await LeaveRequest.deleteMany({ companyId: companyA._id });
      await FaceTemplate.deleteMany({ companyId: companyA._id });
    });
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      await User.deleteMany({ companyId: companyB._id });
    });
  });

  // =========================================================================
  // PHẦN 1: KIỂM THỬ PROJECTION API (CHỐNG RÒ RỈ DỮ LIỆU NHẠY CẢM)
  // =========================================================================
  describe('1. Kiểm thử Projection API & Chống Rò Rỉ Dữ Liệu Nhạy Cảm', () => {
    test('1.1. GET /api/users: 100% hồ sơ không chứa passwordHash, refreshTokens và salaryConfig', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokenHrA}`);

      expect(res.status).toBe(200);
      const users = res.body.users || res.body.data?.users || res.body.data || [];
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Quét từng bản ghi kiểm tra rò rỉ
      for (const u of users) {
        expect(u.passwordHash).toBeUndefined();
        expect(u.refreshTokens).toBeUndefined();
        expect(u.salaryConfig).toBeUndefined();
      }
    });

    test('1.2. GET /api/auth/me: Không được chứa passwordHash hoặc refreshTokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenEmpA1}`);

      expect(res.status).toBe(200);
      const user = res.body.data || res.body;
      expect(user.passwordHash).toBeUndefined();
      expect(user.refreshTokens).toBeUndefined();
    });

    test('1.3. GET /api/users/:id: Nhân viên thường xem hồ sơ đồng nghiệp bị chặn 403 (Quyền riêng tư BVDLCN)', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}`)
        .set('Authorization', `Bearer ${tokenEmpA2}`);

      expect(res.status).toBe(403);
    });

    test('1.4. Trưởng phòng Nhân sự (HR_MANAGER) xem hồ sơ chi tiết không bị lộ salaryConfig', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}`)
        .set('Authorization', `Bearer ${tokenHrA}`);

      expect(res.status).toBe(200);
      const user = res.body.data;
      expect(user.salaryConfig).toBeUndefined();
      expect(user.passwordHash).toBeUndefined();
      expect(user.refreshTokens).toBeUndefined();
    });
  });

  // =========================================================================
  // PHẦN 2: BẢO VỆ IDOR & KIỂM SOÁT PHÂN QUYỀN RBAC (FAIL-CLOSED)
  // =========================================================================
  describe('2. Bảo vệ Chống IDOR & Kiểm Soát Phân Quyền RBAC', () => {
    test('2.1. Quản lý (MANAGER) tuyệt đối không được xem lương nhân viên (GET /api/users/:id/salary -> 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}/salary`)
        .set('Authorization', `Bearer ${tokenManagerA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('2.2. Nhân viên thường không được xem lương đồng nghiệp (GET /api/users/:id/salary -> 403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}/salary`)
        .set('Authorization', `Bearer ${tokenEmpA2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('2.3. Nhân viên tự xem cấu hình lương của chính mình được phép (200 OK)', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}/salary`)
        .set('Authorization', `Bearer ${tokenEmpA1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.baseSalary).toBe(20000000);
    });

    test('2.4. Nhân viên thường cố tình sửa lương bị chặn 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/users/${employeeA1._id}/salary`)
        .set('Authorization', `Bearer ${tokenEmpA1}`)
        .send({ baseSalary: 50000000 });

      expect(res.status).toBe(403);
    });

    test('2.5. Nhân viên thường cố tình nâng quyền (PATCH /api/users/:id/role) bị chặn 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/users/${employeeA1._id}/role`)
        .set('Authorization', `Bearer ${tokenEmpA1}`)
        .send({ role: ROLES.CEO });

      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // PHẦN 3: CÁCH LY MULTI-TENANT FAIL-CLOSED (CHỐNG TRUY CẬP CHÉO CÔNG TY)
  // =========================================================================
  describe('3. Cách ly Multi-tenant Fail-Closed (Anti-Cross-Tenant)', () => {
    test('3.1. User Tenant B cố tình tra cứu hồ sơ User Tenant A -> 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}`)
        .set('Authorization', `Bearer ${tokenEmpB}`);

      // Fail-closed tenantPlugin lọc theo companyId của token -> không tìm thấy tài liệu của cty khác
      expect([404, 403]).toContain(res.status);
    });

    test('3.2. CEO Tenant B cố tình xem lương nhân viên Tenant A -> 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeA1._id}/salary`)
        .set('Authorization', `Bearer ${tokenCeoB}`);

      expect([404, 403]).toContain(res.status);
    });

    test('3.3. User Tenant B cố tình duyệt đơn của Tenant A -> 404 Not Found', async () => {
      const res = await request(app)
        .patch(`/api/leave-requests/${leaveRequestA1._id}/approve`)
        .set('Authorization', `Bearer ${tokenEmpB}`)
        .send({ comment: 'Duyệt chéo tenant bất hợp pháp' });

      expect([404, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // PHẦN 4: CHỐNG NOSQL INJECTION & MASS ASSIGNMENT
  // =========================================================================
  describe('4. Chống Tấn Công NoSQL Injection & Mass Assignment', () => {
    test('4.1. Chặn NoSQL Injection qua body đăng nhập ({"email": {"$gt": ""}})', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: 'Password123!',
        });

      // Zod validation bắt buộc email phải là string hợp lệ -> từ chối 400 Bad Request
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('4.2. Chặn Mass Assignment khi cập nhật thông tin nhân viên qua PATCH /api/users/:id', async () => {
      const res = await request(app)
        .patch(`/api/users/${employeeA1._id}`)
        .set('Authorization', `Bearer ${tokenHrA}`)
        .send({
          fullName: 'Kỹ Sư Phần Mềm A1 Cập Nhật',
          role: ROLES.CEO, // Cố tình inject trường role trái phép
          companyId: companyB._id.toString(), // Cố tình inject companyId
        });

      // Zod .strict() của updateUserSchema chặn các trường ngoài allowlist với 400 Bad Request
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
