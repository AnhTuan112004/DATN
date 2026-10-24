import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import * as payrollController from '../controllers/payrollController.js';

const router = express.Router();

// Yêu cầu xác thực JWT cho mọi endpoint tính lương
router.use(authenticate);

// Chạy tính lương toàn công ty (Chỉ CEO và HR Manager)
router.post(
  '/calculate',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  payrollController.calculatePayroll
);

// Khóa kỳ lương nguyên tử (Chỉ CEO và HR Manager)
router.post(
  '/lock',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  payrollController.lockPayroll
);

// Xem phiếu lương của chính mình (Mọi nhân sự)
router.get(
  '/me/:period',
  payrollController.getMyPayslip
);

// Xem phiếu lương của người khác (IDOR guard: chặn Manager và Employee, ghi AuditLog đối với HR/CEO)
router.get(
  '/user/:userId/:period',
  payrollController.getUserPayslip
);

// Xem bảng lương tổng hợp toàn công ty theo kỳ (Chỉ CEO và HR Manager)
router.get(
  '/period/:period',
  requireRoles(ROLES.CEO, ROLES.HR_MANAGER),
  payrollController.getCompanyPayrolls
);

export default router;
