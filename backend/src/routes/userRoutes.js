import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize, requireRoles, RESOURCES, ACTIONS } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import { uploadAvatarMiddleware } from '../middleware/upload.js';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  getUserSalary,
  updateUserSalary,
  addContract,
  deleteUser,
  uploadAvatar,
} from '../controllers/userController.js';
import {
  getFaceStatusHandler,
  enrollFaceHandler,
  revokeFaceConsentHandler,
} from '../controllers/faceEnrollmentController.js';

const router = express.Router();

// Tất cả endpoints đều cần đăng nhập & xác định Tenant context fail-closed
router.use(authenticate);

// Danh sách nhân sự (Projection an toàn tuyệt đối, phân trang, lọc)
router.get('/', getUsers);

// Chi tiết nhân sự theo ID
router.get(
  '/:id',
  authorize(RESOURCES.USER, ACTIONS.READ, (req) => ({
    targetUserId: req.params.id,
    companyId: req.user.companyId,
  })),
  getUserById
);

// Tạo nhân viên mới (Chỉ CEO & HR Manager)
router.post('/', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), createUser);

// Cập nhật thông tin nhân viên
router.patch(
  '/:id',
  authorize(RESOURCES.USER, ACTIONS.UPDATE, (req) => ({
    targetUserId: req.params.id,
    companyId: req.user.companyId,
    isSelfBasicUpdate: (req.user.userId || req.user.id).toString() === req.params.id,
  })),
  updateUser
);

// Upload ảnh đại diện Cloudinary (tối đa 2MB, định dạng an toàn JPG/PNG/WEBP)
router.post(
  '/:id/avatar',
  authorize(RESOURCES.USER, ACTIONS.UPDATE, (req) => ({
    targetUserId: req.params.id,
    companyId: req.user.companyId,
    isSelfBasicUpdate: (req.user.userId || req.user.id).toString() === req.params.id,
  })),
  uploadAvatarMiddleware,
  uploadAvatar
);

// Thay đổi vai trò (Role) - Endpoint quản trị riêng, tuyệt đối cấm đổi role qua PATCH /:id chung
router.patch('/:id/role', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), updateUserRole);

// Xem cấu hình lương - Endpoint quản trị riêng (Manager cấm xem, tự xem được, CEO/HR xem có ghi AuditLog)
router.get(
  '/:id/salary',
  authorize(RESOURCES.SALARY, ACTIONS.READ, (req) => ({
    targetUserId: req.params.id,
    companyId: req.user.companyId,
  })),
  getUserSalary
);

// Cập nhật cấu hình lương - Endpoint quản trị riêng
router.patch(
  '/:id/salary',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  updateUserSalary
);

// Thêm hợp đồng lao động mới
router.post(
  '/:id/contracts',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  addContract
);

// Vô hiệu hóa / Xóa mềm nhân viên (Chỉ CEO)
router.delete('/:id', requireRoles(ROLES.CEO), deleteUser);

// --- CÁC ENDPOINT SINH TRẮC HỌC & LUẬT BVDLCN 91/2025/QH15 ---
// 1. Kiểm tra trạng thái đăng ký FaceID & thông tin đồng ý (Projection an toàn)
router.get('/:id/face-status', getFaceStatusHandler);

// 2. Lấy mẫu khuôn mặt trực tiếp có HR giám sát tại văn phòng (Chỉ CEO & HR Manager)
router.post(
  '/:id/face-enrollment',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  enrollFaceHandler
);

// 3. Rút lại sự đồng ý & Xóa vĩnh viễn dữ liệu sinh trắc học theo Khoản 2 Điều 14 Luật BVDLCN
router.delete('/:id/face-template', revokeFaceConsentHandler);

export default router;
