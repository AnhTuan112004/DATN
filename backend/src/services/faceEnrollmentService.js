import { z } from 'zod';
import { FaceTemplate, User, AuditLog } from '../models/index.js';
import { encryptDescriptors } from '../models/FaceTemplate.js';
import { AUDIT_ACTIONS } from '../config/constants.js';

// Schema xác thực dữ liệu lấy mẫu sinh trắc học theo Luật BVDLCN 91/2025/QH15
export const enrollFaceSchema = z.object({
  descriptors: z
    .array(
      z.array(z.number().refine((n) => Number.isFinite(n), 'Descriptor value must be a finite number'))
        .length(128, 'Mỗi vector embedding phải có chính xác 128 chiều')
    )
    .min(3, 'Cần tối thiểu 3 mẫu khuôn mặt để đảm bảo độ tin cậy nhận diện')
    .max(5, 'Tối đa thu thập 5 mẫu khuôn mặt'),
  hasConsent: z.literal(true, {
    errorMap: () => ({ message: 'Chủ thể dữ liệu bắt buộc phải xác nhận đồng ý theo Điều 13 Luật BVDLCN 91/2025/QH15' }),
  }),
  consentPolicyVersion: z.string().min(1).default('v2026.1'),
  modelName: z.string().default('face-api-ssd-mobilenetv1'),
  modelVersion: z.string().default('1.0'),
}).strict();

/**
 * Lấy trạng thái đăng ký sinh trắc học của nhân viên
 * Projection an toàn tuyệt đối: Tuyệt đối KHÔNG trả về descriptors hay encryptedPayload
 */
export const getFaceStatus = async (companyId, targetUserId) => {
  const user = await User.findOne({ _id: targetUserId, companyId });
  if (!user) {
    const error = new Error('Không tìm thấy nhân viên trong công ty');
    error.statusCode = 404;
    error.status = 404;
    throw error;
  }

  const template = await FaceTemplate.findOne({ companyId, userId: targetUserId })
    .populate('enrolledBy', 'fullName employeeCode role')
    .lean();

  if (!template) {
    return {
      hasFaceRegistered: false,
      sampleCount: 0,
      vectorDimension: 128,
      consent: null,
    };
  }

  return {
    hasFaceRegistered: true,
    sampleCount: template.descriptors ? template.descriptors.length : 0,
    vectorDimension: template.vectorDimension || 128,
    modelName: template.modelName || 'face-api-ssd-mobilenetv1',
    modelVersion: template.modelVersion || '1.0',
    consent: {
      hasConsent: template.hasConsent,
      consentTimestamp: template.consentTimestamp,
      consentPolicyVersion: template.consentPolicyVersion,
      registeredAt: template.registeredAt,
      enrolledBy: template.enrolledBy
        ? {
            _id: template.enrolledBy._id,
            fullName: template.enrolledBy.fullName,
            employeeCode: template.enrolledBy.employeeCode,
            role: template.enrolledBy.role,
          }
        : null,
    },
  };
};

/**
 * Thực hiện lấy mẫu trực tiếp có HR giám sát tại văn phòng
 * Mã hóa AES-256-GCM lưu trữ tại FaceTemplate, ghi AuditLog bảo mật
 */
export const enrollFace = async (companyId, targetUserId, payload, hrUser, reqInfo = {}) => {
  const validated = enrollFaceSchema.parse(payload);

  const targetUser = await User.findOne({ _id: targetUserId, companyId });
  if (!targetUser) {
    const error = new Error('Không tìm thấy nhân viên trong công ty');
    error.statusCode = 404;
    error.status = 404;
    throw error;
  }

  // Mã hóa vector embedding tại tầng ứng dụng bằng AES-256-GCM
  const encryptedPayload = encryptDescriptors(validated.descriptors);

  // Lưu hoặc cập nhật FaceTemplate của nhân viên
  const template = await FaceTemplate.findOneAndUpdate(
    { companyId, userId: targetUserId },
    {
      $set: {
        descriptors: validated.descriptors,
        encryptedPayload,
        modelName: validated.modelName,
        modelVersion: validated.modelVersion,
        vectorDimension: 128,
        hasConsent: true,
        consentTimestamp: new Date(),
        consentPolicyVersion: validated.consentPolicyVersion,
        enrolledBy: hrUser.userId || hrUser._id,
        registeredAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true }
  );

  // Ghi AuditLog tuân thủ Luật BVDLCN: Tuyệt đối CẤM ghi vector vào log
  await AuditLog.create({
    companyId,
    userId: hrUser.userId || hrUser._id,
    action: AUDIT_ACTIONS.ENROLL_BIOMETRIC_FACE,
    ipAddress: reqInfo.ip || null,
    userAgent: reqInfo.userAgent || null,
    details: {
      targetUserId,
      targetEmployeeCode: targetUser.employeeCode,
      targetFullName: targetUser.fullName,
      enrolledBy: hrUser.userId || hrUser._id,
      consentPolicyVersion: validated.consentPolicyVersion,
      sampleCount: validated.descriptors.length,
      vectorDimension: 128,
      legalBasis: 'Khoản 1 Điều 11 & Điều 13 Luật BVDLCN 91/2025/QH15',
    },
  });

  return {
    success: true,
    message: `Đã hoàn tất đăng ký sinh trắc học ${validated.descriptors.length} mẫu khuôn mặt có HR giám sát`,
    data: {
      hasFaceRegistered: true,
      sampleCount: validated.descriptors.length,
      consentPolicyVersion: validated.consentPolicyVersion,
      registeredAt: template.registeredAt,
    },
  };
};

/**
 * Quyền rút lại sự đồng ý & Xóa vĩnh viễn mẫu khuôn mặt
 * Tuân thủ Khoản 2 Điều 14 Luật BVDLCN 91/2025/QH15
 */
export const revokeFaceConsent = async (companyId, targetUserId, currentUser, reqInfo = {}) => {
  const targetUser = await User.findOne({ _id: targetUserId, companyId });
  if (!targetUser) {
    const error = new Error('Không tìm thấy nhân viên trong công ty');
    error.statusCode = 404;
    error.status = 404;
    throw error;
  }

  // Xóa vĩnh viễn document trong collection faceTemplates
  const result = await FaceTemplate.deleteOne({ companyId, userId: targetUserId });

  // Ghi AuditLog thu hồi đồng ý
  await AuditLog.create({
    companyId,
    userId: currentUser.userId || currentUser._id,
    action: AUDIT_ACTIONS.REVOKE_BIOMETRIC_CONSENT,
    ipAddress: reqInfo.ip || null,
    userAgent: reqInfo.userAgent || null,
    details: {
      targetUserId,
      targetEmployeeCode: targetUser.employeeCode,
      targetFullName: targetUser.fullName,
      revokedBy: currentUser.userId || currentUser._id,
      deletedCount: result.deletedCount,
      legalBasis: 'Khoản 2 Điều 14 Luật BVDLCN 91/2025/QH15 (Quyền rút lại sự đồng ý)',
    },
  });

  return {
    success: true,
    deleted: result.deletedCount > 0,
    message: 'Đã rút lại sự đồng ý và xóa vĩnh viễn dữ liệu sinh trắc học khuôn mặt theo Luật BVDLCN 91/2025/QH15',
  };
};
