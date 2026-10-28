import express from 'express';
import {
  getJobPostings,
  getPublicJobPostings,
  createJobPosting,
  applyJob,
  applyJobPublic,
  updateCandidateStatus,
} from '../controllers/recruitmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { cvUpload } from '../middleware/cvUpload.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (Ứng viên bên ngoài nộp CV)
// ==========================================
router.get('/public/jobs', getPublicJobPostings);
router.post('/public/jobs/:id/apply', cvUpload.single('cvFile'), applyJobPublic);

// ==========================================
// 2. PROTECTED ROUTES (Yêu cầu đăng nhập nội bộ)
// ==========================================
router.use(authenticate);

// Lấy danh sách tin tuyển dụng nội bộ
router.get('/jobs', getJobPostings);

// Tạo tin tuyển dụng (CEO, HR_MANAGER)
router.post('/jobs', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), createJobPosting);

// Nộp hồ sơ ứng tuyển nội bộ
router.post('/jobs/:id/apply', applyJob);

// Đổi trạng thái ứng viên & Lên lịch gửi email phỏng vấn (CEO, HR_MANAGER)
router.patch('/jobs/:id/candidates/:candidateId/status', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), updateCandidateStatus);

export default router;
