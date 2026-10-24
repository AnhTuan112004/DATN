import { getFaceStatus, enrollFace, revokeFaceConsent } from '../services/faceEnrollmentService.js';

export const getFaceStatusHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // RBAC: Nhân viên/Quản lý chỉ được xem trạng thái của chính mình; HR_MANAGER/CEO được xem mọi người
    const isSelf = (req.user.userId || req.user.id).toString() === id;
    const isHrOrCeo = ['CEO', 'HR_MANAGER'].includes(req.user.role);

    if (!isSelf && !isHrOrCeo) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin sinh trắc học của nhân viên khác',
      });
    }

    const result = await getFaceStatus(companyId, id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const enrollFaceHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const reqInfo = {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    };

    const result = await enrollFace(companyId, id, req.body, req.user, reqInfo);
    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Dữ liệu lấy mẫu không hợp lệ',
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const revokeFaceConsentHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // RBAC: Chủ thể dữ liệu tự rút lại đồng ý HOẶC HR Manager/CEO đại diện rút lại
    const isSelf = (req.user.userId || req.user.id).toString() === id;
    const isHrOrCeo = ['CEO', 'HR_MANAGER'].includes(req.user.role);

    if (!isSelf && !isHrOrCeo) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thu hồi dữ liệu sinh trắc học của nhân viên khác',
      });
    }

    const reqInfo = {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    };

    const result = await revokeFaceConsent(companyId, id, req.user, reqInfo);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
