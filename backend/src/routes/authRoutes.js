import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Endpoint công khai có giới hạn chống Brute-force (tối đa 5 lần / 15 phút)
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);

// Endpoint đăng xuất (hỗ trợ cả có token và đã hết hạn access token)
router.post('/logout', optionalAuthenticate, authController.logout);

// Endpoint thông tin tài khoản hiện tại (yêu cầu Access Token)
router.get('/me', authenticate, authController.getMe);

export default router;
