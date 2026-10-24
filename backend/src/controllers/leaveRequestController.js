import * as leaveRequestService from '../services/leaveRequestService.js';
import {
  createLeaveRequestSchema,
  approveStage1Schema,
  approveStage2Schema,
  cancelLeaveRequestSchema,
} from '../validations/leaveRequestValidation.js';

/**
 * POST /api/leave-requests - Nộp đơn mới
 */
export const createLeaveRequest = async (req, res, next) => {
  try {
    const validatedData = createLeaveRequestSchema.parse(req.body);
    const leaveRequest = await leaveRequestService.createLeaveRequest(req.user, validatedData);
    res.status(201).json({
      success: true,
      message: 'Nộp đơn thành công',
      data: leaveRequest,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/leave-requests/:id/approve-manager - Phê duyệt Cấp 1 (Manager)
 */
export const approveStage1 = async (req, res, next) => {
  try {
    const validatedData = approveStage1Schema.parse(req.body);
    const updatedRequest = await leaveRequestService.approveStage1(
      req.params.id,
      req.user,
      validatedData
    );
    res.status(200).json({
      success: true,
      message: 'Xử lý phê duyệt Cấp 1 thành công',
      data: updatedRequest,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/leave-requests/:id/approve-hr - Phê duyệt Cấp 2 (HR Manager / CEO)
 */
export const approveStage2 = async (req, res, next) => {
  try {
    const validatedData = approveStage2Schema.parse(req.body);
    const updatedRequest = await leaveRequestService.approveStage2(
      req.params.id,
      req.user,
      validatedData
    );
    res.status(200).json({
      success: true,
      message: 'Xử lý phê duyệt Cấp 2 thành công',
      data: updatedRequest,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * POST /api/leave-requests/:id/cancel - Hủy đơn
 */
export const cancelLeaveRequest = async (req, res, next) => {
  try {
    const validatedData = cancelLeaveRequestSchema.parse(req.body);
    const cancelledRequest = await leaveRequestService.cancelLeaveRequest(
      req.params.id,
      req.user,
      validatedData.cancellationReason
    );
    res.status(200).json({
      success: true,
      message: 'Hủy đơn thành công',
      data: cancelledRequest,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ',
        details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    next(error);
  }
};

/**
 * GET /api/leave-requests - Danh sách đơn từ
 */
export const getLeaveRequests = async (req, res, next) => {
  try {
    const result = await leaveRequestService.getLeaveRequests(req.user, req.query);
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leave-requests/:id - Chi tiết đơn từ
 */
export const getLeaveRequestById = async (req, res, next) => {
  try {
    const leaveRequest = await leaveRequestService.getLeaveRequestById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
};
