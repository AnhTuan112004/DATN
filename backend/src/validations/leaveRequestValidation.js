import { z } from 'zod';
import { LEAVE_REQUEST_TYPES, APPROVAL_STATUS } from '../config/constants.js';

export const createLeaveRequestSchema = z.object({
  type: z.enum(Object.values(LEAVE_REQUEST_TYPES), {
    required_error: 'Loại đơn là bắt buộc',
  }),
  startDate: z.string({ required_error: 'Ngày bắt đầu là bắt buộc' }),
  endDate: z.string({ required_error: 'Ngày kết thúc là bắt buộc' }),
  durationDays: z.number().min(0.5, 'Số ngày nghỉ tối thiểu là 0.5 ngày').max(365).default(1),
  otHoursRequested: z.number().min(0).max(12, 'Số giờ làm thêm tối đa 12h/ngày').optional().default(0),
  forgotDetails: z.object({
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày giải trình phải là YYYY-MM-DD'),
    checkType: z.enum(['CHECK_IN', 'CHECK_OUT', 'BOTH']).default('BOTH'),
    requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Định dạng giờ phải là HH:mm (VD: 08:30)').optional().default('08:30'),
  }).optional(),
  reason: z.string().min(3, 'Lý do tối thiểu 3 ký tự').max(500, 'Lý do tối đa 500 ký tự'),
  attachmentUrl: z.string().url('URL đính kèm không hợp lệ').nullable().optional(),
}).strict().refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu',
  path: ['endDate'],
});

export const approveStage1Schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', APPROVAL_STATUS.MANAGER_APPROVED, APPROVAL_STATUS.REJECTED], {
    required_error: 'Quyết định phê duyệt là bắt buộc',
  }),
  comment: z.string().max(500, 'Nhận xét tối đa 500 ký tự').optional().default(''),
}).strict();

export const approveStage2Schema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', APPROVAL_STATUS.HR_APPROVED, APPROVAL_STATUS.REJECTED], {
    required_error: 'Quyết định phê duyệt là bắt buộc',
  }),
  comment: z.string().max(500, 'Nhận xét tối đa 500 ký tự').optional().default(''),
}).strict();

export const cancelLeaveRequestSchema = z.object({
  cancellationReason: z.string().min(3, 'Lý do hủy đơn tối thiểu 3 ký tự').max(500, 'Lý do hủy tối đa 500 ký tự'),
}).strict();
