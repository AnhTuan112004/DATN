import express from 'express';
import { searchPolicies, createPolicy } from '../controllers/policyController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Tra cứu nội quy (Tất cả nhân sự)
router.get('/search', searchPolicies);

// Thêm điều khoản nội quy mới (CEO, HR_MANAGER)
router.post('/', requireRoles(ROLES.CEO, ROLES.HR_MANAGER), createPolicy);

export default router;
