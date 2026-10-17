import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../../src/middleware/rateLimiter.js';

describe('Rate Limiter Module (Sliding Window — v6.1 FINAL FREEZE)', () => {
  let app;
  let testLimiter;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Cấu hình limiter thử nghiệm: Tối đa 3 requests trong 1000ms
    testLimiter = createRateLimiter({
      windowMs: 1000,
      max: 3,
      message: 'Vượt quá số lần gọi cho phép',
    });

    app.get('/test-limit', testLimiter, (req, res) => {
      res.json({ success: true, message: 'OK' });
    });
  });

  afterEach(() => {
    if (testLimiter) {
      testLimiter.resetAll();
    }
  });

  it('Cho phép các request trong giới hạn max = 3', async () => {
    for (let i = 1; i <= 3; i++) {
      const res = await request(app).get('/test-limit');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['x-ratelimit-limit']).toBe('3');
      expect(res.headers['x-ratelimit-remaining']).toBe(String(3 - i));
    }
  });

  it('Chặn và trả về 429 Too Many Requests khi vượt quá max = 3', async () => {
    // 3 request đầu thành công
    for (let i = 0; i < 3; i++) {
      await request(app).get('/test-limit');
    }

    // Request thứ 4 -> Bị chặn với 429
    const blockedRes = await request(app).get('/test-limit');
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.error).toContain('Vượt quá số lần gọi');
    expect(blockedRes.body.retryAfter).toBeGreaterThanOrEqual(1);

    // Kiểm tra các headers chuẩn
    expect(blockedRes.headers['retry-after']).toBeDefined();
    expect(blockedRes.headers['x-ratelimit-remaining']).toBe('0');
  });

  it('Khôi phục cho phép sau khi sliding window hết hạn', async () => {
    // Gọi hết quota 3 lần
    for (let i = 0; i < 3; i++) {
      await request(app).get('/test-limit');
    }

    const blockedRes = await request(app).get('/test-limit');
    expect(blockedRes.status).toBe(429);

    // Chờ 1100ms để sliding window trôi qua
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Request mới sau khi hết hạn -> Được chấp thuận
    const allowedRes = await request(app).get('/test-limit');
    expect(allowedRes.status).toBe(200);
    expect(allowedRes.body.success).toBe(true);
  });
});
