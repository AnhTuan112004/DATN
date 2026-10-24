import mongoose from 'mongoose';
import { LEAVE_REQUEST_TYPES, APPROVAL_STATUS } from '../config/constants.js';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const ApprovalStepSchema = new Schema({
  approverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  decision: { type: String, enum: Object.values(APPROVAL_STATUS), default: APPROVAL_STATUS.PENDING },
  comment: { type: String, default: '' },
  decidedAt: { type: Date, default: null },
}, { _id: false });

const LeaveRequestSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
    immutable: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: Object.values(LEAVE_REQUEST_TYPES),
    required: true,
    index: true,
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationDays: { type: Number, required: true, default: 1 },
  otHoursRequested: { type: Number, default: 0 },

  // Chi tiết dành riêng cho đơn giải trình quên chấm công (FORGOT_CHECKIN)
  forgotDetails: {
    targetDate: { type: String, default: null }, // YYYY-MM-DD
    checkType: { type: String, enum: ['CHECK_IN', 'CHECK_OUT', 'BOTH', null], default: null },
    requestedTime: { type: String, default: null }, // HH:mm (ví dụ: '08:30')
  },

  reason: { type: String, required: true, trim: true },

  // Fixed 2-tier approval workflow
  status: {
    type: String,
    enum: Object.values(APPROVAL_STATUS),
    default: APPROVAL_STATUS.PENDING,
    index: true,
  },
  managerApproval: { type: ApprovalStepSchema, default: () => ({}) },
  hrApproval: { type: ApprovalStepSchema, default: () => ({}) },

  attachmentUrl: { type: String, default: null },
  cancellationReason: { type: String, default: null },
}, { timestamps: true });

LeaveRequestSchema.index({ companyId: 1, userId: 1, createdAt: -1 });
LeaveRequestSchema.index({ companyId: 1, status: 1 });
LeaveRequestSchema.index({ companyId: 1, type: 1 });

LeaveRequestSchema.plugin(tenantPlugin);

export const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);

