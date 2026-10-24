import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { io as ClientIO } from 'socket.io-client';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { ROLES } from '../../src/config/constants.js';
import { Company, User, Notification } from '../../src/models/index.js';
import { tenantStore } from '../../src/plugins/tenantPlugin.js';
import { initSocketServer, getIO, emitToUser, emitToTenant } from '../../src/socket.js';
import { createAndSendNotification } from '../../src/services/notificationService.js';

describe('Phân hệ Thông báo Thời gian thực (Socket.io & notifications)', () => {
  let app;
  let httpServer;
  let serverPort;
  let companyA, companyB;
  let userA1, userA2, userB1;
  let tokenA1, tokenA2, tokenB1;

  const TS = Date.now();

  const generateToken = (user) => {
    return jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId.toString(),
        role: user.role,
        fullName: user.fullName,
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
    httpServer = createServer(app);
    initSocketServer(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        serverPort = httpServer.address().port;
        resolve();
      });
    });

    // Tạo 2 Companies để kiểm tra cách ly Multi-tenant
    companyA = await Company.create({
      name: `Công Ty Notif Test A ${TS}`,
      code: `COMP_NOTIF_A_${TS}`,
      settings: { region: 'I' },
    });

    companyB = await Company.create({
      name: `Công Ty Notif Test B ${TS}`,
      code: `COMP_NOTIF_B_${TS}`,
      settings: { region: 'I' },
    });

    // Tạo Users trong Company A
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      userA1 = await User.create({
        companyId: companyA._id,
        email: `usera1_${TS}@notiftest.vn`,
        employeeCode: `EMPA1_${TS}`,
        fullName: 'Nguyễn Văn A1',
        passwordHash: 'hash_secret',
        role: ROLES.EMPLOYEE,
        status: 'ACTIVE',
      });

      userA2 = await User.create({
        companyId: companyA._id,
        email: `usera2_${TS}@notiftest.vn`,
        employeeCode: `EMPA2_${TS}`,
        fullName: 'Trần Thị A2 Manager',
        passwordHash: 'hash_secret',
        role: ROLES.MANAGER,
        status: 'ACTIVE',
      });
    });

    // Tạo User trong Company B
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      userB1 = await User.create({
        companyId: companyB._id,
        email: `userb1_${TS}@notiftest.vn`,
        employeeCode: `EMPB1_${TS}`,
        fullName: 'Lê Văn B1',
        passwordHash: 'hash_secret',
        role: ROLES.EMPLOYEE,
        status: 'ACTIVE',
      });
    });

    tokenA1 = generateToken(userA1);
    tokenA2 = generateToken(userA2);
    tokenB1 = generateToken(userB1);
  });

  afterAll(async () => {
    const io = getIO();
    if (io) {
      await new Promise((resolve) => io.close(resolve));
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    // Dọn dẹp dữ liệu test
    await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
      await Notification.deleteMany({ companyId: companyA._id });
      await User.deleteMany({ companyId: companyA._id });
    });
    await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
      await Notification.deleteMany({ companyId: companyB._id });
      await User.deleteMany({ companyId: companyB._id });
    });
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });
  });

  describe('1. API REST /api/notifications', () => {
    let testNotif1, testNotif2;

    beforeEach(async () => {
      // Dọn thông báo cũ
      await tenantStore.run({ companyId: companyA._id.toString() }, async () => {
        await Notification.deleteMany({ companyId: companyA._id });
        testNotif1 = await Notification.create({
          companyId: companyA._id,
          userId: userA1._id,
          title: 'Đơn nghỉ phép được duyệt',
          message: 'Quản lý đã duyệt đơn nghỉ phép của bạn.',
          type: 'LEAVE_REQUEST',
          isRead: false,
        });

        testNotif2 = await Notification.create({
          companyId: companyA._id,
          userId: userA1._id,
          title: 'Cảnh báo chấm công',
          message: 'Bạn chưa check-out ngày hôm qua.',
          type: 'ATTENDANCE_ALERT',
          isRead: true,
        });
      });

      // Tạo 1 thông báo cho user B1 ở công ty B
      await tenantStore.run({ companyId: companyB._id.toString() }, async () => {
        await Notification.deleteMany({ companyId: companyB._id });
        await Notification.create({
          companyId: companyB._id,
          userId: userB1._id,
          title: 'Thông báo công ty B',
          message: 'Nội dung mật công ty B',
          type: 'SYSTEM',
          isRead: false,
        });
      });
    });

    it('1.1 Lấy danh sách thông báo của User A1 kèm unreadCount và pagination', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.unreadCount).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('1.2 Lọc thông báo chưa đọc (isRead=false)', async () => {
      const res = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Đơn nghỉ phép được duyệt');
    });

    it('1.3 Lấy số lượng thông báo chưa đọc qua /unread-count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('1.4 Cách ly Fail-Closed: User A1 không thể thấy thông báo của User B1 ở Công ty B', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.map((n) => n.title);
      expect(titles).not.toContain('Thông báo công ty B');
    });

    it('1.5 Cách ly cùng Tenant: User A2 (Manager) không thấy thông báo riêng của User A1', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.unreadCount).toBe(0);
    });

    it('1.6 Đánh dấu 1 thông báo là đã đọc (/api/notifications/:id/read)', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotif1._id}/read`)
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.unreadCount).toBe(0);
    });

    it('1.7 Chặn đánh dấu đọc IDOR: User A2 không thể sửa thông báo của User A1', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${testNotif1._id}/read`)
        .set('Authorization', `Bearer ${tokenA2}`);

      expect(res.status).toBe(404);
    });

    it('1.8 Đánh dấu tất cả là đã đọc (/api/notifications/read-all)', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(0);

      // Kiểm tra lại unread-count
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA1}`);
      expect(countRes.body.count).toBe(0);
    });

    it('1.9 Xóa thông báo (/api/notifications/:id)', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${testNotif2._id}`)
        .set('Authorization', `Bearer ${tokenA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA1}`);
      expect(listRes.body.data.length).toBe(1);
    });
  });

  describe('2. Socket.IO & Real-time Delivery', () => {
    let clientSocketA1;
    let clientSocketB1;

    afterEach(() => {
      if (clientSocketA1?.connected) clientSocketA1.disconnect();
      if (clientSocketB1?.connected) clientSocketB1.disconnect();
    });

    it('2.1 Kết nối Socket.IO thành công khi có JWT token hợp lệ', (done) => {
      clientSocketA1 = ClientIO(`http://localhost:${serverPort}`, {
        auth: { token: tokenA1 },
        transports: ['websocket'],
      });

      clientSocketA1.on('connect', () => {
        expect(clientSocketA1.connected).toBe(true);
        clientSocketA1.emit('client_ping', {}, (res) => {
          expect(res.status).toBe('ok');
          done();
        });
      });

      clientSocketA1.on('connect_error', (err) => {
        done(err);
      });
    });

    it('2.2 Từ chối kết nối Socket.IO nếu thiếu JWT token', (done) => {
      const socketNoAuth = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      socketNoAuth.on('connect_error', (err) => {
        expect(err.message).toContain('AUTHENTICATION_ERROR');
        socketNoAuth.disconnect();
        done();
      });
    });

    it('2.3 Nhận thông báo real-time qua sự kiện "notification" khi createAndSendNotification được gọi', (done) => {
      clientSocketA1 = ClientIO(`http://localhost:${serverPort}`, {
        auth: { token: tokenA1 },
        transports: ['websocket'],
      });

      clientSocketA1.on('connect', async () => {
        // Lắng nghe sự kiện notification
        clientSocketA1.on('notification', (notif) => {
          expect(notif.title).toBe('Thông báo Realtime Test');
          expect(notif.message).toBe('Tin nhắn kiểm thử Socket.io');
          expect(notif.type).toBe('LEAVE_REQUEST');
          done();
        });

        // Trigger tạo thông báo
        await createAndSendNotification({
          companyId: companyA._id,
          userId: userA1._id,
          title: 'Thông báo Realtime Test',
          message: 'Tin nhắn kiểm thử Socket.io',
          type: 'LEAVE_REQUEST',
          data: { testKey: '123' },
        });
      });
    });

    it('2.4 Cách ly Real-time Tenant: User B1 (công ty B) không nhận được notification của User A1 (công ty A)', (done) => {
      let b1Received = false;

      clientSocketB1 = ClientIO(`http://localhost:${serverPort}`, {
        auth: { token: tokenB1 },
        transports: ['websocket'],
      });

      clientSocketB1.on('connect', async () => {
        clientSocketB1.on('notification', () => {
          b1Received = true;
        });

        // Gửi thông báo cho A1
        await createAndSendNotification({
          companyId: companyA._id,
          userId: userA1._id,
          title: 'Thông báo chỉ cho A1',
          message: 'Tuyệt mật công ty A',
        });

        // Chờ 300ms xác nhận B1 không nhận được
        setTimeout(() => {
          expect(b1Received).toBe(false);
          done();
        }, 300);
      });
    });
  });
});
