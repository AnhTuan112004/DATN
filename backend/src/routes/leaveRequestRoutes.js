import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import {
  createLeaveRequest,
  approveStage1,
  approveStage2,
  cancelLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  uploadAttachment,
} from '../controllers/leaveRequestController.js';
import { documentUpload } from '../middleware/documentUpload.js';

const router = express.Router();

// Tất cả endpoints đều yêu cầu đăng nhập & inject Tenant context
router.use(authenticate);

// 0. Tải lên tệp văn bản Word/PDF đính kèm đơn
router.post('/upload-attachment', documentUpload.single('document'), uploadAttachment);

// 1. Nộp đơn từ (áp dụng cho mọi nhân viên)
router.post('/', createLeaveRequest);

// 2. Lấy danh sách đơn từ (có phân trang, bộ lọc và phân quyền theo vai trò)
router.get('/', getLeaveRequests);

// 3. Lấy chi tiết đơn từ theo ID
router.get('/:id', getLeaveRequestById);

// 4. Phê duyệt Cấp 1 (Chỉ Manager, HR Manager, CEO)
router.post(
  '/:id/approve-manager',
  requireRoles(ROLES.MANAGER, ROLES.HR_MANAGER, ROLES.CEO),
  approveStage1
);

// 5. Phê duyệt Cấp 2 (Chỉ HR Manager & CEO)
router.post(
  '/:id/approve-hr',
  requireRoles(ROLES.HR_MANAGER, ROLES.CEO),
  approveStage2
);

// 6. Hủy đơn (Người nộp hoặc HR Manager / CEO)
router.post('/:id/cancel', cancelLeaveRequest);

export default router;
