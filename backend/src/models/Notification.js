import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
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

export const Notification = mongoose.model('Notification', NotificationSchema);
