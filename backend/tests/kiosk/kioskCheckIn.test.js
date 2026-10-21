import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { Company, User, FaceTemplate, AttendanceLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import { createKioskChallenge, _clearAllNoncesForTest } from '../../src/services/kioskChallengeService.js';

describe('Kiosk FaceID Tầng 2: Điểm Danh 1:N & Ghi Nhận AttendanceLogs', () => {
  let app;
  let testCompany;
  let user1;
  let user2;
  const rawKioskToken = 'kiosk_checkin_secret_token_123';
  const hashedToken = crypto.createHash('sha256').update(rawKioskToken).digest('hex');
  const deviceId = 'gate_kiosk_01';

  // Vector 128D mẫu chuẩn (đại diện cho User 1 và User 2)
  const baseVectorUser1 = Array.from({ length: 128 }, (_, i) => (i % 2 === 0 ? 0.2 : 0.05));
  const baseVectorUser2 = Array.from({ length: 128 }, (_, i) => (i % 2 === 0 ? 0.8 : 0.9));

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    app = createApp();

    // 1. Tạo Company với ca làm việc và Kiosk Device
    testCompany = await Company.create({
      name: 'Công ty CheckIn Kiosk Test',
      code: 'COMP_CHECKIN_TEST',
      taxCode: 'TAX_CHECKIN_01',
      subscriptionPlan: 'ENTERPRISE',
      settings: {
        shifts: [{
          shiftCode: 'HC',
          startTime: '08:30',
          endTime: '17:30',
          gracePeriodMinutes: 15,
        }],
        devices: [{
          deviceId,
          kioskSecretTokenHash: hashedToken,
          description: 'Cửa kiểm soát FaceID Kiosk',
          isActive: true,
        }],
      },
    });

    const companyId = testCompany._id;

    // 2. Tạo Users và FaceTemplates trong tenantStore
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      user1 = await User.create({
        companyId,
        employeeCode: 'NV_REAL_01',
        fullName: 'Nguyễn Văn Chính Chủ',
        email: 'chinhchu@test.com',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
      });

      user2 = await User.create({
        companyId,
        employeeCode: 'NV_OTHER_02',
        fullName: 'Trần Thị Đồng Nghiệp',
        email: 'dongnghiep@test.com',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
      });

      // Tạo FaceTemplate có mã hóa AES-256-GCM
      await FaceTemplate.create({
        companyId,
        userId: user1._id,
        descriptors: [baseVectorUser1],
        vectorDimension: 128,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
      });

      await FaceTemplate.create({
        companyId,
        userId: user2._id,
        descriptors: [baseVectorUser2],
        vectorDimension: 128,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
      });
    });
  });

  afterAll(async () => {
    _clearAllNoncesForTest();
    if (testCompany?._id) {
      const companyId = testCompany._id;
      await tenantStore.run({ companyId: companyId.toString() }, async () => {
        await AttendanceLog.deleteMany({ companyId });
        await FaceTemplate.deleteMany({ companyId });
        await User.deleteMany({ companyId });
      });
      await Company.deleteOne({ _id: companyId });
    }
    await mongoose.connection.close();
  });

  it('1. Điểm danh lần đầu trong ngày: Nhận diện đúng User 1 và ghi nhận CHECK_IN vào AttendanceLog', async () => {
    // Lấy Nonce thử thách
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'BLINK');

    // Tạo vector vStart và vEnd rất gần với baseVectorUser1 (nhiễu nhẹ 0.005)
    const vStart = baseVectorUser1.map((val) => parseFloat((val + 0.005).toFixed(4)));
    const vEnd = baseVectorUser1.map((val) => parseFloat((val + 0.008).toFixed(4)));

    const checkInDate = '2026-10-23T08:15:00'; // 08:15 sáng (đúng giờ, ca 08:30)

    const res = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({
        nonce: challenge.nonce,
        vStart,
        vEnd,
        referenceDate: checkInDate,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionType).toBe('CHECK_IN');
    expect(res.body.data.employee.employeeCode).toBe('NV_REAL_01');
    expect(res.body.data.employee.fullName).toBe('Nguyễn Văn Chính Chủ');
    expect(res.body.data.attendance.method).toBe('FACE');
    expect(res.body.data.attendance.isLate).toBe(false);

    // Xác minh trong DB AttendanceLog
    await tenantStore.run({ companyId: testCompany._id.toString() }, async () => {
      const log = await AttendanceLog.findOne({
        companyId: testCompany._id,
        userId: user1._id,
        date: '2026-10-23',
      });

      expect(log).toBeDefined();
      expect(log.checkInTime).toBeDefined();
      expect(log.checkOutTime).toBeNull();
      expect(log.method).toBe('FACE');
      expect(log.deviceId).toBe(deviceId);
    });
  });

  it('2. Điểm danh lần 2 trong ngày: Nhận diện User 1 và tự động ghi nhận CHECK_OUT kèm tổng số giờ làm việc', async () => {
    // Lấy Nonce mới
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'SMILE');

    const vStart = baseVectorUser1.map((val) => parseFloat((val + 0.006).toFixed(4)));
    const vEnd = baseVectorUser1.map((val) => parseFloat((val + 0.009).toFixed(4)));

    // Check-out lúc 17:45 (sau 9.5 tiếng = 570 phút)
    const checkOutDate = '2026-10-23T17:45:00';

    const res = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({
        nonce: challenge.nonce,
        vStart,
        vEnd,
        referenceDate: checkOutDate,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionType).toBe('CHECK_OUT');
    expect(res.body.data.attendance.workDurationMinutes).toBe(570);

    // Xác minh trong DB AttendanceLog đã cập nhật checkOutTime
    await tenantStore.run({ companyId: testCompany._id.toString() }, async () => {
      const log = await AttendanceLog.findOne({
        companyId: testCompany._id,
        userId: user1._id,
        date: '2026-10-23',
      });

      expect(log.checkOutTime).toBeDefined();
      expect(log.workDurationMinutes).toBe(570);
    });
  });

  it('3. Chống Replay Attack: Từ chối ngay khi dùng lại Nonce đã tiêu hủy', async () => {
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'BLINK');

    const vStart = [...baseVectorUser1];
    const vEnd = [...baseVectorUser1];

    // Lần 1: Thành công
    const res1 = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({ nonce: challenge.nonce, vStart, vEnd });
    expect(res1.status).toBe(200);

    // Lần 2: Thử dùng lại cùng nonce -> Bị từ chối ngay lập tức
    const res2 = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({ nonce: challenge.nonce, vStart, vEnd });

    expect(res2.status).toBe(500); // Lỗi ném ra từ verifyAndConsumeNonce
    const errorMsg2 = typeof res2.body.error === 'string' ? res2.body.error : res2.body.message;
    expect(errorMsg2).toContain('Chống Replay Attack');
  });

  it('4. Chặn gian lận Liveness: Từ chối khi khoảng cách giữa V_start và V_end vượt ngưỡng 0.40 (Tráo đổi người/ảnh)', async () => {
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'TURN_LEFT');

    // V_start là mặt User 1, nhưng V_end bị tráo sang mặt User 2 (khoảng cách lớn > 0.40)
    const vStart = [...baseVectorUser1];
    const vEnd = [...baseVectorUser2];

    const res = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({ nonce: challenge.nonce, vStart, vEnd });

    expect(res.status).toBe(422);
    const errorMsg = typeof res.body.error === 'string' ? res.body.error : res.body.message;
    expect(errorMsg).toContain('Phát hiện tráo đổi người/phương tiện giả mạo');
  });

  it('5. Từ chối khi khuôn mặt người lạ hoàn toàn không khớp với ai trong hệ thống (d1 > 0.60)', async () => {
    const challenge = createKioskChallenge(testCompany._id, deviceId, 'BLINK');

    // Vector người lạ hoàn toàn khác cả User 1 và User 2
    const strangerVector = Array.from({ length: 128 }, () => -0.85);

    const res = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({
        nonce: challenge.nonce,
        vStart: strangerVector,
        vEnd: strangerVector,
      });

    expect(res.status).toBe(422);
    const errorMsg = typeof res.body.error === 'string' ? res.body.error : res.body.message;
    expect(errorMsg).toContain('không khớp với bất kỳ nhân sự nào');
  });

  it('6. Kiểm soát FAR: Fallback sang xác thực 1:1 khi biên an toàn phân tách giữa 2 ứng viên quá nhỏ (margin < 0.15)', async () => {
    // Tạo thêm User 3 có vector cực kỳ giống User 1 để tạo tình huống biên an toàn nhỏ
    const verySimilarVector = baseVectorUser1.map((val) => parseFloat((val + 0.04).toFixed(4)));

    await tenantStore.run({ companyId: testCompany._id.toString() }, async () => {
      const user3 = await User.create({
        companyId: testCompany._id,
        employeeCode: 'NV_TWIN_03',
        fullName: 'Lê Văn Song Sinh',
        email: 'twin@test.com',
        passwordHash: 'dummy_hash',
        role: 'EMPLOYEE',
        isActive: true,
      });

      await FaceTemplate.create({
        companyId: testCompany._id,
        userId: user3._id,
        descriptors: [verySimilarVector],
        vectorDimension: 128,
        hasConsent: true,
        consentPolicyVersion: 'v2026.1',
      });
    });

    const challenge = createKioskChallenge(testCompany._id, deviceId, 'BLINK');

    // Vector truy vấn nằm sát giữa User 1 và User 3 khiến d2 - d1 < 0.15
    const queryVector = baseVectorUser1.map((val) => parseFloat((val + 0.02).toFixed(4)));

    const res = await request(app)
      .post('/api/kiosk/check-in')
      .set('x-kiosk-token', rawKioskToken)
      .send({
        nonce: challenge.nonce,
        vStart: queryVector,
        vEnd: queryVector,
      });

    // Hệ thống phát hiện độ chênh lệch nhỏ hơn 0.15 -> Trả về 409 Conflict và cờ fallbackTo1To1
    expect(res.status).toBe(409);
    expect(res.body.fallbackTo1To1).toBe(true);
    const errorMsg = typeof res.body.error === 'string' ? res.body.error : res.body.message;
    expect(errorMsg).toContain('nhỏ hơn biên an toàn');
    expect(errorMsg).toContain('xác minh 1:1');
  });
});
