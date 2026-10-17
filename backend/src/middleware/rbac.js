import { ROLES, AUDIT_ACTIONS } from '../config/constants.js';
import { AuditLog } from '../models/AuditLog.js';

export const RESOURCES = {
  USER: 'USER',
  SALARY: 'SALARY',
  ATTENDANCE: 'ATTENDANCE',
  LEAVE_REQUEST: 'LEAVE_REQUEST',
  PAYROLL: 'PAYROLL',
  RETENTION: 'RETENTION',
  AUDIT_LOG: 'AUDIT_LOG',
};

export const ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE_STAGE_1: 'APPROVE_STAGE_1',
  APPROVE_STAGE_2: 'APPROVE_STAGE_2',
  LOCK: 'LOCK',
};

const ROLE_HIERARCHY = {
  [ROLES.CEO]: 4,
  [ROLES.HR_MANAGER]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.EMPLOYEE]: 1,
};

/**
 * Hàm phân quyền tập trung canAccess(user, resource, action, context)
 * Tuân thủ tuyệt đối quy tắc Hiến pháp v6.1 FINAL FREEZE
 */
export const canAccess = (user, resource, action, context = {}) => {
  if (!user || !user.role) return false;

  const role = user.role;
  const currentUserId = (user.userId || user.id || '').toString();
  const targetUserId = (context.targetUserId || '').toString();

  // Kiểm tra cách ly Tenant (Fail-Closed)
  if (context.companyId && user.companyId) {
    if (context.companyId.toString() !== user.companyId.toString()) {
      return false;
    }
  }

  // =========================================================================
  // 1. TÀI NGUYÊN SALARY / LƯƠNG BỔNG (BẢO VỆ TỐI MẬT)
  // =========================================================================
  if (resource === RESOURCES.SALARY) {
    if (action === ACTIONS.READ) {
      // Bản thân luôn được xem lương của chính mình
      if (targetUserId && targetUserId === currentUserId) {
        return true;
      }
      // QUY TẮC BẤT BIẾN: Quản lý (MANAGER) TUYỆT ĐỐI KHÔNG ĐƯỢC XEM LƯƠNG NHÂN VIÊN
      if (role === ROLES.MANAGER) {
        return false;
      }
      // Nhân viên không được xem lương người khác
      if (role === ROLES.EMPLOYEE) {
        return false;
      }
      // CEO và HR Manager được xem lương người khác
      if (role === ROLES.CEO || role === ROLES.HR_MANAGER) {
        return true;
      }
      return false;
    }

    if (action === ACTIONS.UPDATE) {
      // Chỉ HR Manager và CEO mới được cập nhật salaryConfig
      return role === ROLES.HR_MANAGER || role === ROLES.CEO;
    }

    return false;
  }

  // =========================================================================
  // 2. TÀI NGUYÊN HỒ SƠ NHÂN SỰ (USER)
  // =========================================================================
  if (resource === RESOURCES.USER) {
    if (action === ACTIONS.READ) {
      if (role === ROLES.CEO || role === ROLES.HR_MANAGER) return true;
      if (targetUserId === currentUserId) return true;
      if (role === ROLES.MANAGER) {
        // Manager được xem hồ sơ nhân viên cấp dưới trực tiếp
        if (context.isDirectReport || (context.managerId && context.managerId.toString() === currentUserId)) {
          return true;
        }
        // Xem danh bạ phòng ban
        if (context.departmentId && user.departmentId && context.departmentId.toString() === user.departmentId.toString()) {
          return true;
        }
      }
      // Nhân viên xem danh bạ chung (chỉ các trường công khai)
      if (action === ACTIONS.READ && context.isPublicDirectory) return true;
      return false;
    }

    if (action === ACTIONS.UPDATE) {
      // Cập nhật thông tin cơ bản của chính mình
      if (targetUserId === currentUserId && context.isSelfBasicUpdate) return true;
      // HR và CEO quản lý hồ sơ nhân viên
      return role === ROLES.HR_MANAGER || role === ROLES.CEO;
    }

    if (action === ACTIONS.DELETE) {
      return role === ROLES.CEO;
    }
  }

  // =========================================================================
  // 3. TÀI NGUYÊN ĐƠN TỪ (LEAVE_REQUEST)
  // =========================================================================
  if (resource === RESOURCES.LEAVE_REQUEST) {
    if (action === ACTIONS.CREATE) return true; // Ai cũng tạo đơn được cho mình

    if (action === ACTIONS.READ) {
      if (role === ROLES.CEO || role === ROLES.HR_MANAGER) return true;
      if (targetUserId === currentUserId) return true;
      if (role === ROLES.MANAGER) {
        return context.isDirectReport || (context.managerId && context.managerId.toString() === currentUserId);
      }
      return false;
    }

    if (action === ACTIONS.APPROVE_STAGE_1) {
      // CẤM TỰ DUYỆT ĐƠN CỦA CHÍNH MÌNH
      if (context.applicantId && context.applicantId.toString() === currentUserId) {
        return false;
      }
      // Manager duyệt cho cấp dưới trực tiếp
      if (role === ROLES.MANAGER) {
        return context.isDirectReport || (context.managerId && context.managerId.toString() === currentUserId);
      }
      return role === ROLES.HR_MANAGER || role === ROLES.CEO;
    }

    if (action === ACTIONS.APPROVE_STAGE_2) {
      // HR Manager hoặc CEO duyệt cấp cuối
      if (context.applicantId && context.applicantId.toString() === currentUserId) {
        // Nếu chính HR nộp đơn thì CEO duyệt cấp 2
        return role === ROLES.CEO;
      }
      return role === ROLES.HR_MANAGER || role === ROLES.CEO;
    }
  }

  // =========================================================================
  // 4. CHẤM CÔNG (ATTENDANCE)
  // =========================================================================
  if (resource === RESOURCES.ATTENDANCE) {
    if (action === ACTIONS.READ) {
      if (role === ROLES.CEO || role === ROLES.HR_MANAGER) return true;
      if (targetUserId === currentUserId) return true;
      if (role === ROLES.MANAGER) {
        return context.isDirectReport || (context.managerId && context.managerId.toString() === currentUserId);
      }
      return false;
    }

    if (action === ACTIONS.UPDATE) {
      // Chỉ HR Manager được chỉnh sửa công thủ công (giải trình công)
      return role === ROLES.HR_MANAGER || role === ROLES.CEO;
    }
  }

  // =========================================================================
  // 5. BẢNG LƯƠNG KỲ & ML DỰ BÁO NGHỈ VIỆC
  // =========================================================================
  if (resource === RESOURCES.PAYROLL || resource === RESOURCES.RETENTION) {
    return role === ROLES.HR_MANAGER || role === ROLES.CEO;
  }

  // =========================================================================
  // 6. NHẬT KÝ KIỂM TOÁN (AUDIT_LOG)
  // =========================================================================
  if (resource === RESOURCES.AUDIT_LOG) {
    return role === ROLES.HR_MANAGER || role === ROLES.CEO;
  }

  return false;
};

/**
 * Middleware phân quyền tập trung kết hợp kiểm tra IDOR và ghi AuditLog
 */
export const authorize = (resource, action, getContext = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: User context missing' });
      }

      // Xây dựng context từ request
      let context = {};
      if (typeof getContext === 'function') {
        context = await getContext(req);
      } else {
        context = {
          targetUserId: req.params.userId || req.params.id || req.query.userId || req.body.userId,
          companyId: req.user.companyId,
          ...req.rbacContext,
        };
      }

      const allowed = canAccess(req.user, resource, action, context);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Bạn không có quyền thực hiện hành động ${action} trên tài nguyên ${resource}`,
        });
      }

      // Quy tắc bất biến: Ghi auditLogs khi HR/CEO xem lương của người khác
      if (
        resource === RESOURCES.SALARY &&
        action === ACTIONS.READ &&
        context.targetUserId &&
        context.targetUserId.toString() !== (req.user.userId || req.user.id).toString()
      ) {
        await AuditLog.create({
          companyId: req.user.companyId,
          userId: req.user.id || req.user.userId,
          action: AUDIT_ACTIONS.VIEW_SALARY_OTHER,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          details: {
            targetUserId: context.targetUserId,
            reason: 'Xem lương nhân sự',
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware kiểm tra Role trực tiếp
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User context missing' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Yêu cầu một trong các quyền [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra cấp bậc tối thiểu
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
        error: `Forbidden: Yêu cầu tối thiểu cấp độ ${minRole}`,
      });
    }

    next();
  };
};
