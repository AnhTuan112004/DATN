import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import {
  getDepartmentTree,
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';

const router = express.Router();

// Tất cả endpoints đều cần đăng nhập & thiết lập Tenant context
router.use(authenticate);

// Xem sơ đồ tổ chức & danh sách phòng ban
router.get('/', getDepartmentTree);
router.get('/list', getAllDepartments);
router.get('/:id', getDepartmentById);

// Thao tác quản trị phòng ban (Chỉ CEO & HR Manager)
router.post('/', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), createDepartment);
router.patch('/:id', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), updateDepartment);

// Xóa phòng ban (Chỉ CEO)
router.delete('/:id', requireRoles(ROLES.CEO), deleteDepartment);

export default router;
