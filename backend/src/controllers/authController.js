import { loginSchema, refreshTokenSchema } from '../validations/authValidation.js';
import * as authService from '../services/authService.js';
import { config } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
});

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({
      ...validatedData,
      ip,
      userAgent,
    });

    // Set Refresh Token vào Cookie HttpOnly
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const validatedBody = refreshTokenSchema.parse(req.body || {});
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    const rawRefreshToken = tokenFromCookie || validatedBody.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token không được tìm thấy',
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.rotateRefreshToken({
      refreshToken: rawRefreshToken,
      deviceId: validatedBody.deviceId,
      ip,
      userAgent,
    });

    // Nếu không phải grace window, set cookie refresh token mới
    if (!result.isGraceWindow) {
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());
    }

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        isGraceWindow: result.isGraceWindow,
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
    const rawRefreshToken = tokenFromCookie || req.body?.refreshToken;
    const userId = req.user?.id;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await authService.logout({
      userId,
      refreshToken: rawRefreshToken,
      ip,
      userAgent,
    });

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id, req.user.companyId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
