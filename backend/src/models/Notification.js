import mongoose from 'mongoose';
import { tenantPlugin } from '../plugins/tenantPlugin.js';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true, immutable: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['SYSTEM', 'LEAVE_REQUEST', 'ATTENDANCE_ALERT', 'CONTRACT_EXPIRY', 'PAYROLL_READY'],
    default: 'SYSTEM',
  },

  isRead: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ companyId: 1, 'data.idempotencyKey': 1 });

NotificationSchema.plugin(tenantPlugin);

export const Notification = mongoose.model('Notification', NotificationSchema);
