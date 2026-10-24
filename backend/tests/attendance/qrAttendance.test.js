import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, ATTENDANCE_METHODS, ATTENDANCE_STATUS, AUDIT_ACTIONS } from '../../src/config/constants.js';
import { Company, User, AttendanceLog, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import {
  generateDynamicQrToken,
  computeQrSignature,
  _clearQrNonceMapForTesting,
} from '../../src/services/qrAttendanceService.js';

describe('Module Chấm Công QR Động Chu Kỳ 30s & Chống Replay Attack (Tuần 2)', () => {
  let app;
  let companyA;
  let companyB;
  let employeeUserA;
  let employeeTokenA;
  let employeeUserB;
  let employeeTokenB;
  let kioskTokenA = 'kiosk_qr_secret_token_123456';
  let kioskTokenAHash;

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

    kioskTokenAHash = crypto.createHash('sha256').update(kioskTokenA).digest('hex');

    // 1. Tạo Công ty A với ca làm việc và thiết bị Kiosk
    companyA = await Company.create({
      name: 'Công ty QR Test A',
      code: `COMP_QR_A_${Date.now()}`,
      taxCode: `TAX_QR_A_${Date.now()}`,
      settings: {
        shifts: [
          {
            shiftCode: 'HC',
            startTime: '08:30',
            endTime: '17:30',
            gracePeriodMinutes: 15,
          },
        ],
        devices: [
          {
            deviceId: 'kiosk_gate_a',
            kioskSecretTokenHash: kioskTokenAHash,
            description: 'Kiosk Cổng Chính',
            isActive: true,
          },
        ],
      },
    });

    // 2. Tạo Công ty B
    companyB = await Company.create({
      name: 'Công ty QR Test B',
      code: `COMP_QR_B_${Date.now()}`,
      taxCode: `TAX_QR_B_${Date.now()}`,
      settings: {
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

    // 3. Tạo nhân viên Công ty A
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      employeeUserA = await User.create({
        companyId: companyA._id,
        email: `employee_qr_a_${Date.now()}@test.com`,
        fullName: 'Nguyễn Văn QR A',
        employeeCode: `EMP_QRA_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });
    });
    employeeTokenA = generateAuthToken(employeeUserA);

    // 4. Tạo nhân viên Công ty B
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      employeeUserB = await User.create({
        companyId: companyB._id,
        email: `employee_qr_b_${Date.now()}@test.com`,
        fullName: 'Trần Thị QR B',
        employeeCode: `EMP_QRB_${Date.now()}`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
        isActive: true,
      });
    });
    employeeTokenB = generateAuthToken(employeeUserB);
  });

  afterAll(async () => {
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      await User.deleteMany({ companyId: companyA._id });
      await AttendanceLog.deleteMany({ companyId: companyA._id });
      await AuditLog.deleteMany({ companyId: companyA._id });
    });
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      await User.deleteMany({ companyId: companyB._id });
      await AttendanceLog.deleteMany({ companyId: companyB._id });
      await AuditLog.deleteMany({ companyId: companyB._id });
    });
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });
  });

  beforeEach(() => {
    _clearQrNonceMapForTesting();
  });

  test('1. Nhân viên lấy thẻ QR Động (chu kỳ 30s) thành công có HMAC-SHA256 signature', async () => {
    const res = await request(app)
      .get('/api/attendance/qr-pass')
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.qrCode).toBeDefined();
    expect(res.body.data.cycleSeconds).toBe(30);
    expect(res.body.data.expiresInSeconds).toBe(30);
    expect(res.body.data.user.fullName).toBe('Nguyễn Văn QR A');

    const payload = JSON.parse(res.body.data.qrCode);
    expect(payload.c).toBe(companyA._id.toString());
    expect(payload.u).toBe(employeeUserA._id.toString());
    expect(payload.n).toBeDefined();
    expect(payload.s).toBeDefined();

    // Đối chiếu chữ ký khớp với thuật toán
    const expectedSig = computeQrSignature(payload.c, payload.u, payload.t, payload.n);
    expect(payload.s).toBe(expectedSig);
  });

  test('2. Quét mã QR hợp lệ lần đầu ghi nhận CHECK_IN với method=QR và status=VALID', async () => {
    // Nhân viên tạo QR pass
    const qrPass = await generateDynamicQrToken(companyA._id, employeeUserA._id);

    // Máy quét gửi kết quả điểm danh
    const res = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: qrPass.qrCode,
        deviceId: 'scanner_gate_1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actionType).toBe('CHECK_IN');
    expect(res.body.data.method).toBe(ATTENDANCE_METHODS.QR);
    expect(res.body.data.status).toBe(ATTENDANCE_STATUS.VALID);
    expect(res.body.data.user.fullName).toBe('Nguyễn Văn QR A');

    // Kiểm tra CSDL attendanceLogs
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const log = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
        date: new Date().toISOString().slice(0, 10),
      });
      expect(log).not.toBeNull();
      expect(log.method).toBe('QR');
      expect(log.status).toBe('VALID');
    });
  });

  test('3. CHỐNG REPLAY ATTACK: Quét lại cùng mã QR lần thứ 2 bị từ chối ngay với mã lỗi 409', async () => {
    // Sinh mã QR
    const qrPass = await generateDynamicQrToken(companyA._id, employeeUserA._id);

    // Lần quét thứ 1: Thành công
    const res1 = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: qrPass.qrCode,
      });
    expect(res1.status).toBe(200);

    // Lần quét thứ 2 (Hacker chụp màn hình mã QR mang đi quét lại): Bị từ chối ngay
    const res2 = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: qrPass.qrCode,
      });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/Chống Replay Attack/i);
  });

  test('4. CHỐNG HẾT HẠN: Mã QR quá 35s bị từ chối với mã lỗi 400 QR_EXPIRED', async () => {
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiredTimestamp = Date.now() - 40000; // 40 giây trước
    const signature = computeQrSignature(companyA._id.toString(), employeeUserA._id.toString(), expiredTimestamp, nonce);

    const expiredQrData = JSON.stringify({
      c: companyA._id.toString(),
      u: employeeUserA._id.toString(),
      t: expiredTimestamp,
      n: nonce,
      s: signature,
    });

    const res = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: expiredQrData,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/hết hạn sử dụng/i);
  });

  test('5. CHỐNG GIẢ MẠO: Mã QR có chữ ký HMAC sai hoặc bị chỉnh sửa bị từ chối ngay (400)', async () => {
    const qrPass = await generateDynamicQrToken(companyA._id, employeeUserA._id);
    const parsed = JSON.parse(qrPass.qrCode);

    // Giả mạo đổi userId thành người khác
    parsed.u = employeeUserB._id.toString();

    const tamperedQrData = JSON.stringify(parsed);

    const res = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: tamperedQrData,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Chữ ký mã QR không hợp lệ/i);
  });

  test('6. ĐA CÔNG TY (MULTI-TENANT): Quét mã QR của công ty khác bị từ chối với mã 403', async () => {
    // Tạo QR pass cho nhân viên Công ty B
    const qrPassB = await generateDynamicQrToken(companyB._id, employeeUserB._id);

    // Máy quét của Công ty A quét mã của nhân viên Công ty B
    const res = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`) // Token thuộc Công ty A
      .send({
        qrData: qrPassB.qrCode,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/doanh nghiệp khác/i);
  });

  test('7. Quét lần tiếp theo trong ngày tự động ghi nhận CHECK_OUT và tính thời lượng', async () => {
    // Đã có CHECK_IN từ các test trước, tạo mã QR mới hợp lệ
    const qrPass = await generateDynamicQrToken(companyA._id, employeeUserA._id);

    const res = await request(app)
      .post('/api/attendance/qr-scan')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        qrData: qrPass.qrCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.actionType).toBe('CHECK_OUT');

    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const log = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
        date: new Date().toISOString().slice(0, 10),
      });

      expect(log.checkOutTime).not.toBeNull();
      expect(log.workDurationMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  test('8. KIOSK THIẾT BỊ: Điểm danh qua Kiosk bằng x-kiosk-token thành công', async () => {
    const qrPass = await generateDynamicQrToken(companyA._id, employeeUserA._id);

    const res = await request(app)
      .post('/api/kiosk/qr-check-in')
      .set('x-kiosk-token', kioskTokenA)
      .send({
        qrData: qrPass.qrCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.employeeCode).toBe(employeeUserA.employeeCode);

    // Kiểm tra có vết AuditLog
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const audit = await AuditLog.findOne({
        companyId: companyA._id,
        action: AUDIT_ACTIONS.QR_ATTENDANCE_CHECK,
      });
      expect(audit).not.toBeNull();
    });
  });
});
