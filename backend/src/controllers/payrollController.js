import * as payrollService from '../services/payroll/payrollService.js';

/**
 * Chạy tính toán bảng lương cho kỳ period (YYYY-MM)
 */
export const calculatePayroll = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const { period, payDate } = req.body;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        success: false,
        error: 'Kỳ lương không hợp lệ. Định dạng yêu cầu: YYYY-MM (ví dụ: 2026-06)',
      });
    }

    const result = await payrollService.runCompanyPayroll({
      companyId,
      period,
      approverId: userId,
      payDate,
    });

    res.status(200).json({
      success: true,
      message: `Đã hoàn tất tính lương kỳ ${period} cho ${result.totalEmployees} nhân viên`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Khóa kỳ lương nguyên tử (chống sửa đổi)
 */
export const lockPayroll = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const { period } = req.body;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        success: false,
        error: 'Kỳ lương không hợp lệ. Định dạng yêu cầu: YYYY-MM',
      });
    }

    const result = await payrollService.lockCompanyPayroll({
      companyId,
      period,
      approverId: userId,
    });

    res.status(200).json({
      success: true,
      message: `Đã khóa kỳ lương ${period} thành công. Toàn bộ bảng lương đã chốt số liệu chính thức.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Tra cứu phiếu lương của chính người dùng đăng nhập
 */
export const getMyPayslip = async (req, res, next) => {
  try {
    const { companyId, userId } = req.user;
    const { period } = req.params;

    const payslip = await payrollService.getPayslip({
      companyId,
      requestUser: req.user,
      targetUserId: userId,
      period,
    });

    res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Tra cứu phiếu lương của nhân sự theo userId (có thẩm định IDOR & ghi audit log)
 */
export const getUserPayslip = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { userId, period } = req.params;

    const payslip = await payrollService.getPayslip({
      companyId,
      requestUser: req.user,
      targetUserId: userId,
      period,
    });

    res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Xem bảng lương tổng hợp toàn công ty (Dành cho HR/CEO)
 */
export const getCompanyPayrolls = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const { period } = req.params;

    const result = await payrollService.getCompanyPayrolls({
      companyId,
      requestUser: req.user,
      period,
      query: req.query,
    });

    res.status(200).json({
      success: true,
      data: result.payrolls,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};
