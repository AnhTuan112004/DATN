import mongoose from 'mongoose';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUS } from '../config/constants.js';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const AttendanceLogSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
    immutable: true,
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },

  method: {
    type: String,
    enum: Object.values(ATTENDANCE_METHODS),
    required: true,
  },

  status: {
    type: String,
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.VALID,
    index: true,
  },

  deviceId: { type: String, default: null },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    distanceMeters: { type: Number, default: null },
  },

  workDurationMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },
  nightShiftMinutes: { type: Number, default: 0 },
  isLate: { type: Boolean, default: false },
  isEarlyLeave: { type: Boolean, default: false },

  adjustmentReason: { type: String, default: null },
  adjustedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Ensure unique attendance log per user per day
AttendanceLogSchema.index({ companyId: 1, userId: 1, date: 1 }, { unique: true });

// Áp dụng plugin Multi-tenant Fail-Closed
AttendanceLogSchema.plugin(tenantPlugin);

export const AttendanceLog = mongoose.model('AttendanceLog', AttendanceLogSchema);
