import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../config/constants.js';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

  action: {
    type: String,
    enum: Object.values(AUDIT_ACTIONS),
    required: true,
  },

  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

AuditLogSchema.plugin(tenantPlugin);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
