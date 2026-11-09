import express from 'express';
import {
  getJobPostings,
  getPublicJobPostings,
  getPublicLocations,
  createJobPosting,
  applyJob,
  applyJobPublic,
  updateCandidateStatus,
  deleteCandidate,
  toggleJobStatus,
  deleteJobPosting,
} from '../controllers/recruitmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { cvUpload } from '../middleware/cvUpload.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (Ứng viên bên ngoài nộp CV)
// ==========================================
router.get('/public/locations', getPublicLocations);
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

// Xóa ứng viên (CEO, HR_MANAGER)
router.delete('/jobs/:id/candidates/:candidateId', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), deleteCandidate);

// Đổi trạng thái tin tuyển dụng (Đóng / Mở lại tuyển dụng) (CEO, HR_MANAGER)
router.patch('/jobs/:id/status', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), toggleJobStatus);

// Gỡ bỏ / Xóa tin tuyển dụng hoàn toàn (CEO, HR_MANAGER)
router.delete('/jobs/:id', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), deleteJobPosting);

export default router;
