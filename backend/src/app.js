import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';

import { generalLimiter } from './middleware/rateLimiter.js';

export const createApp = () => {
  const app = express();

  // Security Middlewares
  app.use(helmet());
  app.use(cors({
    origin: [config.clientUrl, `https://${config.apexDomain}`],
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

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(`[Global Error] ${err.message}`, err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(config.env === 'development' ? { stack: err.stack } : {}),
    });
  });

  return app;
};
