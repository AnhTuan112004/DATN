import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app.js';
import { User, Company, AuditLog } from '../../src/models/index.js';
import { config } from '../../src/config/env.js';

describe('Auth & Multi-tenancy Module (v6.1 FINAL FREEZE)', () => {
  let app;
  let testCompany;
  let testUser;
  const testPassword = 'Password@123';

  beforeAll(async () => {
    // Kết nối CSDL
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodb.uri);
    }
    app = createApp();

    // Tạo test company
    testCompany = await Company.findOneAndUpdate(
      { code: 'TEST_AUTH_CO' },
      {
        $set: {
          name: 'Công ty Test Auth',
          code: 'TEST_AUTH_CO',
          settings: { region: 'I' },
        },
      },
      { upsert: true, new: true }
    );

    // Tạo test user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    testUser = await User.findOneAndUpdate(
      { email: 'test.auth@peopleinsight.vn' },
      {
        $set: {
          companyId: testCompany._id,
          employeeCode: 'TEST001',
          fullName: 'Nguyễn Văn Test',
          email: 'test.auth@peopleinsight.vn',
          passwordHash,
          role: 'EMPLOYEE',
          isActive: true,
          refreshTokens: [],
          salaryConfig: { baseSalary: 15000000 },
        },
      },
      { upsert: true, new: true, skipTenant: true }
    );
  });

  afterAll(async () => {
    // Dọn dẹp test data
    if (testCompany) {
      await User.deleteMany({ companyId: testCompany._id }).setOptions({ skipTenant: true });
      await AuditLog.deleteMany({ companyId: testCompany._id }).setOptions({ skipTenant: true });
      await Company.deleteOne({ _id: testCompany._id });
    }
    await mongoose.connection.close();
  });

  describe('1. Đăng nhập (POST /api/auth/login)', () => {
    it('Đăng nhập thành công với thông tin hợp lệ', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: testPassword,
          deviceId: 'web-test',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('test.auth@peopleinsight.vn');

      // Kiểm tra Projection: Tuyệt đối không để lộ passwordHash, refreshTokens, salaryConfig
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.refreshTokens).toBeUndefined();
      expect(res.body.data.user.salaryConfig).toBeUndefined();

      // Kiểm tra HttpOnly Cookie refreshToken
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/api/auth');
    });

    it('Từ chối khi sai mật khẩu (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: 'WrongPassword@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Từ chối khi email không tồn tại (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@peopleinsight.vn',
          password: testPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Chống Mass Assignment: Chặn request chứa trường lạ ngoài schema Zod .strict() (400)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: testPassword,
          role: 'CEO', // Cố tình tiêm quyền
          maliciousField: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Xoay vòng Refresh Token (POST /api/auth/refresh)', () => {
    let initialRefreshToken;
    let initialAccessToken;

    beforeEach(async () => {
      // Dọn dẹp phiên trước mỗi ca test để đảm bảo tính độc lập
      await User.updateOne(
        { email: 'test.auth@peopleinsight.vn' },
        { $set: { refreshTokens: [] } },
        { skipTenant: true }
      );

      // Đăng nhập để lấy refresh token hợp lệ
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: testPassword,
        });
      initialAccessToken = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      initialRefreshToken = refreshCookie.split(';')[0].split('=')[1];
    });

    it('Refresh thành công: Cấp Access Token mới và xoay vòng Refresh Token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.isGraceWindow).toBe(false);

      // Nhận cookie mới
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const newRefreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      const newRefreshToken = newRefreshCookie.split(';')[0].split('=')[1];
      expect(newRefreshToken).not.toBe(initialRefreshToken);
    });

    it('Grace Window (20s): Cho phép request thứ 2 dùng lại token vừa rotate mà không bị thu hồi', async () => {
      // Lần refresh 1: Xoay vòng token
      const res1 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .send();
      expect(res1.status).toBe(200);

      // Lần refresh 2 ngay lập tức (< 20s) gửi lại initialRefreshToken (giả lập 2 tab trình duyệt cùng refresh)
      const res2 = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .send();

      expect(res2.status).toBe(200);
      expect(res2.body.data.isGraceWindow).toBe(true);
      expect(res2.body.data.accessToken).toBeDefined();
    });

    it('Token Reuse Detection: Attacker dùng lại token cũ sau Grace Window -> Thu hồi toàn bộ phiên (403)', async () => {
      // Lần refresh 1: Xoay vòng
      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .send();

      // Giả lập token đã xoay vòng cách đây 30 giây (vượt Grace Window 20s)
      await User.updateOne(
        { email: 'test.auth@peopleinsight.vn', 'refreshTokens.token': initialRefreshToken },
        { $set: { 'refreshTokens.$.rotatedAt': new Date(Date.now() - 30000) } },
        { skipTenant: true }
      );

      // Attacker thử dùng lại initialRefreshToken
      const attackRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .send();

      expect(attackRes.status).toBe(403);
      expect(attackRes.body.error).toContain('Phát hiện sử dụng lại Refresh Token');

      // Xác minh toàn bộ token trong family đã bị thu hồi khỏi CSDL
      const updatedUser = await User.findOne({ email: 'test.auth@peopleinsight.vn' })
        .select('+refreshTokens')
        .setOptions({ skipTenant: true });
      expect(updatedUser.refreshTokens.length).toBe(0);
    });
  });

  describe('3. Đăng xuất (POST /api/auth/logout)', () => {
    it('Đăng xuất xóa cookie và thu hồi token trong DB', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: testPassword,
        });

      const token = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      const refreshToken = refreshCookie.split(';')[0].split('=')[1];

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .send();

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Xác minh cookie đã được xóa (expires quá khứ hoặc rỗng)
      const logoutCookies = logoutRes.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();

      // Xác minh token đã bị xóa khỏi CSDL
      const userInDb = await User.findOne({ email: 'test.auth@peopleinsight.vn' })
        .select('+refreshTokens')
        .setOptions({ skipTenant: true });
      const found = userInDb.refreshTokens.find((t) => t.token === refreshToken);
      expect(found).toBeUndefined();
    });
  });

  describe('4. Xác thực & Thông tin tài khoản (GET /api/auth/me)', () => {
    it('Lấy thông tin tài khoản thành công khi có Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.auth@peopleinsight.vn',
          password: testPassword,
        });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test.auth@peopleinsight.vn');
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.refreshTokens).toBeUndefined();
      expect(res.body.data.salaryConfig).toBeUndefined();
    });

    it('Từ chối khi không có token (401)', async () => {
      const res = await request(app).get('/api/auth/me').send();
      expect(res.status).toBe(401);
    });
  });

  describe('5. Ràng buộc Kiến trúc v6.1: CẤM gọi .save() trên User', () => {
    it('Chặn gọi .save() khi update User (ném FORBIDDEN_OPERATION)', async () => {
      const user = await User.findOne({ email: 'test.auth@peopleinsight.vn' }).setOptions({ skipTenant: true });
      user.fullName = 'Tên Đổi Trái Phép';

      await expect(user.save()).rejects.toThrow('FORBIDDEN_OPERATION');
    });
  });
});
