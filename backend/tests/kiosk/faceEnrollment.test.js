import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, AUDIT_ACTIONS } from '../../src/config/constants.js';
import { Company, User, FaceTemplate, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Biometric Face Enrollment & Consent (Luật BVDLCN 91/2025/QH15)', () => {
  let app;
  let companyA;
  let companyB;
  let hrTokenA;
  let employeeTokenA;
  let managerTokenA;
  let hrTokenB;

  let hrUserA;
  let employeeUserA;
  let managerUserA;
  let hrUserB;

  // Tạo mẫu 3 vector 128-d hợp lệ
  const validDescriptors = [
    Array.from({ length: 128 }, (_, i) => 0.1 + (i % 10) * 0.05),
    Array.from({ length: 128 }, (_, i) => 0.12 + (i % 10) * 0.05),
    Array.from({ length: 128 }, (_, i) => 0.11 + (i % 10) * 0.05),
  ];

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

    // 1. Khởi tạo 2 công ty để test multi-tenancy
    companyA = await Company.create({
      name: 'Công ty Face Enrollment Test A',
      code: `COMP_FACE_A_${Date.now()}`,
      taxCode: `TAX_FA_${Date.now()}`,
    });

    companyB = await Company.create({
      name: 'Công ty Face Enrollment Test B',
      code: `COMP_FACE_B_${Date.now()}`,
      taxCode: `TAX_FB_${Date.now()}`,
    });

    // 2. Tạo users cho Công ty A
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      hrUserA = await User.create({
        companyId: companyA._id,
        employeeCode: 'NV_HR_A',
        fullName: 'Nguyễn Thị HR',
        email: `hr_a_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.HR_MANAGER,
      });

      employeeUserA = await User.create({
        companyId: companyA._id,
        employeeCode: 'NV_EMP_A',
        fullName: 'Trần Văn Nhân Viên',
        email: `emp_a_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
      });

      managerUserA = await User.create({
        companyId: companyA._id,
        employeeCode: 'NV_MGR_A',
        fullName: 'Lê Quản Lý',
        email: `mgr_a_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.MANAGER,
      });
    });

    // 3. Tạo user cho Công ty B
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      hrUserB = await User.create({
        companyId: companyB._id,
        employeeCode: 'NV_HR_B',
        fullName: 'Phạm HR Công Ty B',
        email: `hr_b_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.HR_MANAGER,
      });
    });

    hrTokenA = generateAuthToken(hrUserA);
    employeeTokenA = generateAuthToken(employeeUserA);
    managerTokenA = generateAuthToken(managerUserA);
    hrTokenB = generateAuthToken(hrUserB);
  });

  afterAll(async () => {
    if (companyA) {
      await FaceTemplate.deleteMany({ companyId: companyA._id });
      await User.deleteMany({ companyId: companyA._id });
      await AuditLog.deleteMany({ companyId: companyA._id });
      await Company.deleteOne({ _id: companyA._id });
    }
    if (companyB) {
      await FaceTemplate.deleteMany({ companyId: companyB._id });
      await User.deleteMany({ companyId: companyB._id });
      await AuditLog.deleteMany({ companyId: companyB._id });
      await Company.deleteOne({ _id: companyB._id });
    }
  });

  it('1. Trả về trạng thái chưa đăng ký khi nhân viên chưa lấy mẫu khuôn mặt', async () => {
    const res = await request(app)
      .get(`/api/users/${employeeUserA._id}/face-status`)
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasFaceRegistered).toBe(false);
    expect(res.body.data.sampleCount).toBe(0);
    expect(res.body.data.consent).toBeNull();
  });

  it('2. Từ chối nhân viên thường tự lấy mẫu từ xa (Cấm Remote Self-Enrollment, chỉ HR trực tiếp giám sát)', async () => {
    const res = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        descriptors: validDescriptors,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
      });

    expect(res.status).toBe(403);
    expect(res.body.error || res.body.message).toMatch(/Forbidden|không có quyền/i);
  });

  it('3. Từ chối Manager lấy mẫu khuôn mặt (Chỉ CEO & HR Manager)', async () => {
    const res = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${managerTokenA}`)
      .send({
        descriptors: validDescriptors,
        hasConsent: true,
      });

    expect(res.status).toBe(403);
  });

  it('4. Từ chối đăng ký khi không có sự đồng ý minh thị (hasConsent = false) theo Điều 13 Luật BVDLCN', async () => {
    const res = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${hrTokenA}`)
      .send({
        descriptors: validDescriptors,
        hasConsent: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('5. Từ chối khi số lượng mẫu < 3 hoặc vector sai số chiều (!= 128)', async () => {
    // Chỉ gửi 2 mẫu
    const res1 = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${hrTokenA}`)
      .send({
        descriptors: [validDescriptors[0], validDescriptors[1]],
        hasConsent: true,
      });

    expect(res1.status).toBe(400);
    expect(res1.body.message).toMatch(/tối thiểu 3 mẫu/i);

    // Mẫu sai số chiều (ví dụ 64 thay vì 128)
    const invalidDimensionVector = Array.from({ length: 64 }, () => 0.1);
    const res2 = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${hrTokenA}`)
      .send({
        descriptors: [invalidDimensionVector, invalidDimensionVector, invalidDimensionVector],
        hasConsent: true,
      });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toMatch(/128 chiều/i);
  });

  it('6. HR Manager lấy mẫu trực tiếp tại văn phòng thành công (Mã hóa AES-256-GCM & Ghi AuditLog)', async () => {
    const res = await request(app)
      .post(`/api/users/${employeeUserA._id}/face-enrollment`)
      .set('Authorization', `Bearer ${hrTokenA}`)
      .send({
        descriptors: validDescriptors,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
        modelName: 'face-api-ssd-mobilenetv1',
        modelVersion: '1.0',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasFaceRegistered).toBe(true);
    expect(res.body.data.sampleCount).toBe(3);

    // Kiểm tra trong database: encryptedPayload tồn tại (Mã hóa AES-256-GCM)
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const template = await FaceTemplate.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
      });

      expect(template).toBeDefined();
      expect(template.hasConsent).toBe(true);
      expect(template.enrolledBy.toString()).toBe(hrUserA._id.toString());
      expect(template.encryptedPayload).toBeDefined();
      expect(template.encryptedPayload.split(':').length).toBe(3); // iv:authTag:cipher

      // Kiểm tra AuditLog ghi nhận đúng mà TUYỆT ĐỐI KHÔNG chứa vector descriptors
      const audit = await AuditLog.findOne({
        companyId: companyA._id,
        action: AUDIT_ACTIONS.ENROLL_BIOMETRIC_FACE,
        'details.targetUserId': employeeUserA._id.toString(),
      });

      expect(audit).toBeDefined();
      expect(audit.details.sampleCount).toBe(3);
      expect(audit.details.legalBasis).toMatch(/Luật BVDLCN 91\/2025\/QH15/);
      expect(JSON.stringify(audit.details)).not.toContain('descriptors');
    });
  });

  it('7. Xem trạng thái FaceID trả về thông tin đồng ý & an toàn tuyệt đối không lộ vector', async () => {
    const res = await request(app)
      .get(`/api/users/${employeeUserA._id}/face-status`)
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasFaceRegistered).toBe(true);
    expect(res.body.data.sampleCount).toBe(3);
    expect(res.body.data.vectorDimension).toBe(128);
    expect(res.body.data.consent).toBeDefined();
    expect(res.body.data.consent.hasConsent).toBe(true);
    expect(res.body.data.consent.enrolledBy.fullName).toBe('Nguyễn Thị HR');

    // Projection an toàn tuyệt đối: Không trả về descriptors hay encryptedPayload
    expect(res.body.data.descriptors).toBeUndefined();
    expect(res.body.data.encryptedPayload).toBeUndefined();
  });

  it('8. Rút lại sự đồng ý & Xóa vĩnh viễn dữ liệu sinh trắc học (Khoản 2 Điều 14 Luật BVDLCN 91/2025/QH15)', async () => {
    // Nhân viên tự rút đồng ý
    const res = await request(app)
      .delete(`/api/users/${employeeUserA._id}/face-template`)
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deleted).toBe(true);

    // Kiểm tra database: FaceTemplate đã bị xóa vĩnh viễn
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const template = await FaceTemplate.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
      });
      expect(template).toBeNull();

      // Kiểm tra AuditLog ghi nhận thu hồi
      const audit = await AuditLog.findOne({
        companyId: companyA._id,
        action: AUDIT_ACTIONS.REVOKE_BIOMETRIC_CONSENT,
      });
      expect(audit).toBeDefined();
      expect(audit.details.legalBasis).toMatch(/Khoản 2 Điều 14/);
    });

    // Check status lại -> hasFaceRegistered = false
    const checkRes = await request(app)
      .get(`/api/users/${employeeUserA._id}/face-status`)
      .set('Authorization', `Bearer ${employeeTokenA}`);
    expect(checkRes.body.data.hasFaceRegistered).toBe(false);
  });

  it('9. Bảo vệ Multi-tenant: HR Công ty B không thể truy cập hoặc can thiệp sinh trắc học của Công ty A', async () => {
    const res = await request(app)
      .get(`/api/users/${employeeUserA._id}/face-status`)
      .set('Authorization', `Bearer ${hrTokenB}`);

    // Bị 404 hoặc 403 do tenant cách ly fail-closed
    expect([403, 404]).toContain(res.status);
  });
});
