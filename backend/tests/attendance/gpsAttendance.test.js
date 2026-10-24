import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES, ATTENDANCE_METHODS, ATTENDANCE_STATUS } from '../../src/config/constants.js';
import { Company, User, AttendanceLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Module Chấm Công Di Động GPS Geofencing (Tuần 2)', () => {
  let app;
  let companyA;
  let companyB;
  let employeeUserA;
  let employeeTokenA;
  let employeeUserB;
  let employeeTokenB;

  // Tọa độ văn phòng công ty A (Phòng Bảo Vệ ĐATN)
  const OFFICE_A_LAT = 21.0362;
  const OFFICE_A_LNG = 105.7829;
  const OFFICE_RADIUS = 100; // 100 mét

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

    // 1. Tạo Công ty A với ca làm việc và địa điểm GPS
    companyA = await Company.create({
      name: 'Công ty GPS Test A',
      code: `COMP_GPS_A_${Date.now()}`,
      taxCode: `TAX_GPS_A_${Date.now()}`,
      settings: {
        shifts: [
          {
            shiftCode: 'HC',
            startTime: '08:30',
            endTime: '17:30',
            gracePeriodMinutes: 15,
          },
        ],
        locations: [
          {
            locationId: 'loc_office_a',
            name: 'Trụ sở chính Hà Nội',
            latitude: OFFICE_A_LAT,
            longitude: OFFICE_A_LNG,
            radiusMeters: OFFICE_RADIUS,
          },
        ],
      },
    });

    // 2. Tạo Công ty B với địa điểm ở xa
    companyB = await Company.create({
      name: 'Công ty GPS Test B',
      code: `COMP_GPS_B_${Date.now()}`,
      taxCode: `TAX_GPS_B_${Date.now()}`,
      settings: {
        locations: [
          {
            locationId: 'loc_office_b',
            name: 'Văn phòng Đà Nẵng',
            latitude: 16.0544,
            longitude: 108.2022,
            radiusMeters: 100,
          },
        ],
      },
    });

    // 3. Tạo User trong từng tenant
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      employeeUserA = await User.create({
        companyId: companyA._id,
        employeeCode: 'NV_GPS_01',
        fullName: 'Nguyễn Văn Định Vị',
        email: `gps_emp_a_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
      });
    });

    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      employeeUserB = await User.create({
        companyId: companyB._id,
        employeeCode: 'NV_GPS_02',
        fullName: 'Trần Đà Nẵng',
        email: `gps_emp_b_${Date.now()}@test.com`,
        passwordHash: 'dummy_hash',
        role: ROLES.EMPLOYEE,
      });
    });

    employeeTokenA = generateAuthToken(employeeUserA);
    employeeTokenB = generateAuthToken(employeeUserB);
  });

  afterAll(async () => {
    if (companyA) {
      await AttendanceLog.deleteMany({ companyId: companyA._id });
      await User.deleteMany({ companyId: companyA._id });
      await Company.deleteOne({ _id: companyA._id });
    }
    if (companyB) {
      await AttendanceLog.deleteMany({ companyId: companyB._id });
      await User.deleteMany({ companyId: companyB._id });
      await Company.deleteOne({ _id: companyB._id });
    }
  });

  it('1. Từ chối yêu cầu không có JWT token xác thực (401)', async () => {
    const res = await request(app).post('/api/attendance/gps').send({
      latitude: OFFICE_A_LAT,
      longitude: OFFICE_A_LNG,
      accuracy: 15,
    });

    expect(res.status).toBe(401);
  });

  it('2. Từ chối khi sai số tín hiệu GPS quá lớn (accuracy >= 50m) chống giả mạo / tín hiệu nhiễu', async () => {
    const res = await request(app)
      .post('/api/attendance/gps')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        latitude: OFFICE_A_LAT,
        longitude: OFFICE_A_LNG,
        accuracy: 75.5, // >= 50m
      });

    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/Độ chính xác tín hiệu GPS/i);
    expect(res.body.error || res.body.message).toMatch(/< 50m/i);
  });

  it('3. Từ chối khi nhân viên đứng ngoài bán kính geofence (khoảng cách > 100m)', async () => {
    // Tọa độ cách văn phòng khoảng ~5km (Hồ Gươm 21.0285, 105.8542)
    const res = await request(app)
      .post('/api/attendance/gps')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        latitude: 21.0285,
        longitude: 105.8542,
        accuracy: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/ngoài vùng chấm công cho phép/i);
  });

  it('4. Điểm danh vào ca (CHECK_IN) thành công khi tọa độ trong bán kính Geofence <= 100m', async () => {
    // Tọa độ lệch nhẹ khoảng 20 mét so với văn phòng
    const nearLat = OFFICE_A_LAT + 0.00015;
    const nearLng = OFFICE_A_LNG + 0.00015;

    const res = await request(app)
      .post('/api/attendance/gps')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        latitude: nearLat,
        longitude: nearLng,
        accuracy: 12.5,
        deviceId: 'iphone_15_pro_safari',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.actionType).toBe('CHECK_IN');
    expect(res.body.data.method).toBe(ATTENDANCE_METHODS.GPS);
    expect(res.body.data.matchedLocation.name).toBe('Trụ sở chính Hà Nội');
    expect(res.body.data.matchedLocation.distanceMeters).toBeLessThanOrEqual(OFFICE_RADIUS);

    // Kiểm tra trong CSDL AttendanceLog
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const log = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
        date: todayStr,
      });

      expect(log).toBeDefined();
      expect(log.checkInTime).toBeDefined();
      expect(log.checkOutTime).toBeNull();
      expect(log.method).toBe(ATTENDANCE_METHODS.GPS);
      expect(log.status).toBe(ATTENDANCE_STATUS.VALID);
      expect(log.deviceId).toBe('iphone_15_pro_safari');
      expect(log.location.accuracy).toBe(12.5);
      expect(log.location.distanceMeters).toBeLessThanOrEqual(OFFICE_RADIUS);
    });
  });

  it('5. Điểm danh lần 2 trong ngày tự động chuyển thành hết ca (CHECK_OUT) và tính giờ làm', async () => {
    const nearLat = OFFICE_A_LAT + 0.00005;
    const nearLng = OFFICE_A_LNG + 0.00005;

    const res = await request(app)
      .post('/api/attendance/gps')
      .set('Authorization', `Bearer ${employeeTokenA}`)
      .send({
        latitude: nearLat,
        longitude: nearLng,
        accuracy: 8.0,
        deviceId: 'iphone_15_pro_safari',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.actionType).toBe('CHECK_OUT');
    expect(res.body.data.actionType).toBe('CHECK_OUT');

    // Kiểm tra database có checkOutTime
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const log = await AttendanceLog.findOne({
        companyId: companyA._id,
        userId: employeeUserA._id,
        date: todayStr,
      });

      expect(log.checkInTime).toBeDefined();
      expect(log.checkOutTime).toBeDefined();
      expect(log.workDurationMinutes).toBeGreaterThanOrEqual(0);
    });
  });

  it('6. Lấy trạng thái điểm danh hôm nay của cá nhân (GET /api/attendance/today)', async () => {
    const res = await request(app)
      .get('/api/attendance/today')
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasCheckIn).toBe(true);
    expect(res.body.data.hasCheckOut).toBe(true);
    expect(res.body.data.method).toBe(ATTENDANCE_METHODS.GPS);
  });

  it('7. Lấy lịch sử điểm danh của cá nhân (GET /api/attendance/my-history)', async () => {
    const res = await request(app)
      .get('/api/attendance/my-history')
      .set('Authorization', `Bearer ${employeeTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('8. Cách ly Multi-tenant Fail-Closed: Nhân viên Công ty B không thể check-in vào geofence Công ty A', async () => {
    // Tọa độ công ty A nhưng dùng token của nhân viên công ty B
    const res = await request(app)
      .post('/api/attendance/gps')
      .set('Authorization', `Bearer ${employeeTokenB}`)
      .send({
        latitude: OFFICE_A_LAT,
        longitude: OFFICE_A_LNG,
        accuracy: 10,
      });

    // Công ty B chỉ có văn phòng Đà Nẵng, nên vị trí Hà Nội là ngoài vùng
    expect(res.status).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/ngoài vùng chấm công cho phép/i);
  });
});
