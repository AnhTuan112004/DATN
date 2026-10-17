/**
 * In-memory Sliding Window Rate Limiter
 * Bảo vệ API khỏi Brute-force, DoS và lạm dụng tài nguyên theo chuẩn v6.1 FINAL FREEZE
 */

export const createRateLimiter = ({
  windowMs = 60 * 1000, // 1 phút
  max = 100, // Số request tối đa trong cửa sổ
  message = 'Quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau.',
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
  skip = () => false,
} = {}) => {
  const store = new Map();

  // Dọn dẹp định kỳ bộ nhớ RAM
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, records] of store.entries()) {
      const validRecords = records.filter((timestamp) => now - timestamp < windowMs);
      if (validRecords.length === 0) {
        store.delete(key);
      } else {
        store.set(key, validRecords);
      }
    }
  }, Math.min(windowMs, 60000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  const limiter = (req, res, next) => {
    if (skip(req)) return next();

    const key = keyGenerator(req);
    const now = Date.now();
    const timestamps = store.get(key) || [];

    // Lọc lại các timestamp nằm trong cửa sổ trượt (sliding window)
    const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (recentTimestamps.length >= max) {
      const oldestTimestamp = recentTimestamps[0];
      const resetTimeMs = oldestTimestamp + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(resetTimeMs / 1000));

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldestTimestamp + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSeconds,
      });
    }

    recentTimestamps.push(now);
    store.set(key, recentTimestamps);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recentTimestamps.length));
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

    next();
  };

  limiter.resetKey = (key) => store.delete(key);
  limiter.resetAll = () => store.clear();

  return limiter;
};

/**
 * 1. Auth Rate Limiter (Chống Brute-force mật khẩu):
 * Cho phép tối đa 5 lần thử đăng nhập trong 15 phút theo cặp IP + Email
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần
  keyGenerator: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const email = (req.body?.email || '').trim().toLowerCase();
    return `auth_${ip}_${email}`;
  },
  message: 'Bạn đã thử đăng nhập thất bại quá nhiều lần (tối đa 5 lần/15 phút). Vui lòng thử lại sau.',
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-enable-rate-limit-test'],
});

/**
 * 2. General API Rate Limiter (Toàn hệ thống):
 * Tối đa 100 requests / 1 phút per IP
 */
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Hệ thống đang nhận quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-enable-rate-limit-test'],
});

/**
 * 3. AI Chatbot Rate Limiter (Bảo vệ Gemini Quota):
 * Tối đa 10 requests / 1 phút per User ID
 */
export const aiChatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `ai_${req.user?.id || req.ip}`,
  message: 'Bạn đang đặt câu hỏi quá nhanh. Vui lòng đợi trong giây lát.',
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-enable-rate-limit-test'],
});

/**
 * 4. Kiosk Challenge Rate Limiter (Chống Spam FaceID Check-in):
 * Tối đa 30 requests / 1 phút per Kiosk Device Token
 */
export const kioskLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.headers['x-kiosk-token'] || req.ip,
  message: 'Thiết bị Kiosk đang gửi quá nhiều yêu cầu xác thực. Vui lòng đợi trong giây lát.',
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-enable-rate-limit-test'],
});
