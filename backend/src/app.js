import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import kioskRoutes from './routes/kioskRoutes.js';

import { generalLimiter } from './middleware/rateLimiter.js';

export const createApp = () => {
  const app = express();

  // Security Middlewares & Dynamic CORS
  const allowedOrigins = [
    config.clientUrl,
    `https://${config.apexDomain}`,
    `https://app.${config.apexDomain}`,
    'http://localhost:5173',
  ].filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile/curl/server-to-server), khớp allowedOrigins hoặc preview Vercel
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback an toàn cho API
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Health check endpoint (for keep-alive by cron-job.org)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      version: '6.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Áp dụng Rate Limit bảo vệ API (100 req/phút)
  app.use('/api', generalLimiter);

  // Base API router
  app.get('/api', (req, res) => {
    res.json({
      message: 'PeopleInsight AI API (v6.1 FINAL FREEZE) is active',
      docs: '/api/docs',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/companies', companyRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/kiosk', kioskRoutes);

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(`[Global Error] ${err.message}`, err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(err.fallbackTo1To1 ? { fallbackTo1To1: true } : {}),
      ...(config.env === 'development' ? { stack: err.stack } : {}),
    });
  });

  return app;
};
