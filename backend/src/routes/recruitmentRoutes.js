import express from 'express';
import {
  getJobPostings,
  createJobPosting,
  applyJob,
  updateCandidateStatus,
} from '../controllers/recruitmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Lấy danh sách tin tuyển dụng
router.get('/jobs', getJobPostings);

// Tạo tin tuyển dụng (CEO, HR_MANAGER)
router.post('/jobs', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), createJobPosting);

// Nộp hồ sơ ứng tuyển
router.post('/jobs/:id/apply', applyJob);

// Đổi trạng thái ứng viên (CEO, HR_MANAGER)
router.patch('/jobs/:id/candidates/:candidateId/status', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), updateCandidateStatus);

export default router;
