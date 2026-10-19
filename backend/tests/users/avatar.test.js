import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, AUDIT_ACTIONS } from '../../src/config/constants.js';
import { Company, User, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Kiểm thử Tải lên Ảnh Đại diện Cloudinary (POST /api/users/:id/avatar)', () => {
  let app;
  let companyId;
  let ceoToken;
  let hrToken;
  let managerToken;
  let employee1Token;
  let employee2Token;

  let ceoUser;
  let hrUser;
  let managerUser;
  let employee1User;
  let employee2User;

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
      name: 'Test Avatar Corp',
      code: `TAC_${Date.now()}`,
      taxCode: `TAX_${Date.now()}`,
      address: '456 Test Street, Hanoi',
      contactEmail: `contact_${Date.now()}@test.com`,
      contactPhone: '0911223344',
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

    // Khởi tạo 5 users trong tenant context
    await tenantStore.run({ companyId }, async () => {
      ceoUser = await User.create({
        companyId,
        employeeCode: 'NV0001',
        fullName: 'CEO Test',
        email: `ceo_avatar_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.CEO,
      });

      hrUser = await User.create({
        companyId,
        employeeCode: 'NV0002',
        fullName: 'HR Manager Test',
        email: `hr_avatar_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.HR_MANAGER,
      });

      managerUser = await User.create({
        companyId,
        employeeCode: 'NV0003',
        fullName: 'Dept Manager Test',
        email: `mgr_avatar_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.MANAGER,
      });

      employee1User = await User.create({
        companyId,
        employeeCode: 'NV0004',
        fullName: 'Employee One Test',
        email: `emp1_avatar_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
      });

      employee2User = await User.create({
        companyId,
        employeeCode: 'NV0005',
        fullName: 'Employee Two Test',
        email: `emp2_avatar_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
      });
    });

    ceoToken = generateAuthToken(ceoUser);
    hrToken = generateAuthToken(hrUser);
    managerToken = generateAuthToken(managerUser);
    employee1Token = generateAuthToken(employee1User);
    employee2Token = generateAuthToken(employee2User);
  });

  afterAll(async () => {
    if (companyId) {
      await tenantStore.run({ companyId }, async () => {
        await User.deleteMany({ companyId });
        await AuditLog.deleteMany({ companyId });
      });
      await Company.deleteMany({ _id: companyId });
    }
    await mongoose.connection.close();
  });

  // 1. Tự cập nhật ảnh đại diện của chính mình (Employee 1)
  test('1. Nhân viên tự cập nhật ảnh đại diện của chính mình thành công (200 OK)', async () => {
    const fakePngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);

    const res = await request(app)
      .post(`/api/users/${employee1User._id}/avatar`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .attach('avatar', fakePngBuffer, 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatarUrl).toBeDefined();
    expect(res.body.data.avatarUrl).toContain('cloudinary.com');

    // Kiểm tra trong CSDL qua tenant context
    await tenantStore.run({ companyId }, async () => {
      const updatedUser = await User.findById(employee1User._id);
      expect(updatedUser.avatarUrl).toBe(res.body.data.avatarUrl);

      // Kiểm tra AuditLog
      const audit = await AuditLog.findOne({
        companyId,
        action: AUDIT_ACTIONS.UPDATE_AVATAR,
        'details.targetUserId': employee1User._id.toString(),
      });
      expect(audit).toBeDefined();
    });
  });

  // 2. HR Manager cập nhật ảnh đại diện cho nhân viên cấp dưới
  test('2. HR Manager có quyền cập nhật ảnh đại diện cho nhân viên khác trong công ty (200 OK)', async () => {
    const fakeJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

    const res = await request(app)
      .post(`/api/users/${employee2User._id}/avatar`)
      .set('Authorization', `Bearer ${hrToken}`)
      .attach('avatar', fakeJpgBuffer, 'profile.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatarUrl).toContain('cloudinary.com');

    await tenantStore.run({ companyId }, async () => {
      const updatedUser = await User.findById(employee2User._id);
      expect(updatedUser.avatarUrl).toBe(res.body.data.avatarUrl);
    });
  });

  // 3. Nhân viên cố tình đổi ảnh của người khác (IDOR)
  test('3. Nhân viên (EMPLOYEE) cố ý đổi ảnh người khác bị chặn 403 Forbidden', async () => {
    const fakePngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    const res = await request(app)
      .post(`/api/users/${employee2User._id}/avatar`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .attach('avatar', fakePngBuffer, 'hack.png');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 4. Manager cố ý đổi ảnh nhân viên khác (khi không phải HR/CEO)
  test('4. Manager cố tình đổi ảnh đại diện nhân viên khác bị chặn 403 Forbidden', async () => {
    const fakePngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    const res = await request(app)
      .post(`/api/users/${employee1User._id}/avatar`)
      .set('Authorization', `Bearer ${managerToken}`)
      .attach('avatar', fakePngBuffer, 'manager_hack.png');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // 5. Tải tệp không đúng định dạng ảnh (PDF, TXT, EXE...)
  test('5. Tải tệp không hợp lệ (PDF) bị từ chối 400 Bad Request', async () => {
    const fakePdfBuffer = Buffer.from('%PDF-1.4 ... fake pdf content ...');

    const res = await request(app)
      .post(`/api/users/${employee1User._id}/avatar`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .attach('avatar', fakePdfBuffer, 'document.pdf');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Định dạng tệp không hợp lệ');
  });

  // 6. Tải tệp vượt quá dung lượng 2MB
  test('6. Tải tệp dung lượng vượt quá 2MB bị từ chối 400 Bad Request', async () => {
    // Tạo buffer dung lượng 2.5MB
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0xff);

    const res = await request(app)
      .post(`/api/users/${employee1User._id}/avatar`)
      .set('Authorization', `Bearer ${employee1Token}`)
      .attach('avatar', oversizedBuffer, 'oversized.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('2MB');
  });

  // 7. Request không đính kèm tệp
  test('7. Gửi request không đính kèm file ảnh trả về 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/users/${employee1User._id}/avatar`)
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('avatar');
  });
});
