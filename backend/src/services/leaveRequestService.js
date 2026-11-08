import mongoose from 'mongoose';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { User } from '../models/User.js';
import { AttendanceLog } from '../models/AttendanceLog.js';
import { Notification } from '../models/Notification.js';
import { createAndSendNotification } from './notificationService.js';
import { AuditLog } from '../models/AuditLog.js';
import { EmailService } from './emailService.js';
import {
  ROLES,
  LEAVE_REQUEST_TYPES,
  APPROVAL_STATUS,
  AUDIT_ACTIONS,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
} from '../config/constants.js';
/**
 * Khởi tạo session transaction an toàn:
 * Chỉ kích hoạt multi-document transaction khi MongoDB chạy Replica Set hoặc Sharded Cluster (như Mongo Atlas).
 * Nếu chạy MongoDB Standalone (Local/CI), trả về null và áp dụng atomic precondition single-document ($gte, $inc).
 */
const startSafeSession = async () => {
  const topologyType = mongoose.connection.client?.topology?.description?.type || '';
  const isReplicaSet = topologyType.includes('ReplicaSet') || topologyType.includes('Sharded');
  if (!isReplicaSet) return null;

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch {
    return null;
  }
};

/**
 * 1. Nộp đơn xin nghỉ phép / OT / WFH / Giải trình công
 */
export const createLeaveRequest = async (currentUser, data) => {
  const companyId = currentUser.companyId;
  const userId = currentUser._id || currentUser.userId;

  // Lấy hồ sơ người nộp đơn để kiểm tra số dư phép và cơ cấu quản lý
  const user = await User.findOne({ _id: userId, companyId }).select('+salaryConfig');
  if (!user) {
    const error = new Error('Không tìm thấy thông tin nhân viên nộp đơn');
    error.statusCode = 404;
    throw error;
  }

  const durationDays = data.durationDays || 1;

  // 1.1 Kiểm tra số dư phép trước khi nộp
  if (data.type === LEAVE_REQUEST_TYPES.ANNUAL) {
    const remaining = user.leaveBalance?.annualRemaining ?? 0;
    if (remaining < durationDays) {
      const error = new Error(`Số dư phép năm không đủ. Còn lại: ${remaining} ngày, yêu cầu: ${durationDays} ngày.`);
      error.statusCode = 422;
      throw error;
    }
  }

  if (data.type === LEAVE_REQUEST_TYPES.SICK) {
    const remaining = user.leaveBalance?.sickRemaining ?? 0;
    if (remaining < durationDays) {
      const error = new Error(`Số dư phép ốm không đủ. Còn lại: ${remaining} ngày, yêu cầu: ${durationDays} ngày.`);
      error.statusCode = 422;
      throw error;
    }
  }

  // 1.2 Kiểm tra giới hạn làm thêm giờ (OT) theo Điều 98 BLLĐ (khuyến cáo tối đa 4h/ngày)
  if (data.type === LEAVE_REQUEST_TYPES.OT) {
    if (!data.otHoursRequested || data.otHoursRequested <= 0) {
      const error = new Error('Đơn làm thêm giờ (OT) bắt buộc phải có số giờ làm thêm hợp lệ.');
      error.statusCode = 422;
      throw error;
    }
  }

  // 1.3 Kiểm tra đơn giải trình quên chấm công (FORGOT_CHECKIN)
  if (data.type === LEAVE_REQUEST_TYPES.FORGOT_CHECKIN) {
    if (!data.forgotDetails?.targetDate) {
      const error = new Error('Đơn giải trình chấm công bắt buộc phải có ngày cần giải trình.');
      error.statusCode = 422;
      throw error;
    }
    const targetDate = new Date(data.forgotDetails.targetDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (targetDate > today) {
      const error = new Error('Không thể tạo đơn giải trình công cho ngày trong tương lai.');
      error.statusCode = 422;
      throw error;
    }
  }

  // 1.4 Xác định trạng thái ban đầu:
  // Nếu là CEO hoặc HR Manager / Manager không có managerId cấp trên -> chuyển thẳng sang MANAGER_APPROVED
  let initialStatus = APPROVAL_STATUS.PENDING;
  let managerApprovalData = {};

  const isHighLevel = user.role === ROLES.CEO || user.role === ROLES.HR_MANAGER;
  const isManagerWithoutSuperior = user.role === ROLES.MANAGER && !user.managerId;

  if (isHighLevel || isManagerWithoutSuperior) {
    initialStatus = APPROVAL_STATUS.MANAGER_APPROVED;
    managerApprovalData = {
      approverId: userId,
      decision: APPROVAL_STATUS.MANAGER_APPROVED,
      comment: 'Tự động duyệt cấp 1 (Cán bộ quản lý / Trưởng bộ phận)',
      decidedAt: new Date(),
    };
  }

  // 1.5 Tạo bản ghi LeaveRequest
  const leaveRequest = new LeaveRequest({
    companyId,
    userId,
    type: data.type,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    durationDays,
    otHoursRequested: data.otHoursRequested || 0,
    forgotDetails: data.forgotDetails || {},
    reason: data.reason,
    attachmentUrl: data.attachmentUrl || null,
    attachmentName: data.attachmentName || null,
    status: initialStatus,
    managerApproval: managerApprovalData,
  });

  await leaveRequest.save();

  // 1.6 Ghi vết AuditLog
  await AuditLog.create({
    companyId,
    userId,
    action: AUDIT_ACTIONS.CREATE_LEAVE_REQUEST,
    targetUserId: userId,
    details: {
      leaveRequestId: leaveRequest._id,
      type: data.type,
      durationDays,
      status: initialStatus,
    },
  });

  // 1.7 Gửi thông báo cho Quản lý cấp 1 hoặc HR Manager / CEO
  try {
    const typeLabel = data.type === 'FREE_FORM'
      ? 'Đơn tự do (kèm tài liệu Word)'
      : `đơn ${data.type}`;

    if (initialStatus === APPROVAL_STATUS.MANAGER_APPROVED) {
      // Đơn đã tự động qua cấp 1 (do người nộp là Quản lý hoặc cấp cao) -> Báo thẳng cho HR Manager & CEO duyệt cấp 2
      const hrCeoList = await User.find({
        companyId,
        role: { $in: [ROLES.HR_MANAGER, ROLES.CEO] },
        isActive: true,
      }).select('_id');

      for (const admin of hrCeoList) {
        if (admin._id.toString() !== userId.toString()) {
          await createAndSendNotification({
            companyId,
            userId: admin._id,
            title: '📋 Đơn từ mới cần CEO / HR phê duyệt',
            message: `Nhân viên ${user.fullName} (${user.employeeCode}) đã gửi ${typeLabel} (${durationDays} ngày). Đơn đang chờ Ban Giám Đốc / HR phê duyệt.`,
            type: 'LEAVE_REQUEST',
            data: { leaveRequestId: leaveRequest._id, type: data.type, requiresApproval: true },
          });
        }
      }
    } else {
      // Đơn ở trạng thái PENDING chờ cấp 1
      const notifyTargetId = user.managerId || null;
      if (notifyTargetId) {
        await createAndSendNotification({
          companyId,
          userId: notifyTargetId,
          title: '📋 Đơn từ mới cần Trưởng phòng duyệt',
          message: `Nhân sự ${user.fullName} (${user.employeeCode}) đã gửi ${typeLabel} (${durationDays} ngày). Vui lòng xem xét duyệt.`,
          type: 'LEAVE_REQUEST',
          data: { leaveRequestId: leaveRequest._id, type: data.type, requiresApproval: true },
        });
      } else {
        // Không có quản lý trực tiếp -> gửi thông báo cho HR Managers và CEOs
        const hrCeoList = await User.find({
          companyId,
          role: { $in: [ROLES.HR_MANAGER, ROLES.CEO] },
          isActive: true,
        }).select('_id');

        for (const admin of hrCeoList) {
          if (admin._id.toString() !== userId.toString()) {
            await createAndSendNotification({
              companyId,
              userId: admin._id,
              title: '📋 Đơn từ mới cần phê duyệt',
              message: `Nhân sự ${user.fullName} (${user.employeeCode}) đã gửi ${typeLabel} (${durationDays} ngày). Vui lòng xem xét duyệt.`,
              type: 'LEAVE_REQUEST',
              data: { leaveRequestId: leaveRequest._id, type: data.type, requiresApproval: true },
            });
          }
        }
      }
    }
  } catch (notifErr) {
    console.warn('[Notification Error]', notifErr.message);
  }

  return leaveRequest;
};

/**
 * 2. Phê duyệt Cấp 1 (Manager Approval)
 */
export const approveStage1 = async (requestId, approverUser, { decision, comment }) => {
  const companyId = approverUser.companyId;
  const approverId = approverUser._id || approverUser.userId;

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, companyId });
  if (!leaveRequest) {
    const error = new Error('Không tìm thấy đơn từ yêu cầu');
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== APPROVAL_STATUS.PENDING) {
    const error = new Error(`Đơn không ở trạng thái chờ duyệt cấp 1 (Hiện tại: ${leaveRequest.status})`);
    error.statusCode = 400;
    throw error;
  }

  // BẢO VỆ CHỐNG TỰ DUYỆT (Anti-Self-Approval)
  if (leaveRequest.userId.toString() === approverId.toString()) {
    const error = new Error('Bạn tuyệt đối không được phép tự phê duyệt đơn của chính mình');
    error.statusCode = 403;
    throw error;
  }

  const applicant = await User.findOne({ _id: leaveRequest.userId, companyId });
  if (!applicant) {
    const error = new Error('Không tìm thấy người nộp đơn');
    error.statusCode = 404;
    throw error;
  }

  // Quản lý (MANAGER) chỉ được duyệt nhân viên cấp dưới thuộc quyền
  if (approverUser.role === ROLES.MANAGER) {
    const isDirectReport = applicant.managerId && applicant.managerId.toString() === approverId.toString();
    const isSameDept = applicant.departmentId && approverUser.departmentId && applicant.departmentId.toString() === approverUser.departmentId.toString();

    if (!isDirectReport && !isSameDept) {
      const error = new Error('Trưởng phòng chỉ có quyền phê duyệt đơn của nhân sự thuộc bộ phận phụ trách');
      error.statusCode = 403;
      throw error;
    }
  } else if (approverUser.role === ROLES.HR_MANAGER || approverUser.role === ROLES.CEO) {
    // Nếu nhân viên có Trưởng phòng trực tiếp, HR/CEO không duyệt cấp 1 thay Trưởng phòng
    const hasDirectManager = Boolean(applicant.managerId && applicant.managerId.toString() !== approverId.toString());
    if (hasDirectManager && applicant.role === ROLES.EMPLOYEE) {
      const error = new Error('Đơn này cần được Trưởng phòng trực tiếp xem xét và phê duyệt cấp 1 trước khi chuyển lên HR/CEO');
      error.statusCode = 403;
      throw error;
    }
  }

  const isApproval = decision === 'APPROVE' || decision === APPROVAL_STATUS.MANAGER_APPROVED;

  if (isApproval) {
    leaveRequest.status = APPROVAL_STATUS.MANAGER_APPROVED;
    leaveRequest.managerApproval = {
      approverId,
      decision: APPROVAL_STATUS.MANAGER_APPROVED,
      comment: comment || '',
      decidedAt: new Date(),
    };
  } else {
    leaveRequest.status = APPROVAL_STATUS.REJECTED;
    leaveRequest.managerApproval = {
      approverId,
      decision: APPROVAL_STATUS.REJECTED,
      comment: comment || '',
      decidedAt: new Date(),
    };
  }

  await leaveRequest.save();

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: approverId,
    action: isApproval ? AUDIT_ACTIONS.APPROVE_LEAVE_STAGE_1 : AUDIT_ACTIONS.REJECT_LEAVE_REQUEST,
    targetUserId: leaveRequest.userId,
    details: {
      leaveRequestId: leaveRequest._id,
      decision: leaveRequest.status,
      comment,
    },
  });

  // Gửi Notification cho người nộp đơn & HR/CEO
  try {
    await createAndSendNotification({
      companyId,
      userId: leaveRequest.userId,
      title: isApproval ? 'Đơn đã qua cấp 1' : 'Đơn bị từ chối',
      message: isApproval
        ? `Trưởng phòng đã duyệt đơn ${leaveRequest.type}. Đơn đang chờ phòng Nhân sự (HR) / Ban Giám Đốc phê duyệt cấp cuối.`
        : `Trưởng phòng đã từ chối đơn ${leaveRequest.type}. Lý do: ${comment || 'Không có'}`,
      type: 'LEAVE_REQUEST',
      data: { leaveRequestId: leaveRequest._id, status: leaveRequest.status },
    });

    if (isApproval) {
      // Thông báo cho HR Managers và CEO biết đơn đã qua Trưởng phòng duyệt, cần phê duyệt Cấp 2
      const hrCeoList = await User.find({
        companyId,
        role: { $in: [ROLES.HR_MANAGER, ROLES.CEO] },
        isActive: true,
      }).select('_id');

      for (const admin of hrCeoList) {
        if (admin._id.toString() !== approverId.toString()) {
          await createAndSendNotification({
            companyId,
            userId: admin._id,
            title: 'Đơn từ chờ duyệt Cấp 2',
            message: `Trưởng phòng đã duyệt đơn ${leaveRequest.type} của ${applicant.fullName} (${applicant.employeeCode}). Vui lòng phê duyệt chính thức.`,
            type: 'LEAVE_REQUEST',
            data: { leaveRequestId: leaveRequest._id, status: leaveRequest.status },
          });
        }
      }
    }
  } catch (notifErr) {
    console.warn('[Notification Error]', notifErr.message);
  }

  return leaveRequest;
};

/**
 * 3. Phê duyệt Cấp 2 (HR Manager / CEO Final Approval) & Trừ phép nguyên tử
 */
export const approveStage2 = async (requestId, approverUser, { decision, comment }) => {
  const companyId = approverUser.companyId;
  const approverId = approverUser._id || approverUser.userId;

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, companyId });
  if (!leaveRequest) {
    const error = new Error('Không tìm thấy đơn từ yêu cầu');
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== APPROVAL_STATUS.MANAGER_APPROVED) {
    const error = new Error(`Đơn phải được Quản lý duyệt cấp 1 trước khi HR phê duyệt (Hiện tại: ${leaveRequest.status})`);
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra quyền hạn HR Manager / CEO
  if (approverUser.role !== ROLES.HR_MANAGER && approverUser.role !== ROLES.CEO) {
    const error = new Error('Chỉ HR Manager hoặc CEO mới có thẩm quyền phê duyệt cấp cuối');
    error.statusCode = 403;
    throw error;
  }

  // Chống tự duyệt: Nếu người nộp đơn là chính HR Manager này, phải do CEO duyệt
  if (leaveRequest.userId.toString() === approverId.toString() && approverUser.role !== ROLES.CEO) {
    const error = new Error('Đơn của HR Manager phải do CEO trực tiếp phê duyệt');
    error.statusCode = 403;
    throw error;
  }

  const isApproval = decision === 'APPROVE' || decision === APPROVAL_STATUS.HR_APPROVED;

  // 3.1 Nếu từ chối (REJECT)
  if (!isApproval) {
    leaveRequest.status = APPROVAL_STATUS.REJECTED;
    leaveRequest.hrApproval = {
      approverId,
      decision: APPROVAL_STATUS.REJECTED,
      comment: comment || '',
      decidedAt: new Date(),
    };
    await leaveRequest.save();

    await AuditLog.create({
      companyId,
      userId: approverId,
      action: AUDIT_ACTIONS.REJECT_LEAVE_REQUEST,
      targetUserId: leaveRequest.userId,
      details: { leaveRequestId: leaveRequest._id, comment },
    });

    try {
      await createAndSendNotification({
        companyId,
        userId: leaveRequest.userId,
        title: 'Đơn bị HR từ chối',
        message: `Phòng Nhân sự đã từ chối đơn ${leaveRequest.type}. Lý do: ${comment || 'Không có'}`,
        type: 'LEAVE_REQUEST',
        data: { leaveRequestId: leaveRequest._id, status: leaveRequest.status },
      });

      // Gửi Email thông báo từ chối cho nhân viên
      const applicant = await User.findOne({ _id: leaveRequest.userId, companyId }).select('fullName email');
      if (applicant?.email) {
        EmailService.sendLeaveApprovalEmail({
          employeeEmail: applicant.email,
          employeeName: applicant.fullName,
          type: leaveRequest.type,
          durationDays: leaveRequest.durationDays,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          decision: 'REJECT',
          approverName: approverUser.fullName || 'Phòng Nhân sự & Ban Giám Đốc',
          comment: comment || '',
        }).catch((mailErr) => console.warn('[Email Error]', mailErr.message));
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return leaveRequest;
  }

  // 3.2 Nếu PHÊ DUYỆT (APPROVE) -> Thực hiện trừ phép nguyên tử (Atomic / Transaction)
  const session = await startSafeSession();

  try {
    const opts = session ? { session, new: true } : { new: true };

    // Trừ phép năm nếu là đơn ANNUAL
    if (leaveRequest.type === LEAVE_REQUEST_TYPES.ANNUAL) {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: leaveRequest.userId,
          companyId,
          'leaveBalance.annualRemaining': mongoose.trusted({ $gte: leaveRequest.durationDays }),
        },
        {
          $inc: {
            'leaveBalance.annualRemaining': -leaveRequest.durationDays,
            'leaveBalance.annualUsed': leaveRequest.durationDays,
          },
        },
        opts
      );

      if (!updatedUser) {
        const error = new Error(`Số dư phép năm không đủ hoặc có xung đột dữ liệu (Yêu cầu: ${leaveRequest.durationDays} ngày).`);
        error.statusCode = 422;
        throw error;
      }
    }

    // Trừ phép ốm nếu là đơn SICK
    if (leaveRequest.type === LEAVE_REQUEST_TYPES.SICK) {
      const updatedUser = await User.findOneAndUpdate(
        {
          _id: leaveRequest.userId,
          companyId,
          'leaveBalance.sickRemaining': mongoose.trusted({ $gte: leaveRequest.durationDays }),
        },
        {
          $inc: {
            'leaveBalance.sickRemaining': -leaveRequest.durationDays,
            'leaveBalance.sickUsed': leaveRequest.durationDays,
          },
        },
        opts
      );

      if (!updatedUser) {
        const error = new Error(`Số dư phép ốm không đủ hoặc có xung đột dữ liệu (Yêu cầu: ${leaveRequest.durationDays} ngày).`);
        error.statusCode = 422;
        throw error;
      }
    }

    // Tự động bù công nếu là đơn FORGOT_CHECKIN
    if (leaveRequest.type === LEAVE_REQUEST_TYPES.FORGOT_CHECKIN) {
      const targetDate = leaveRequest.forgotDetails?.targetDate || leaveRequest.startDate.toISOString().slice(0, 10);
      const reqTime = leaveRequest.forgotDetails?.requestedTime || '08:30';

      const existingLog = await AttendanceLog.findOne({
        companyId,
        userId: leaveRequest.userId,
        date: targetDate,
      }).session(session || undefined);

      if (existingLog) {
        existingLog.status = ATTENDANCE_STATUS.VALID;
        existingLog.method = ATTENDANCE_METHODS.MANUAL_ADJUSTMENT;
        if (!existingLog.workDurationMinutes || existingLog.workDurationMinutes === 0) {
          existingLog.workDurationMinutes = 480;
        }
        await existingLog.save(session ? { session } : {});
      } else {
        const [hours, minutes] = reqTime.split(':').map(Number);
        const checkInDate = new Date(`${targetDate}T00:00:00.000Z`);
        checkInDate.setUTCHours(hours || 8, minutes || 30, 0, 0);

        const newLog = new AttendanceLog({
          companyId,
          userId: leaveRequest.userId,
          date: targetDate,
          checkInTime: checkInDate,
          method: ATTENDANCE_METHODS.MANUAL_ADJUSTMENT,
          status: ATTENDANCE_STATUS.VALID,
          workDurationMinutes: 480,
        });
        await newLog.save(session ? { session } : {});
      }
    }

    // Cập nhật trạng thái LeaveRequest
    leaveRequest.status = APPROVAL_STATUS.HR_APPROVED;
    leaveRequest.hrApproval = {
      approverId,
      decision: APPROVAL_STATUS.HR_APPROVED,
      comment: comment || '',
      decidedAt: new Date(),
    };

    await leaveRequest.save(session ? { session } : {});

    if (session) {
      await session.commitTransaction();
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: approverId,
    action: AUDIT_ACTIONS.APPROVE_LEAVE_STAGE_2,
    targetUserId: leaveRequest.userId,
    details: {
      leaveRequestId: leaveRequest._id,
      type: leaveRequest.type,
      durationDays: leaveRequest.durationDays,
    },
  });

  // Gửi thông báo & Email cho người nộp đơn
  try {
    await createAndSendNotification({
      companyId,
      userId: leaveRequest.userId,
      title: 'Đơn đã được phê duyệt thành công',
      message: `Đơn ${leaveRequest.type} (${leaveRequest.durationDays} ngày) đã được HR Manager / Ban Giám Đốc phê duyệt chính thức.`,
      type: 'LEAVE_REQUEST',
      data: { leaveRequestId: leaveRequest._id, status: leaveRequest.status },
    });

    // Gửi Email thông báo phê duyệt thành công cho nhân viên
    const applicant = await User.findOne({ _id: leaveRequest.userId, companyId }).select('fullName email');
    if (applicant?.email) {
      EmailService.sendLeaveApprovalEmail({
        employeeEmail: applicant.email,
        employeeName: applicant.fullName,
        type: leaveRequest.type,
        durationDays: leaveRequest.durationDays,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        decision: 'APPROVE',
        approverName: approverUser.fullName || 'Phòng Nhân sự & Ban Giám Đốc',
        comment: comment || '',
      }).catch((mailErr) => console.warn('[Email Error]', mailErr.message));
    }
  } catch (notifErr) {
    console.warn('[Notification Error]', notifErr.message);
  }

  return leaveRequest;
};

/**
 * 4. Hủy đơn (Cancel Leave Request) & Hoàn trả phép tự động
 */
export const cancelLeaveRequest = async (requestId, currentUser, cancellationReason) => {
  const companyId = currentUser.companyId;
  const currentUserId = (currentUser._id || currentUser.userId).toString();

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, companyId });
  if (!leaveRequest) {
    const error = new Error('Không tìm thấy đơn từ yêu cầu');
    error.statusCode = 404;
    throw error;
  }

  // Quyền hủy: Chỉ người nộp đơn HOẶC HR/CEO mới có quyền hủy
  const isOwner = leaveRequest.userId.toString() === currentUserId;
  const isHRorCEO = currentUser.role === ROLES.HR_MANAGER || currentUser.role === ROLES.CEO;

  if (!isOwner && !isHRorCEO) {
    const error = new Error('Bạn không có quyền hủy đơn của người khác');
    error.statusCode = 403;
    throw error;
  }

  if (leaveRequest.status === APPROVAL_STATUS.CANCELLED || leaveRequest.status === APPROVAL_STATUS.REJECTED) {
    const error = new Error(`Đơn đã ở trạng thái kết thúc (${leaveRequest.status}), không thể hủy.`);
    error.statusCode = 400;
    throw error;
  }

  // 4.1 Nếu đơn ĐÃ DUYỆT CẤP CUỐI (HR_APPROVED): Hoàn trả phép lại cho nhân viên nguyên tử
  if (leaveRequest.status === APPROVAL_STATUS.HR_APPROVED) {
    const session = await startSafeSession();

    try {
      const opts = session ? { session, new: true } : { new: true };

      if (leaveRequest.type === LEAVE_REQUEST_TYPES.ANNUAL) {
        await User.findOneAndUpdate(
          { _id: leaveRequest.userId, companyId },
          {
            $inc: {
              'leaveBalance.annualRemaining': leaveRequest.durationDays,
              'leaveBalance.annualUsed': -leaveRequest.durationDays,
            },
          },
          opts
        );
      }

      if (leaveRequest.type === LEAVE_REQUEST_TYPES.SICK) {
        await User.findOneAndUpdate(
          { _id: leaveRequest.userId, companyId },
          {
            $inc: {
              'leaveBalance.sickRemaining': leaveRequest.durationDays,
              'leaveBalance.sickUsed': -leaveRequest.durationDays,
            },
          },
          opts
        );
      }

      leaveRequest.status = APPROVAL_STATUS.CANCELLED;
      leaveRequest.cancellationReason = cancellationReason;
      await leaveRequest.save(session ? { session } : {});

      if (session) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session) await session.abortTransaction();
      throw error;
    } finally {
      if (session) session.endSession();
    }
  } else {
    // Nếu đơn chưa qua HR duyệt (PENDING hoặc MANAGER_APPROVED), chỉ cần đổi trạng thái
    leaveRequest.status = APPROVAL_STATUS.CANCELLED;
    leaveRequest.cancellationReason = cancellationReason;
    await leaveRequest.save();
  }

  // Ghi AuditLog
  await AuditLog.create({
    companyId,
    userId: currentUserId,
    action: AUDIT_ACTIONS.CANCEL_LEAVE_REQUEST,
    targetUserId: leaveRequest.userId,
    details: {
      leaveRequestId: leaveRequest._id,
      previousStatus: leaveRequest.status,
      cancellationReason,
    },
  });

  return leaveRequest;
};

/**
 * 5. Lấy danh sách đơn từ (có phân trang, bộ lọc và phân quyền xem)
 */
export const getLeaveRequests = async (currentUser, {
  page = 1,
  limit = 20,
  status,
  type,
  scope = 'all', // 'my', 'team', 'all'
  startDate,
  endDate,
}) => {
  const companyId = currentUser.companyId;
  const currentUserId = (currentUser._id || currentUser.userId).toString();
  const filter = { companyId };

  // Phân quyền xem đơn
  if (currentUser.role === ROLES.EMPLOYEE || scope === 'my') {
    filter.userId = currentUserId;
  } else if (currentUser.role === ROLES.MANAGER) {
    if (scope === 'pending_stage1') {
      // Đơn cấp dưới cần Trưởng phòng duyệt ngay (Cấp 1)
      const teamUsers = await User.find({
        companyId,
        $or: [
          { managerId: currentUserId },
          { departmentId: currentUser.departmentId },
        ],
      }).select('_id');
      const teamUserIds = teamUsers.map((u) => u._id);
      filter.userId = { $in: teamUserIds };
      filter.status = APPROVAL_STATUS.PENDING;
    } else if (scope === 'team') {
      // Tìm các nhân viên thuộc quyền quản lý
      const teamUsers = await User.find({
        companyId,
        $or: [
          { managerId: currentUserId },
          { departmentId: currentUser.departmentId },
        ],
      }).select('_id');
      const teamUserIds = teamUsers.map((u) => u._id);
      filter.userId = { $in: teamUserIds };
    } else {
      // Mặc định cho Manager: đơn của mình + đơn của nhân viên cấp dưới
      const teamUsers = await User.find({
        companyId,
        $or: [
          { managerId: currentUserId },
          { departmentId: currentUser.departmentId },
        ],
      }).select('_id');
      const teamUserIds = teamUsers.map((u) => u._id);
      teamUserIds.push(currentUserId);
      filter.userId = { $in: teamUserIds };
    }
  } else {
    // HR Manager & CEO xem toàn công ty (trừ khi họ chủ động lọc scope='my' hoặc scope='stage2')
    if (scope === 'my') {
      filter.userId = currentUserId;
    } else if (scope === 'stage2') {
      // Đơn đã qua Trưởng phòng duyệt (Cấp 1), đang chờ HR/CEO duyệt chính thức (Cấp 2)
      filter.status = APPROVAL_STATUS.MANAGER_APPROVED;
    }
  }

  if (status) filter.status = status;
  if (type) filter.type = type;

  if (startDate || endDate) {
    const dateRange = {};
    if (startDate) dateRange.$gte = new Date(startDate);
    if (endDate) dateRange.$lte = new Date(endDate);
    filter.startDate = mongoose.trusted(dateRange);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName employeeCode email avatarUrl departmentId role')
      .populate('managerApproval.approverId', 'fullName employeeCode')
      .populate('hrApproval.approverId', 'fullName employeeCode')
      .lean(),
    LeaveRequest.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * 6. Lấy chi tiết đơn từ theo ID
 */
export const getLeaveRequestById = async (requestId, currentUser) => {
  const companyId = currentUser.companyId;
  const currentUserId = (currentUser._id || currentUser.userId).toString();

  const leaveRequest = await LeaveRequest.findOne({ _id: requestId, companyId })
    .populate('userId', 'fullName employeeCode email avatarUrl departmentId role leaveBalance')
    .populate('managerApproval.approverId', 'fullName employeeCode')
    .populate('hrApproval.approverId', 'fullName employeeCode');

  if (!leaveRequest) {
    const error = new Error('Không tìm thấy đơn từ yêu cầu');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra quyền xem
  if (currentUser.role === ROLES.EMPLOYEE) {
    if (leaveRequest.userId._id.toString() !== currentUserId) {
      const error = new Error('Bạn không có quyền truy cập đơn của nhân viên khác');
      error.statusCode = 403;
      throw error;
    }
  } else if (currentUser.role === ROLES.MANAGER) {
    const isOwner = leaveRequest.userId._id.toString() === currentUserId;
    const applicant = await User.findOne({ _id: leaveRequest.userId._id, companyId });
    const isDirectReport = applicant && applicant.managerId && applicant.managerId.toString() === currentUserId;
    const isSameDept = applicant && applicant.departmentId && currentUser.departmentId && applicant.departmentId.toString() === currentUser.departmentId.toString();

    if (!isOwner && !isDirectReport && !isSameDept) {
      const error = new Error('Quản lý chỉ có quyền xem đơn của nhân sự thuộc bộ phận phụ trách');
      error.statusCode = 403;
      throw error;
    }
  }

  return leaveRequest;
};
