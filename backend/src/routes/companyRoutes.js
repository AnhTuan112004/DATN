import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';
import {
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
  seedDefenseLocation,
} from '../controllers/companyController.js';

const router = express.Router();

// Yêu cầu xác thực tài khoản & tenant fail-closed
router.use(authenticate);

// Xem danh sách địa điểm (Tất cả nhân viên để phục vụ chấm công GPS Geofencing)
router.get('/locations', getLocations);

// Quản trị địa điểm GPS (Chỉ CEO & HR Manager)
router.post('/locations', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), addLocation);
router.patch('/locations/:locationId', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), updateLocation);
router.delete('/locations/:locationId', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), deleteLocation);

// Nạp nhanh địa điểm «Phòng Bảo vệ ĐATN»
router.post('/locations/seed-defense-room', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), seedDefenseLocation);

export default router;
