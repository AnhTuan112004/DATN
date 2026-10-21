import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES } from '../../src/config/constants.js';
import { Company, User, AuditLog } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';

describe('Admin Cấu hình GPS Geofencing (companies.settings.locations)', () => {
  let app;
  let companyId;
  let ceoToken;
  let employeeToken;

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

    // Tìm hoặc tạo Company test
    let company = await Company.findOne({ code: 'COMP_GPS_TEST' });
    if (!company) {
      company = await Company.create({
        name: 'Công Ty Test GPS Geofencing',
        code: 'COMP_GPS_TEST',
        settings: {
          region: 'I',
          locations: [
            {
              locationId: 'loc_hq',
              name: 'Trụ sở chính Landmark 72',
              latitude: 21.0169,
              longitude: 105.7839,
              radiusMeters: 100,
            },
          ],
        },
      });
    }
    companyId = company._id;

    // Tạo CEO và Employee user
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      let ceo = await User.findOne({ email: 'ceo.gps@test.com' });
      if (!ceo) {
        ceo = await User.create({
          companyId,
          employeeCode: 'NV9901',
          fullName: 'CEO GPS Test',
          email: 'ceo.gps@test.com',
          passwordHash: 'hash_secret',
          role: ROLES.CEO,
        });
      }
      ceoToken = generateAuthToken(ceo);

      let emp = await User.findOne({ email: 'emp.gps@test.com' });
      if (!emp) {
        emp = await User.create({
          companyId,
          employeeCode: 'NV9902',
          fullName: 'Employee GPS Test',
          email: 'emp.gps@test.com',
          passwordHash: 'hash_secret',
          role: ROLES.EMPLOYEE,
        });
      }
      employeeToken = generateAuthToken(emp);
    });
  });

  afterAll(async () => {
    await Company.deleteOne({ _id: companyId });
    await User.deleteMany({ companyId });
    await AuditLog.deleteMany({ companyId });
    await mongoose.connection.close();
  });

  it('1. GET /api/companies/locations - Lấy danh sách địa điểm thành công', async () => {
    const res = await request(app)
      .get('/api/companies/locations')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].locationId).toBe('loc_hq');
  });

  it('2. POST /api/companies/locations - Nhân viên thường bị chặn 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/companies/locations')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        name: 'Chi nhánh Hà Đông',
        latitude: 20.9712,
        longitude: 105.7725,
        radiusMeters: 150,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. POST /api/companies/locations - CEO thêm địa điểm mới và ghi nhận AuditLog', async () => {
    const res = await request(app)
      .post('/api/companies/locations')
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({
        locationId: 'loc_hadong',
        name: 'Văn phòng Chi nhánh Hà Đông',
        latitude: 20.9712,
        longitude: 105.7725,
        radiusMeters: 150,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locationId).toBe('loc_hadong');
    expect(res.body.data.name).toBe('Văn phòng Chi nhánh Hà Đông');

    // Kiểm tra AuditLog với Tenant Context
    let audit;
    await tenantStore.run({ companyId: companyId.toString() }, async () => {
      audit = await AuditLog.findOne({
        'details.operation': 'ADD_GPS_LOCATION',
      });
    });
    expect(audit).toBeTruthy();
  });

  it('4. PATCH /api/companies/locations/:locationId - Cập nhật bán kính và tọa độ', async () => {
    const res = await request(app)
      .patch('/api/companies/locations/loc_hadong')
      .set('Authorization', `Bearer ${ceoToken}`)
      .send({
        radiusMeters: 200,
        name: 'Chi nhánh Hà Đông (Mở rộng)',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.radiusMeters).toBe(200);
    expect(res.body.data.name).toBe('Chi nhánh Hà Đông (Mở rộng)');
  });

  it('5. POST /api/companies/locations/seed-defense-room - Nạp địa điểm «Phòng Bảo vệ ĐATN»', async () => {
    const res = await request(app)
      .post('/api/companies/locations/seed-defense-room')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.locationId).toBe('loc_demo');
    expect(res.body.data.name).toContain('Phòng Bảo vệ ĐATN');
    expect(res.body.data.radiusMeters).toBe(50);
  });

  it('6. DELETE /api/companies/locations/:locationId - Xóa địa điểm GPS', async () => {
    const res = await request(app)
      .delete('/api/companies/locations/loc_hadong')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Xác nhận đã biến mất khỏi danh sách
    const listRes = await request(app)
      .get('/api/companies/locations')
      .set('Authorization', `Bearer ${ceoToken}`);

    expect(listRes.body.data.some((l) => l.locationId === 'loc_hadong')).toBe(false);
  });
});
