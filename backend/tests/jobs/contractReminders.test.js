import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { Company, User, Notification } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import { runAllCompaniesContractReminders, checkCompanyContractReminders } from '../../src/services/contractReminderService.js';

describe('Job: Contract Expiry Reminders (30/60 days)', () => {
  let app;
  let testCompany;
  let ceoUser;
  let hrUser;
  let employee30d;
  let employee60d;
  let employeeSafe;
  let ceoToken;
  let employeeToken;

  const refDate = new Date('2026-10-22T08:00:00.000Z');

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    app = createApp();
    // 1. Tạo Company
    testCompany = await Company.create({
      name: 'Công ty Cổ phần Công nghệ Cron Test',
      code: 'CRON_TEST_COMP',
      taxCode: 'CRON_TEST_001',
      subscriptionPlan: 'ENTERPRISE',
      settings: {
        locations: [{
          locationId: 'LOC_HQ_01',
          name: 'Trụ sở chính',
          latitude: 21.0285,
          longitude: 105.8542,
          radiusMeters: 200
        }]
      }
    });

    const companyId = testCompany._id;

    // 2. Tạo users trong tenantStore
    await tenantStore.run({ companyId }, async () => {
      // CEO
      ceoUser = await User.create({
        companyId,
        employeeCode: 'CEO_001',
        email: 'ceo_cron@test.com',
        fullName: 'Nguyễn Văn CEO',
        passwordHash: 'dummy_hash',
        role: 'CEO',
        isActive: true
      });

      // HR Manager
      hrUser = await User.create({
        companyId,
        employeeCode: 'HR_001',
        email: 'hr_cron@test.com',
        fullName: 'Trần Thị HR',
        passwordHash: 'dummy_hash',
        role: 'HR_MANAGER',
        isActive: true
      });

      // Employee 1: Hợp đồng còn 20 ngày (rơi vào mốc 30D)
      const end30d = new Date(refDate);
      end30d.setDate(end30d.getDate() + 20); // 20 ngày nữa hết hạn

      employee30d = await User.create({
        companyId,
        employeeCode: 'EMP_30D',
        email: 'emp30@test.com',
        fullName: 'Lê Văn Ba Mươi',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
        contracts: [{
          contractNumber: 'HDLD-30D-01',
          contractType: 'DEFINITE',
          effectiveFrom: new Date('2025-11-11'),
          effectiveTo: end30d,
          baseSalary: 15000000,
          status: 'ACTIVE'
        }]
      });

      // Employee 2: Hợp đồng còn 55 ngày (rơi vào mốc 60D)
      const end60d = new Date(refDate);
      end60d.setDate(end60d.getDate() + 55); // 55 ngày nữa hết hạn

      employee60d = await User.create({
        companyId,
        employeeCode: 'EMP_60D',
        email: 'emp60@test.com',
        fullName: 'Phạm Thị Sáu Mươi',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
        contracts: [{
          contractNumber: 'HDLD-60D-01',
          contractType: 'DEFINITE',
          effectiveFrom: new Date('2025-12-16'),
          effectiveTo: end60d,
          baseSalary: 18000000,
          status: 'ACTIVE'
        }]
      });

      // Employee 3: Hợp đồng còn 120 ngày (an toàn, không nhắc)
      const endSafe = new Date(refDate);
      endSafe.setDate(endSafe.getDate() + 120);

      employeeSafe = await User.create({
        companyId,
        employeeCode: 'EMP_SAFE',
        email: 'empsafe@test.com',
        fullName: 'Hoàng Văn An Toàn',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
        contracts: [{
          contractNumber: 'HDLD-SAFE-01',
          contractType: 'DEFINITE',
          effectiveFrom: new Date('2026-02-20'),
          effectiveTo: endSafe,
          baseSalary: 20000000,
          status: 'ACTIVE'
        }]
      });
    });

    // Tạo JWT tokens
    ceoToken = jwt.sign(
      { userId: ceoUser._id, companyId: testCompany._id, role: 'CEO' },
      config.jwt.accessSecret,
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { userId: employee30d._id, companyId: testCompany._id, role: 'EMPLOYEE' },
      config.jwt.accessSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (testCompany?._id) {
      const companyId = testCompany._id;
      await tenantStore.run({ companyId }, async () => {
        await Notification.deleteMany({ companyId });
        await User.deleteMany({ companyId });
      });
      await Company.deleteOne({ _id: companyId });
    }
    await mongoose.connection.close();
  });

  it('1. Quét hợp đồng lần đầu: phát hiện đúng các mốc 30D và 60D và tạo thông báo', async () => {
    const result = await checkCompanyContractReminders(testCompany._id, refDate);

    expect(result.scannedUsers).toBeGreaterThanOrEqual(3);
    expect(result.expiringContractsFound).toBe(2); // employee30d và employee60d
    // Với mỗi hợp đồng: gửi cho người lao động (1) + HR/CEO (2) = 3 thông báo/hợp đồng => 6 thông báo
    expect(result.notificationsCreated).toBe(6);

    // Xác minh thông báo trong DB
    await tenantStore.run({ companyId: testCompany._id }, async () => {
      const notifs = await Notification.find({ companyId: testCompany._id });
      expect(notifs.length).toBe(6);

      // Kiểm tra có thông báo cho chính nhân viên employee30d
      const emp30Notif = notifs.find(n => n.userId.toString() === employee30d._id.toString());
      expect(emp30Notif).toBeDefined();
      expect(emp30Notif.title).toContain('20 ngày');
      expect(emp30Notif.data.milestone).toBe('30D');

      // Kiểm tra có thông báo cho chính nhân viên employee60d
      const emp60Notif = notifs.find(n => n.userId.toString() === employee60d._id.toString());
      expect(emp60Notif).toBeDefined();
      expect(emp60Notif.title).toContain('55 ngày');
      expect(emp60Notif.data.milestone).toBe('60D');
    });
  });

  it('2. Chạy lại lần 2 (Idempotency): tuyệt đối không tạo thêm thông báo trùng lặp', async () => {
    const secondRun = await checkCompanyContractReminders(testCompany._id, refDate);

    expect(secondRun.notificationsCreated).toBe(0); // Không có thông báo mới nào được tạo

    // Tổng số thông báo trong DB vẫn giữ nguyên là 6
    await tenantStore.run({ companyId: testCompany._id }, async () => {
      const count = await Notification.countDocuments({ companyId: testCompany._id });
      expect(count).toBe(6);
    });
  });

  it('3. Trigger API endpoint POST /api/jobs/contract-reminders bằng x-cron-key', async () => {
    const res = await request(app)
      .post('/api/jobs/contract-reminders')
      .set('x-cron-key', config.security.cronJobApiKey)
      .send({ referenceDate: refDate.toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.triggerSource).toBe('CRON_KEY');
    expect(res.body.data.totalNotificationsCreated).toBe(0); // Đã chạy ở bước 1 nên lần này tạo 0
  });

  it('4. Trigger API endpoint bằng JWT của CEO thành công (HTTP 200)', async () => {
    const res = await request(app)
      .post('/api/jobs/contract-reminders')
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({ referenceDate: refDate.toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.triggerSource).toBe('USER_ROLE');
  });

  it('5. Chặn nhân viên thường (EMPLOYEE) gọi endpoint nếu không có cron key (HTTP 403)', async () => {
    const res = await request(app)
      .post('/api/jobs/contract-reminders')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Quyền truy cập bị từ chối');
  });
});
