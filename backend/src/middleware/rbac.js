import { ROLES } from '../config/constants.js';

const ROLE_HIERARCHY = {
  [ROLES.CEO]: 4,
  [ROLES.HR_MANAGER]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.EMPLOYEE]: 1,
};

/**
 * Authorize users based on exact roles
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User context missing' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Authorize users based on minimum role hierarchy level
 */
export const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 99;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Minimum role ${minRole} required`,
      });
    }

    next();
  };
};
