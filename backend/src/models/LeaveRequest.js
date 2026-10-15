import mongoose from 'mongoose';
import { LEAVE_REQUEST_TYPES, APPROVAL_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const ApprovalStepSchema = new Schema({
  approverId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  decision: { type: String, enum: Object.values(APPROVAL_STATUS), default: APPROVAL_STATUS.PENDING },
  comment: { type: String, default: '' },
  decidedAt: { type: Date, default: null },
}, { _id: false });

const LeaveRequestSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  type: {
    type: String,
    enum: Object.values(LEAVE_REQUEST_TYPES),
    required: true,
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationDays: { type: Number, required: true },
  otHoursRequested: { type: Number, default: 0 },
  reason: { type: String, required: true },

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
}, { timestamps: true });

export const LeaveRequest = mongoose.model('LeaveRequest', LeaveRequestSchema);
