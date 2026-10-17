import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES } from '../../src/config/constants.js';
import { Company, Department, User, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Quản trị Cây Phòng Ban & CRUD Nhân sự (v6.1 FINAL FREEZE)', () => {
  let app;
  let companyId;
  let ceoToken;
  let hrToken;
  let managerToken;
  let employeeToken;

  let ceoUser;
  let hrUser;
  let managerUser;
  let employeeUser;

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

    // Khởi tạo công ty kiểm thử
    const company = await Company.create({
      name: 'Test Corp Tuần 1',
      code: `TC_${Date.now()}`,
      taxCode: `TAX_${Date.now()}`,
      address: '123 Test Street, Hanoi',
      contactEmail: `contact_${Date.now()}@test.com`,
      contactPhone: '0988776655',
      settings: {
        workingHours: {
          start: '08:30',
          end: '17:30',
          breakMinutes: 60,
          standardWorkingDaysPerMonth: 22,
        },
      },
    });
    companyId = company._id.toString();

    // Khởi tạo User trong context tenant
    await tenantStore.run({ companyId }, async () => {
      // 1. CEO
      ceoUser = await User.create({
        companyId,
        employeeCode: 'NV0001',
        email: `ceo_${Date.now()}@test.com`,
        fullName: 'Nguyễn Văn CEO',
        role: ROLES.CEO,
        passwordHash: 'hashed_pw',
        hireDate: new Date('2020-01-01'),
        salaryConfig: { baseSalary: 50000000 },
      });
      ceoToken = generateAuthToken(ceoUser);

      // 2. HR Manager
      hrUser = await User.create({
        companyId,
        employeeCode: 'NV0002',
        email: `hr_${Date.now()}@test.com`,
        fullName: 'Trần Thị HR',
        role: ROLES.HR_MANAGER,
        passwordHash: 'hashed_pw',
        hireDate: new Date('2021-01-01'),
        salaryConfig: { baseSalary: 30000000 },
      });
      hrToken = generateAuthToken(hrUser);

      // 3. Manager
      managerUser = await User.create({
        companyId,
        employeeCode: 'NV0003',
        email: `mgr_${Date.now()}@test.com`,
        fullName: 'Lê Văn Manager',
        role: ROLES.MANAGER,
        passwordHash: 'hashed_pw',
        hireDate: new Date('2022-01-01'),
        salaryConfig: { baseSalary: 25000000 },
      });
      managerToken = generateAuthToken(managerUser);

      // 4. Employee
      employeeUser = await User.create({
        companyId,
        employeeCode: 'NV0004',
        email: `emp_${Date.now()}@test.com`,
        fullName: 'Phạm Thị Employee',
        role: ROLES.EMPLOYEE,
        passwordHash: 'hashed_pw',
        hireDate: new Date('2023-01-01'),
        salaryConfig: { baseSalary: 15000000 },
      });
      employeeToken = generateAuthToken(employeeUser);
    });
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test trong tenant context
    if (companyId) {
      await tenantStore.run({ companyId }, async () => {
        await User.deleteMany({ companyId });
        await Department.deleteMany({ companyId });
        await AuditLog.deleteMany({ companyId });
      });
      await Company.findByIdAndDelete(companyId);
    }
  });

  // =========================================================================
  // SECTION 1: CÂY PHÒNG BAN 2 CẤP
  // =========================================================================
  describe('Quản lý Cây Phòng ban (2 Cấp)', () => {
    let parentDeptId;
    let childDeptId;

    it('HR tạo phòng ban cấp 1 (Khối Kỹ Thuật)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Khối Kỹ Thuật',
          code: `TECH_${Date.now()}`,
          managerId: managerUser._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Khối Kỹ Thuật');
      expect(res.body.data.parentDepartmentId).toBeNull();
      parentDeptId = res.body.data._id;
    });

    it('HR tạo phòng ban con cấp 2 thuộc Khối Kỹ Thuật (Phòng AI & Cloud)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Phòng AI & Cloud',
          code: `AICLOUD_${Date.now()}`,
          parentDepartmentId: parentDeptId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parentDepartmentId).toBe(parentDeptId);
      childDeptId = res.body.data._id;
    });

    it('Chặn tạo phòng ban cấp 3 (vượt trần 2 cấp tổ chức)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          name: 'Đội Backend Golang',
          code: `GOLANG_${Date.now()}`,
          parentDepartmentId: childDeptId, // Cố tình chọn cha là cấp 2
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/tối đa 2 cấp/);
    });

    it('Lấy sơ đồ tổ chức cây phòng ban (GET /api/departments)', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const foundParent = res.body.data.find((d) => d._id.toString() === parentDeptId);
      expect(foundParent).toBeDefined();
      expect(foundParent.children).toBeDefined();
      expect(foundParent.children.some((c) => c._id.toString() === childDeptId)).toBe(true);
    });

    it('Chặn xóa phòng ban cha khi đang có phòng ban con trực thuộc', async () => {
      const res = await request(app)
        .delete(`/api/departments/${parentDeptId}`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Không thể xóa phòng ban đang có phòng ban con/);
    });
  });

  // =========================================================================
  // SECTION 2: CRUD NHÂN SỰ & BẢO MẬT DỮ LIỆU
  // =========================================================================
  describe('CRUD Nhân sự & Chống Rò rỉ Lương', () => {
    let createdUserId;
    const testEmail = `newbie_${Date.now()}@test.com`;

    it('Tạo nhân viên mới và tự động sinh mã NVxxxx chuẩn liên tục', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          fullName: 'Ngô Thâm Niên',
          email: testEmail,
          phone: '0912345678',
          password: 'Password123!',
          hireDate: '2018-05-01', // Thâm niên > 5 năm
          contract: {
            contractType: 'INDEFINITE',
            effectiveFrom: '2018-05-01',
            baseSalary: 20000000,
            allowance: 730000,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeCode).toMatch(/^NV\d{4}$/);
      expect(res.body.data.email).toBe(testEmail);

      // Thâm niên từ 2018 đến 2026 là 8 năm -> được cộng thêm 1 ngày phép theo Điều 114 BLLĐ (12 + 1 = 13)
      expect(res.body.data.leaveBalance.annualTotal).toBeGreaterThanOrEqual(13);

      createdUserId = res.body.data._id;
    });

    it('Chống Mass Assignment: Không cho phép đổi vai trò role qua POST /api/users', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          fullName: 'Kẻ Tấn Công Mass Assign',
          email: `hacker_${Date.now()}@test.com`,
          password: 'Password123!',
          role: ROLES.CEO, // Cố tình truyền role CEO
        });

      // Zod .strict() trên createUserSchema sẽ chặn thuộc tính lạ 'role'
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/users: Tuyệt đối KHÔNG trả về salaryConfig hoặc refreshTokens (Projection An Toàn)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);

      // Duyệt qua từng bản ghi nhân viên để kiểm chứng
      res.body.users.forEach((u) => {
        expect(u.salaryConfig).toBeUndefined();
        expect(u.refreshTokens).toBeUndefined();
        expect(u.passwordHash).toBeUndefined();
      });
    });

    it('Quản lý (MANAGER) cố tình xem lương nhân viên khác -> BỊ TỪ CHỐI 403', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}/salary`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('CEO/HR xem lương nhân viên -> Thành công & Tự động ghi vết AuditLog VIEW_SALARY_OTHER', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}/salary`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.baseSalary).toBe(20000000);

      // Kiểm tra có bản ghi AuditLog trong tenant context
      await tenantStore.run({ companyId }, async () => {
        const audit = await AuditLog.findOne({
          companyId,
          action: 'VIEW_SALARY_OTHER',
          'details.targetUserId': createdUserId,
        });
        expect(audit).toBeDefined();
        expect(audit.userId.toString()).toBe(hrUser._id.toString());
      });
    });

    it('Đổi vai trò nhân viên qua endpoint quản trị riêng PATCH /api/users/:id/role', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/role`)
        .set('Authorization', `Bearer ${ceoToken}`)
        .send({ role: ROLES.MANAGER });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(ROLES.MANAGER);

      // Xác minh trong DB trong tenant context
      await tenantStore.run({ companyId }, async () => {
        const updatedInDb = await User.findById(createdUserId);
        expect(updatedInDb.role).toBe(ROLES.MANAGER);
      });
    });

    it('Thêm hợp đồng lao động mới POST /api/users/:id/contracts', async () => {
      const res = await request(app)
        .post(`/api/users/${createdUserId}/contracts`)
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          contractType: 'INDEFINITE',
          effectiveFrom: '2026-01-01',
          baseSalary: 22000000,
          allowance: 1000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contractNumber).toMatch(/^HDLD-/);
      expect(res.body.data.baseSalary).toBe(22000000);
    });

    it('Xóa mềm nhân sự DELETE /api/users/:id (Chỉ CEO)', async () => {
      // HR cố xóa -> 403
      const resForbidden = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${hrToken}`);
      expect(resForbidden.status).toBe(403);

      // CEO xóa -> 200
      const res = await request(app)
        .delete(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${ceoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      await tenantStore.run({ companyId }, async () => {
        const checkDb = await User.findById(createdUserId);
        expect(checkDb.isActive).toBe(false);
      });
    });
  });
});
