import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { aiChatLimiter } from '../middleware/rateLimiter.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Bắt buộc xác thực JWT cho mọi endpoint AI
router.use(authenticate);

// POST /api/ai/chat — Chatbot HR AI (Phương án A - Ép Function Calling)
router.post('/chat', aiChatLimiter, aiController.sendChatMessage);

// POST /api/ai/analyze-document — Phân tích, tóm tắt file Word (.docx), Excel (.xlsx) bằng Gemini AI
router.post('/analyze-document', upload.single('file'), aiController.analyzeDocument);

export default router;
