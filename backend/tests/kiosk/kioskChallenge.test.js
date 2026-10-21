import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { Company, User, FaceTemplate } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import {
  createKioskChallenge,
  verifyAndConsumeNonce,
  _clearAllNoncesForTest,
} from '../../src/services/kioskChallengeService.js';
import { encryptDescriptors, decryptDescriptors } from '../../src/models/FaceTemplate.js';

describe('Kiosk FaceID Tầng 1: Challenge Nonce, Device Auth & AES-256 Encryption', () => {
  let app;
  let testCompany;
  let testUser;
  const rawKioskToken = 'kiosk_secret_token_defense_gate_01';
  const hashedKioskToken = crypto.createHash('sha256').update(rawKioskToken).digest('hex');
  const deviceId = 'kiosk_main_entrance_01';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    app = createApp();

    // 1. Tạo Company có cấu hình Kiosk Device
    testCompany = await Company.create({
      name: 'Công ty Kiosk FaceID Test',
      code: 'COMP_KIOSK_TEST',
      taxCode: 'TAX_KIOSK_01',
      subscriptionPlan: 'ENTERPRISE',
      settings: {
        devices: [{
          deviceId,
          kioskSecretTokenHash: hashedKioskToken,
          description: 'Cổng kiểm soát bảo vệ - Kiosk 01',
          isActive: true,
        }],
      },
    });

    // 2. Tạo User trong tenant
    await tenantStore.run({ companyId: testCompany._id.toString() }, async () => {
      testUser = await User.create({
        companyId: testCompany._id,
        employeeCode: 'EMP_KIOSK_01',
        fullName: 'Nguyễn Văn Kiểm Thử',
        email: 'kiosk_tester@test.com',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
      });
    });
  });

  afterAll(async () => {
    _clearAllNoncesForTest();
    if (testCompany?._id) {
      const companyId = testCompany._id;
      await tenantStore.run({ companyId: companyId.toString() }, async () => {
        await FaceTemplate.deleteMany({ companyId });
        await User.deleteMany({ companyId });
      });
      await Company.deleteOne({ _id: companyId });
    }
    await mongoose.connection.close();
  });

  it('1. Xác thực thiết bị Kiosk qua Header x-kiosk-token thành công (HTTP 200)', async () => {
    const res = await request(app)
      .get('/api/kiosk/info')
      .set('x-kiosk-token', rawKioskToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toBe(deviceId);
    expect(res.body.data.companyId).toBe(testCompany._id.toString());
    expect(res.body.data.status).toBe('ONLINE');
  });

  it('2. Từ chối yêu cầu Kiosk nếu không có token hoặc token sai (HTTP 401)', async () => {
    // Thiếu token
    const resNoToken = await request(app).get('/api/kiosk/info');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.message).toContain('Thiếu Header x-kiosk-token');

    // Token sai
    const resWrongToken = await request(app)
      .get('/api/kiosk/info')
      .set('x-kiosk-token', 'wrong_token_123456');
    expect(resWrongToken.status).toBe(401);
    expect(resWrongToken.body.message).toContain('chưa được ủy quyền');
  });

  it('3. Sinh Nonce thử thách sinh trắc học Tầng 1 qua API /api/kiosk/challenge (TTL 60s)', async () => {
    const res = await request(app)
      .get('/api/kiosk/challenge')
      .set('x-kiosk-token', rawKioskToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nonce).toBeDefined();
    expect(typeof res.body.data.nonce).toBe('string');
    expect(['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT']).toContain(res.body.data.challengeType);
    expect(res.body.data.expiresIn).toBe(60);
    expect(res.body.data.instruction).toBeDefined();
  });

  it('4. Xác thực và tiêu hủy Nonce 1 lần: Chống tấn công phát lại (Replay Attack)', () => {
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'BLINK');
    expect(challenge.nonce).toBeDefined();

    // Lần 1: Xác thực thành công
    const consumed = verifyAndConsumeNonce(challenge.nonce, testCompany._id, deviceId);
    expect(consumed.challengeType).toBe('BLINK');
    expect(consumed.deviceId).toBe(deviceId);

    // Lần 2 (Replay Attack): Thử sử dụng lại nonce cũ -> Bị từ chối ngay lập tức
    expect(() => {
      verifyAndConsumeNonce(challenge.nonce, testCompany._id, deviceId);
    }).toThrow('EXPIRED_OR_REUSED_NONCE');
  });

  it('5. Mã hóa AES-256-GCM tại tầng ứng dụng cho vector FaceTemplate (Bảo vệ dữ liệu sinh trắc học)', async () => {
    // Giả lập vector 128 chiều từ Spike Tuần 0
    const dummyDescriptor = Array.from({ length: 128 }, (_, i) => parseFloat((i * 0.01).toFixed(4)));

    // Test helper thuần encrypt / decrypt
    const encrypted = encryptDescriptors([dummyDescriptor]);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).toContain(':'); // Định dạng iv:authTag:encrypted

    const decrypted = decryptDescriptors(encrypted);
    expect(decrypted.length).toBe(1);
    expect(decrypted[0]).toHaveLength(128);
    expect(decrypted[0][0]).toBe(dummyDescriptor[0]);

    // Test lưu vào MongoDB qua model FaceTemplate
    await tenantStore.run({ companyId: testCompany._id.toString() }, async () => {
      const template = await FaceTemplate.create({
        companyId: testCompany._id,
        userId: testUser._id,
        descriptors: [dummyDescriptor],
        vectorDimension: 128,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
      });

      expect(template._id).toBeDefined();
      expect(template.encryptedPayload).toBeDefined();
      expect(template.encryptedPayload).toContain(':');

      // Giải mã qua document method
      const decryptedFromDoc = template.getDecryptedDescriptors();
      expect(decryptedFromDoc).toHaveLength(1);
      expect(decryptedFromDoc[0][10]).toBe(dummyDescriptor[10]);
    });
  });
});
