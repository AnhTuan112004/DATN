/**
 * ROUTES PHÂN TÍCH NHÂN SỰ & DỰ BÁO THÔI VIỆC (ANALYTICS ROUTES)
 * Phân quyền: Chỉ CEO và HR_MANAGER được phép xem thông tin dự báo
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import {
  getAttritionRiskOverview,
  getEmployeeAttritionRisk,
} from '../controllers/analyticsController.js';

const router = Router();

// Toàn bộ các endpoint phân tích thôi việc đều yêu cầu đăng nhập và chỉ cấp cho CEO / HR Manager
router.use(authenticate);
router.use(requireRoles(ROLES.CEO, ROLES.HR_MANAGER));

// 1. Lấy tổng quan phân tích nguy cơ thôi việc toàn công ty
router.get('/attrition-risk', getAttritionRiskOverview);

// 2. Lấy chi tiết phân tích nguy cơ thôi việc của một nhân viên cụ thể
router.get('/attrition-risk/:targetUserId', getEmployeeAttritionRisk);

export default router;
