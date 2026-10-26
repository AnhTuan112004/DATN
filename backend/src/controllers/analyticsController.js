/**
 * CONTROLLER PHÂN TÍCH NHÂN SỰ & DỰ BÁO NGUY CƠ THÔI VIỆC (ANALYTICS CONTROLLER)
 * Phân quyền: Chỉ CEO và HR_MANAGER được truy cập
 */

import mongoose from 'mongoose';
import { getCompanyAttritionAnalysis, calculateAttritionRisk } from '../services/attritionPredictorService.js';
import { User, AttendanceLog, AuditLog } from '../models/index.js';

export const getAttritionRiskOverview = async (req, res, next) => {
  try {
    const { companyId, userId, role } = req.user;
    const { departmentId } = req.query;

    const analysis = await getCompanyAttritionAnalysis({
      companyId,
      departmentId: departmentId || null,
    });

    // Ghi nhận AuditLog hành vi xem phân tích rủi ro nhân sự (bỏ qua khi đang chạy stress test)
    if (!req.headers['x-load-test']) {
      try {
        await AuditLog.create({
          companyId,
          userId,
          action: 'VIEW_ATTRITION_ANALYTICS',
          targetUserId: null,
          details: {
            role,
            departmentFilter: departmentId || 'ALL',
            totalEmployees: analysis.summary.totalEmployees,
            highRiskCount: analysis.summary.highRiskCount,
          },
        });
      } catch (auditErr) {
        console.warn('[AuditLog Warn] Không thể ghi log VIEW_ATTRITION_ANALYTICS:', auditErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeAttritionRisk = async (req, res, next) => {
  try {
    const { companyId, userId: actorId, role } = req.user;
    const { targetUserId } = req.params;

    const targetUser = await User.findOne({
      _id: targetUserId,
      companyId,
    })
      .select('+salaryConfig')
      .populate('departmentId', 'name code')
      .lean();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin nhân viên hoặc không có quyền truy cập.',
      });
    }

    // Lấy giờ OT trong 30 ngày qua
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const fromDateStr = thirtyDaysAgo.toISOString().split('T')[0];
    const toDateStr = now.toISOString().split('T')[0];

    const logs = await AttendanceLog.find({
      companyId,
      userId: targetUserId,
      date: mongoose.trusted({ $gte: fromDateStr, $lte: toDateStr }),
      status: 'VALID',
    })
      .select('overtimeMinutes')
      .lean();

    const totalOtMinutes = logs.reduce((sum, l) => sum + (l.overtimeMinutes || 0), 0);
    const totalOtHours = totalOtMinutes / 60;
    const overTime = totalOtHours >= 4 ? 1 : 0;

    const joinDate = targetUser.contracts?.[0]?.signedDate || targetUser.hireDate || now;
    const yearsAtCompany = Math.max(0.1, parseFloat(((now - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)));
    const monthlyIncome = targetUser.salaryConfig?.baseSalary ? targetUser.salaryConfig.baseSalary / 1000 : 5000;
    const totalWorkingYears = targetUser.totalWorkingYears || Math.max(1, Math.round(yearsAtCompany + 1));
    const numCompaniesWorked = targetUser.numCompaniesWorked || 1;
    const distanceFromHome = 8;

    const prediction = calculateAttritionRisk({
      overTime,
      yearsAtCompany,
      totalWorkingYears,
      monthlyIncome,
      numCompaniesWorked,
      distanceFromHome,
    });

    // Ghi AuditLog
    try {
      await AuditLog.create({
        companyId,
        userId: actorId,
        action: 'VIEW_EMPLOYEE_ATTRITION_RISK',
        targetUserId,
        details: {
          role,
          riskLevel: prediction.riskLevel,
          probability: prediction.probability,
        },
      });
    } catch (auditErr) {
      console.warn('[AuditLog Warn] Không thể ghi log VIEW_EMPLOYEE_ATTRITION_RISK:', auditErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: targetUser._id,
          employeeCode: targetUser.employeeCode,
          fullName: targetUser.fullName,
          department: targetUser.departmentId ? targetUser.departmentId.name : 'Chưa phân bổ',
          role: targetUser.role,
        },
        features: {
          overTime,
          otHoursMonth: parseFloat(totalOtHours.toFixed(1)),
          yearsAtCompany,
          totalWorkingYears,
          monthlyIncome: targetUser.salaryConfig?.baseSalary || 15000000,
          numCompaniesWorked,
          distanceFromHome,
        },
        prediction,
      },
    });
  } catch (err) {
    next(err);
  }
};
